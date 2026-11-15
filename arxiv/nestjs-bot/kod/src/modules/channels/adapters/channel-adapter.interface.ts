import { ChannelSlug } from '@prisma/client';

/**
 * Every channel-specific behaviour (tone, CTA, deep-link format) is
 * expressed through this single interface. No module outside `channels`
 * should ever branch on a channel slug directly — it should ask the
 * registry for the adapter and call these methods instead.
 */
export interface ChannelAdapterConfig {
  readonly slug: ChannelSlug;
  readonly displayName: string;
  /** Telegram chat id (negative number for channels/supergroups), from env. */
  readonly telegramChatId: bigint;
  /**
   * Whether this channel's content path is allowed to use free-form AI
   * generation. Locked architecture requirement: @quranoy is always false —
   * enforced here at the adapter level, not just in a prompt.
   */
  readonly allowFreeformAiContent: boolean;
}

export interface ChannelAdapter extends ChannelAdapterConfig {
  /** Builds the /start deep-link payload for a given post, e.g. "ch_sahifalar_post42". */
  buildDeepLinkPayload(postId: string): string;

  /** First-touch welcome line shown when a user arrives from this channel. */
  getWelcomeMessage(): string;
}

export const CHANNEL_ADAPTERS = 'CHANNEL_ADAPTERS';
