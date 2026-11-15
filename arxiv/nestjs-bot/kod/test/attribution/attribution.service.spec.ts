import { Test } from '@nestjs/testing';
import { ChannelSlug } from '@prisma/client';
import { AttributionService } from '../../src/modules/attribution/attribution.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ChannelsService } from '../../src/modules/channels/channels.service';

describe('AttributionService', () => {
  const prismaMock = {
    channelPost: { upsert: jest.fn() },
    event: { create: jest.fn() },
  };
  const channelsMock = {
    getAdapterByDeepLinkCode: jest.fn(),
    ensureChannelRecord: jest.fn(),
  };

  let service: AttributionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AttributionService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ChannelsService, useValue: channelsMock },
      ],
    }).compile();
    service = moduleRef.get(AttributionService);
  });

  it('does nothing when there is no payload', async () => {
    await service.recordFromStartPayload('user1', undefined);
    expect(channelsMock.getAdapterByDeepLinkCode).not.toHaveBeenCalled();
    expect(prismaMock.event.create).not.toHaveBeenCalled();
  });

  it('does nothing when the channel code is unrecognized', async () => {
    channelsMock.getAdapterByDeepLinkCode.mockReturnValue(undefined);
    await service.recordFromStartPayload('user1', 'ch_zz_post1');
    expect(prismaMock.event.create).not.toHaveBeenCalled();
  });

  it('creates a ChannelPost and Event for a recognized channel', async () => {
    channelsMock.getAdapterByDeepLinkCode.mockReturnValue({ slug: ChannelSlug.SAHIFALAR });
    channelsMock.ensureChannelRecord.mockResolvedValue({ id: 'channel-1' });
    prismaMock.channelPost.upsert.mockResolvedValue({ id: 'post-1' });

    await service.recordFromStartPayload('user1', 'ch_sf_post42');

    expect(prismaMock.channelPost.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { channelId_deepLinkPostId: { channelId: 'channel-1', deepLinkPostId: 'post42' } },
      }),
    );
    expect(prismaMock.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'channel_attribution',
          userId: 'user1',
          channelId: 'channel-1',
          channelPostId: 'post-1',
        }),
      }),
    );
  });
});
