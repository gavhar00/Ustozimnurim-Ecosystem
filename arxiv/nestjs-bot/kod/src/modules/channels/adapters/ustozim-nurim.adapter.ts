import { Injectable } from '@nestjs/common';
import { ChannelSlug } from '@prisma/client';
import { AppConfigService } from '../../../config/app-config.module';
import { BaseChannelAdapter } from './base-channel.adapter';

@Injectable()
export class UstozimNurimAdapter extends BaseChannelAdapter {
  readonly slug = ChannelSlug.USTOZIM_NURIM;
  readonly displayName = 'Ustozim Nurim';
  readonly allowFreeformAiContent = true;
  readonly telegramChatId: bigint;

  constructor(config: AppConfigService) {
    super();
    this.telegramChatId = config.channelChatIds.USTOZIM_NURIM;
  }

  getWelcomeMessage(): string {
    return "Assalomu alaykum! Ustozim Nurim shaxsiy kanalidan kelgan ekansiz — xush kelibsiz. Keling, sizga mos boshlang'ich qadamni birga topamiz.";
  }
}
