import { Test } from '@nestjs/testing';
import { ChannelSlug } from '@prisma/client';
import { ChannelsService } from '../../src/modules/channels/channels.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CHANNEL_ADAPTERS } from '../../src/modules/channels/adapters/channel-adapter.interface';
import { UstozimNurimAdapter } from '../../src/modules/channels/adapters/ustozim-nurim.adapter';
import { SahifalarAdapter } from '../../src/modules/channels/adapters/sahifalar.adapter';
import { CommunityAdapter } from '../../src/modules/channels/adapters/community.adapter';
import { QuranoyAdapter } from '../../src/modules/channels/adapters/quranoy.adapter';

function makeAdapter(slug: ChannelSlug, code: string, allowFreeform: boolean) {
  return {
    slug,
    displayName: slug,
    telegramChatId: -1n,
    allowFreeformAiContent: allowFreeform,
    buildDeepLinkPayload: (postId: string) => `ch_${code}_${postId}`,
    getWelcomeMessage: () => 'welcome',
  };
}

describe('ChannelsService', () => {
  const prismaMock = { channel: { upsert: jest.fn() } };

  const adapters = [
    makeAdapter(ChannelSlug.USTOZIM_NURIM, 'un', true),
    makeAdapter(ChannelSlug.SAHIFALAR, 'sf', true),
    makeAdapter(ChannelSlug.COMMUNITY, 'co', true),
    makeAdapter(ChannelSlug.QURANOY, 'qr', false),
  ];

  let service: ChannelsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChannelsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CHANNEL_ADAPTERS, useValue: adapters },
      ],
    }).compile();
    service = moduleRef.get(ChannelsService);
  });

  it('registers all 4 adapters', () => {
    expect(service.getAllAdapters()).toHaveLength(4);
  });

  it('resolves an adapter by slug', () => {
    expect(service.getAdapter(ChannelSlug.QURANOY)?.slug).toBe(ChannelSlug.QURANOY);
  });

  it('resolves an adapter by its deep-link code', () => {
    expect(service.getAdapterByDeepLinkCode('sf')?.slug).toBe(ChannelSlug.SAHIFALAR);
    expect(service.getAdapterByDeepLinkCode('unknown')).toBeUndefined();
  });

  it('locks Quranoy to allowFreeformAiContent = false', () => {
    expect(service.getAdapter(ChannelSlug.QURANOY)?.allowFreeformAiContent).toBe(false);
  });

  it('ensureChannelRecord upserts using the adapter slug', async () => {
    prismaMock.channel.upsert.mockResolvedValue({ id: 'c1' });
    await service.ensureChannelRecord(adapters[1]);
    expect(prismaMock.channel.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: ChannelSlug.SAHIFALAR } }),
    );
  });
});

describe('real adapter classes wire the correct static config', () => {
  const config = {
    channelChatIds: {
      USTOZIM_NURIM: -1001n,
      SAHIFALAR: -1002n,
      COMMUNITY: -1003n,
      QURANOY: -1004n,
    },
  } as any;

  it('QuranoyAdapter never allows freeform AI content', () => {
    const adapter = new QuranoyAdapter(config);
    expect(adapter.allowFreeformAiContent).toBe(false);
    expect(adapter.slug).toBe(ChannelSlug.QURANOY);
  });

  it('the other 3 adapters allow freeform AI content', () => {
    expect(new UstozimNurimAdapter(config).allowFreeformAiContent).toBe(true);
    expect(new SahifalarAdapter(config).allowFreeformAiContent).toBe(true);
    expect(new CommunityAdapter(config).allowFreeformAiContent).toBe(true);
  });

  it('each adapter builds a deep-link payload with its own code', () => {
    expect(new UstozimNurimAdapter(config).buildDeepLinkPayload('p1')).toBe('ch_un_p1');
    expect(new SahifalarAdapter(config).buildDeepLinkPayload('p1')).toBe('ch_sf_p1');
    expect(new CommunityAdapter(config).buildDeepLinkPayload('p1')).toBe('ch_co_p1');
    expect(new QuranoyAdapter(config).buildDeepLinkPayload('p1')).toBe('ch_qr_p1');
  });
});
