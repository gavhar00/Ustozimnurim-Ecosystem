import { ChannelAdapter, ChannelAdapterConfig } from './channel-adapter.interface';

/**
 * Short, URL-safe codes used inside the /start deep-link payload.
 * Telegram deep-link payloads are limited to 64 chars and safest with
 * [A-Za-z0-9_-], so we don't use the raw Prisma enum value (e.g.
 * "USTOZIM_NURIM") directly — a short code keeps links compact.
 */
const DEEP_LINK_CODE: Record<ChannelAdapterConfig['slug'], string> = {
  USTOZIM_NURIM: 'un',
  SAHIFALAR: 'sf',
  COMMUNITY: 'co',
  QURANOY: 'qr',
};

export abstract class BaseChannelAdapter implements ChannelAdapter {
  abstract readonly slug: ChannelAdapterConfig['slug'];
  abstract readonly displayName: string;
  abstract readonly telegramChatId: bigint;
  abstract readonly allowFreeformAiContent: boolean;

  buildDeepLinkPayload(postId: string): string {
    const code = DEEP_LINK_CODE[this.slug];
    return `ch_${code}_${postId}`;
  }

  abstract getWelcomeMessage(): string;
}

export function deepLinkCodeToSlug(code: string): ChannelAdapterConfig['slug'] | null {
  const entry = Object.entries(DEEP_LINK_CODE).find(([, c]) => c === code);
  return entry ? (entry[0] as ChannelAdapterConfig['slug']) : null;
}
