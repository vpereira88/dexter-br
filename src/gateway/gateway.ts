import { createChannelManager } from './channels/manager.js';
import { createWhatsAppPlugin } from './channels/whatsapp/plugin.js';
import {
  assertOutboundAllowed,
  sendComposing,
  sendMessageWhatsApp,
  type WhatsAppInboundMessage,
} from './channels/whatsapp/index.js';
import { resolveRoute } from './routing/resolve-route.js';
import { resolveSessionStorePath, upsertSessionMeta } from './sessions/store.js';
import { loadGatewayConfig, type GatewayConfig } from './config.js';
import { runAgentForMessage } from './agent-runner.js';
import { cleanMarkdownForWhatsApp } from './utils.js';
import { startHeartbeatRunner } from './heartbeat/index.js';
import { appendGatewayDebugLog } from './debug-log.js';

function debugLog(msg: string) {
  appendGatewayDebugLog(msg);
}

export type GatewayService = {
  stop: () => Promise<void>;
  snapshot: () => Record<string, { accountId: string; running: boolean; connected?: boolean }>;
};

function elide(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

async function handleInbound(
  cfg: GatewayConfig,
  inbound: WhatsAppInboundMessage,
  stopGateway?: () => Promise<void>,
): Promise<void> {
  const bodyPreview = elide(inbound.body.replace(/\n/g, ' '), 50);
  console.log(`Inbound message ${inbound.from} (${inbound.chatType}, ${inbound.body.length} chars): "${bodyPreview}"`);
  debugLog(`[gateway] handleInbound from=${inbound.from} body="${inbound.body.slice(0, 30)}..."`);

  // Handle !id command: returns the chat/group ID so the admin can whitelist it
  if (inbound.body.trim().toLowerCase() === '!id') {
    debugLog(`[gateway] !id command received from ${inbound.from} (isAdmin=${inbound.isAdmin})`);
    const label = inbound.chatType === 'group'
      ? `*Grupo:* ${inbound.groupSubject ?? 'desconhecido'}\n*ID:* \`${inbound.chatId}\``
      : `*Conversa direta*\n*ID (telefone):* \`${inbound.from}\``;
    try {
      await sendMessageWhatsApp({
        to: inbound.replyToJid,
        body: `*DexterBr*:\n${label}`,
        accountId: inbound.accountId,
      });
    } catch (err) {
      debugLog(`[gateway] failed to send !id reply: ${err instanceof Error ? err.message : String(err)}`);
    }
    return;
  }

  // Handle !stop command: immediately shut down the gateway
  if (inbound.body.trim().toLowerCase() === '!stop') {
    debugLog(`[gateway] !stop command received from ${inbound.from}`);
    console.log(`[gateway] !stop received from ${inbound.from} — shutting down.`);
    try {
      await sendMessageWhatsApp({
        to: inbound.replyToJid,
        body: '*DexterBr*:\nBot parado com sucesso. ✅',
        accountId: inbound.accountId,
      });
    } catch (err) {
      debugLog(`[gateway] failed to send !stop confirmation: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (stopGateway) {
      await stopGateway();
    }
    return;
  }

  const route = resolveRoute({
    cfg,
    channel: 'whatsapp',
    accountId: inbound.accountId,
    peer: { kind: inbound.chatType, id: inbound.senderId },
  });

  const storePath = resolveSessionStorePath(route.agentId);
  upsertSessionMeta({
    storePath,
    sessionKey: route.sessionKey,
    channel: 'whatsapp',
    to: inbound.from,
    accountId: route.accountId,
    agentId: route.agentId,
  });

  // Start typing indicator loop to keep it alive during long agent runs
  const TYPING_INTERVAL_MS = 5000; // Refresh every 5 seconds
  let typingTimer: ReturnType<typeof setInterval> | undefined;
  
  const startTypingLoop = async () => {
    await sendComposing({ to: inbound.replyToJid, accountId: inbound.accountId });
    typingTimer = setInterval(() => {
      void sendComposing({ to: inbound.replyToJid, accountId: inbound.accountId });
    }, TYPING_INTERVAL_MS);
  };
  
  const stopTypingLoop = () => {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = undefined;
    }
  };

  try {
    // Defense-in-depth: verify outbound destination is allowed before any messaging
    try {
      assertOutboundAllowed({ to: inbound.replyToJid, accountId: inbound.accountId });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      debugLog(`[gateway] outbound BLOCKED: ${msg}`);
      console.log(msg);
      return;
    }

    await startTypingLoop();
    console.log(`Processing message with agent...`);
    debugLog(`[gateway] running agent for session=${route.sessionKey}`);
    const startedAt = Date.now();
    const answer = await runAgentForMessage({
      sessionKey: route.sessionKey,
      query: inbound.body,
      model: 'gpt-5.2',
      modelProvider: 'openai',
      channel: 'whatsapp',
    });
    const durationMs = Date.now() - startedAt;
    debugLog(`[gateway] agent answer length=${answer.length}`);
    
    // Stop typing loop before sending reply
    stopTypingLoop();

    if (answer.trim()) {
      // Clean up markdown for WhatsApp and reply
      const cleanedAnswer = cleanMarkdownForWhatsApp(answer);
      debugLog(`[gateway] sending reply to ${inbound.replyToJid}`);
      await sendMessageWhatsApp({
        to: inbound.replyToJid,
        body: `*DexterBr*:\n${cleanedAnswer}`,
        accountId: inbound.accountId,
      });
      debugLog(`[gateway] reply sent`);
    } else {
      console.log(`Agent returned empty response (${durationMs}ms)`);
      debugLog(`[gateway] empty answer, not sending`);
    }
  } catch (err) {
    stopTypingLoop();
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`Error: ${msg}`);
    debugLog(`[gateway] ERROR: ${msg}`);
  }
}

export async function startGateway(params: { configPath?: string } = {}): Promise<GatewayService> {
  const cfg = loadGatewayConfig(params.configPath);

  // Declare stop upfront so it can be referenced inside onMessage closure
  let serviceStop: (() => Promise<void>) | undefined;

  const plugin = createWhatsAppPlugin({
    loadConfig: () => loadGatewayConfig(params.configPath),
    onMessage: async (inbound) => {
      const current = loadGatewayConfig(params.configPath);
      await handleInbound(current, inbound, serviceStop);
    },
  });
  const manager = createChannelManager({
    plugin,
    loadConfig: () => loadGatewayConfig(params.configPath),
  });
  await manager.startAll();

  const heartbeat = startHeartbeatRunner({ configPath: params.configPath });

  serviceStop = async () => {
    heartbeat.stop();
    await manager.stopAll();
  };

  return {
    stop: serviceStop,
    snapshot: () => manager.getSnapshot(),
  };
}

