import { Injectable } from '@nestjs/common';
import { ChannelSlug } from '@prisma/client';
import { AppConfigService } from '../../../config/app-config.module';
import { BaseChannelAdapter } from './base-channel.adapter';

/**
 * Locked architecture requirement (AI Architecture section): this channel's
 * AI Gateway path must never call free-form generation — only verified,
 * pre-approved source content. `allowFreeformAiContent` is `false` here by
 * design and is a `readonly` literal so no later code path can flip it at
 * runtime; the AI Gateway (future phase) must read this flag before
 * deciding whether Sonnet/Haiku may be invoked at all for this channel.
 */
@Injectable()
export class QuranoyAdapter extends BaseChannelAdapter {
  readonly slug = ChannelSlug.QURANOY;
  readonly displayName = 'Quranoy';
  readonly allowFreeformAiContent = false as const;
  readonly telegramChatId: bigint;

  constructor(config: AppConfigService) {
    super();
    this.telegramChatId = config.channelChatIds.QURANOY;
  }

  getWelcomeMessage(): string {
    return "Assalomu alaykum! Quranoy kanalidan kelgan ekansiz. Bu yerda Qur'on va tilovat bilan bog'liq mazmun bilan ehtiyotkorlik bilan ishlaymiz.";
  }
}
