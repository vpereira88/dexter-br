import type { AnyMessageContent } from '@whiskeysockets/baileys';

export type WhatsAppInboundMessage = {
  id?: string;
  accountId: string;
  chatId: string;
  /** The JID to use when replying (resolved from LID to phone JID if applicable) */
  replyToJid: string;
  chatType: 'direct' | 'group';
  from: string;
  senderId: string;
  senderName?: string;
  isFromMe?: boolean;
  /** True when the sender is the configured admin (DEXTER_ADMIN_PHONE). Admin bypasses all allowlists. */
  isAdmin?: boolean;
  selfE164?: string | null;
  groupSubject?: string;
  groupParticipants?: string[];
  body: string;
  timestamp?: number;
  sendComposing: () => Promise<void>;
  reply: (text: string) => Promise<void>;
  sendMedia: (payload: AnyMessageContent) => Promise<void>;
};

export type WhatsAppCloseReason = {
  status?: number;
  isLoggedOut: boolean;
  error?: unknown;
};

