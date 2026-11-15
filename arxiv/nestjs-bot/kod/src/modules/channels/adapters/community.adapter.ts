import { Injectable } from '@nestjs/common';
import { ChannelSlug } from '@prisma/client';
import { AppConfigService } from '../../../config/app-config.module';
import { BaseChannelAdapter } from './base-channel.adapter';

@Injectable()
export class CommunityAdapter extends BaseChannelAdapter {
  readonly slug = ChannelSlug.COMMUNITY;
  readonly displayName = 'Ustozim Nurim Community';
  readonly allowFreeformAiContent = true;
  readonly telegramChatId: bigint;

  constructor(config: AppConfigService) {
    super();
    this.telegramChatId = config.channelChatIds.COMMUNITY;
  }

  getWelcomeMessage(): string {
    return "Assalomu alaykum! Community guruhidan kelgan ekansiz — xush kelibsiz. Bu yerda shaxsiy o'quv yordamchingiz sifatida davom etamiz.";
  }
}
