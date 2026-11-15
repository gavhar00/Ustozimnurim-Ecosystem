import { Injectable } from '@nestjs/common';
import { ChannelSlug } from '@prisma/client';
import { AppConfigService } from '../../../config/app-config.module';
import { BaseChannelAdapter } from './base-channel.adapter';

@Injectable()
export class SahifalarAdapter extends BaseChannelAdapter {
  readonly slug = ChannelSlug.SAHIFALAR;
  readonly displayName = 'Sahifalar | Ustozim Nurim';
  readonly allowFreeformAiContent = true;
  readonly telegramChatId: bigint;

  constructor(config: AppConfigService) {
    super();
    this.telegramChatId = config.channelChatIds.SAHIFALAR;
  }

  getWelcomeMessage(): string {
    return "Assalomu alaykum! Sahifalar kanalidan kelgan ekansiz — demak, tuzilgan o'quv formatiga qiziqasiz. Birinchi qisqa mashqni birga boshlaymiz.";
  }
}
