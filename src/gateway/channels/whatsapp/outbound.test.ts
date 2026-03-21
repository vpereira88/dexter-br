import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sendComposing, sendMessageWhatsApp, setActiveWebListener } from './outbound.js';
import type { WaSocket } from './session.js';

function writeGatewayConfig(
  configPath: string,
  opts: {
    allowFrom: string[];
    groupPolicy?: 'open' | 'allowlist' | 'disabled';
    groupAllowFrom?: string[];
    adminPhone?: string | null;
  },
): void {
  const config = {
    gateway: {
      accountId: 'default',
      logLevel: 'info',
    },
    channels: {
      whatsapp: {
        enabled: true,
        accounts: {
          default: {
            allowFrom: opts.allowFrom,
            dmPolicy: 'allowlist',
            groupPolicy: opts.groupPolicy ?? 'disabled',
            groupAllowFrom: opts.groupAllowFrom ?? [],
            adminPhone: opts.adminPhone ?? null,
          },
        },
      },
    },
    bindings: [],
  };
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

describe('whatsapp outbound strict allowlist', () => {
  afterEach(() => {
    delete process.env.DEXTER_GATEWAY_CONFIG;
    setActiveWebListener('default', null);
  });

  test('blocks sendMessage to non-allowlisted recipient', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dexter-outbound-'));
    const configPath = join(dir, 'gateway.json');
    let sendCount = 0;
    writeGatewayConfig(configPath, { allowFrom: ['+15551234567'] });
    process.env.DEXTER_GATEWAY_CONFIG = configPath;
    const sock = {
      sendMessage: async () => {
        sendCount += 1;
        return { key: { id: 'msg-1' } };
      },
      sendPresenceUpdate: async () => {},
    } as unknown as WaSocket;
    setActiveWebListener('default', sock);

    try {
      await expect(
        sendMessageWhatsApp({
          to: '15550000000@s.whatsapp.net',
          body: 'hello',
          accountId: 'default',
        }),
      ).rejects.toThrow('not in allowFrom');
      expect(sendCount).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('blocks sendComposing to non-allowlisted recipient', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dexter-outbound-'));
    const configPath = join(dir, 'gateway.json');
    let presenceCount = 0;
    writeGatewayConfig(configPath, { allowFrom: ['+15551234567'] });
    process.env.DEXTER_GATEWAY_CONFIG = configPath;
    const sock = {
      sendMessage: async () => ({ key: { id: 'msg-1' } }),
      sendPresenceUpdate: async () => {
        presenceCount += 1;
      },
    } as unknown as WaSocket;
    setActiveWebListener('default', sock);

    try {
      await expect(
        sendComposing({
          to: '15550000000@s.whatsapp.net',
          accountId: 'default',
        }),
      ).rejects.toThrow('not in allowFrom');
      expect(presenceCount).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('blocks sendMessage to non-allowlisted group when group policy is allowlist', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dexter-outbound-'));
    const configPath = join(dir, 'gateway.json');
    let sendCount = 0;
    writeGatewayConfig(configPath, {
      allowFrom: ['+15551234567'],
      groupPolicy: 'allowlist',
      groupAllowFrom: ['120363999999999999@g.us'],
    });
    process.env.DEXTER_GATEWAY_CONFIG = configPath;
    const sock = {
      sendMessage: async () => {
        sendCount += 1;
        return { key: { id: 'msg-1' } };
      },
      sendPresenceUpdate: async () => {},
    } as unknown as WaSocket;
    setActiveWebListener('default', sock);

    try {
      await expect(
        sendMessageWhatsApp({
          to: '120363000000000001@g.us',
          body: 'hello group',
          accountId: 'default',
        }),
      ).rejects.toThrow('group destinations are not enabled');
      expect(sendCount).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('allows sendMessage to allowlisted group when group policy is allowlist', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dexter-outbound-'));
    const configPath = join(dir, 'gateway.json');
    let sendCount = 0;
    writeGatewayConfig(configPath, {
      allowFrom: ['+15551234567'],
      groupPolicy: 'allowlist',
      groupAllowFrom: ['120363000000000001@g.us'],
    });
    process.env.DEXTER_GATEWAY_CONFIG = configPath;
    const sock = {
      sendMessage: async () => {
        sendCount += 1;
        return { key: { id: 'msg-1' } };
      },
      sendPresenceUpdate: async () => {},
    } as unknown as WaSocket;
    setActiveWebListener('default', sock);

    try {
      const result = await sendMessageWhatsApp({
        to: '120363000000000001@g.us',
        body: 'hello group',
        accountId: 'default',
      });
      expect(result.toJid).toBe('120363000000000001@g.us');
      expect(sendCount).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
