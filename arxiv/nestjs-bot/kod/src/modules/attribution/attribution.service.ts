import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelsService } from '../channels/channels.service';
import { parseDeepLinkPayload } from './deep-link.util';

export const EVENT_CHANNEL_ATTRIBUTION = 'channel_attribution';

@Injectable()
export class AttributionService {
  private readonly logger = new Logger(AttributionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly channels: ChannelsService,
  ) {}

  /**
   * Given a /start payload and the user who just arrived, resolves which
   * channel/post they came from (if any) and writes a single attribution
   * Event. Never throws on unrecognized payloads — attribution is
   * best-effort and must never block onboarding.
   */
  async recordFromStartPayload(userId: string, payload: string | undefined): Promise<void> {
    const parsed = parseDeepLinkPayload(payload);
    if (!parsed) return;

    const adapter = this.channels.getAdapterByDeepLinkCode(parsed.channelCode);
    if (!adapter) {
      this.logger.warn(`Unknown channel deep-link code: "${parsed.channelCode}"`);
      return;
    }

    const channel = await this.channels.ensureChannelRecord(adapter);

    const channelPost = await this.prisma.channelPost.upsert({
      where: {
        channelId_deepLinkPostId: { channelId: channel.id, deepLinkPostId: parsed.postId },
      },
      update: {},
      create: { channelId: channel.id, deepLinkPostId: parsed.postId },
    });

    await this.prisma.event.create({
      data: {
        eventType: EVENT_CHANNEL_ATTRIBUTION,
        userId,
        channelId: channel.id,
        channelPostId: channelPost.id,
        metadata: { deepLinkPostId: parsed.postId },
      },
    });
  }
}
