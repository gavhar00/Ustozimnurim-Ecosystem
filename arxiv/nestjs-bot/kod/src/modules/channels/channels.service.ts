import { Inject, Injectable } from '@nestjs/common';
import { Channel, ChannelSlug } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CHANNEL_ADAPTERS, ChannelAdapter } from './adapters/channel-adapter.interface';
import { deepLinkCodeToSlug } from './adapters/base-channel.adapter';

@Injectable()
export class ChannelsService {
  private readonly bySlug = new Map<ChannelSlug, ChannelAdapter>();

  constructor(
    @Inject(CHANNEL_ADAPTERS) private readonly adapters: ChannelAdapter[],
    private readonly prisma: PrismaService,
  ) {
    for (const adapter of adapters) {
      this.bySlug.set(adapter.slug, adapter);
    }
  }

  getAdapter(slug: ChannelSlug): ChannelAdapter | undefined {
    return this.bySlug.get(slug);
  }

  getAdapterByDeepLinkCode(code: string): ChannelAdapter | undefined {
    const slug = deepLinkCodeToSlug(code);
    return slug ? this.bySlug.get(slug) : undefined;
  }

  getAllAdapters(): ChannelAdapter[] {
    return [...this.adapters];
  }

  /**
   * Ensures a Channel row exists for the given adapter, creating it on
   * first use. Idempotent — safe to call on every attribution event.
   */
  async ensureChannelRecord(adapter: ChannelAdapter): Promise<Channel> {
    return this.prisma.channel.upsert({
      where: { slug: adapter.slug },
      update: { displayName: adapter.displayName, telegramChatId: adapter.telegramChatId },
      create: {
        slug: adapter.slug,
        displayName: adapter.displayName,
        telegramChatId: adapter.telegramChatId,
      },
    });
  }
}
