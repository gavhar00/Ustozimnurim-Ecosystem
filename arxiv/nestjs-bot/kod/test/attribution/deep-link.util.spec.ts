import { parseDeepLinkPayload } from '../../src/modules/attribution/deep-link.util';

describe('parseDeepLinkPayload', () => {
  it('parses a valid payload', () => {
    expect(parseDeepLinkPayload('ch_sf_post42')).toEqual({
      channelCode: 'sf',
      postId: 'post42',
    });
  });

  it('parses payloads with hyphenated post ids', () => {
    expect(parseDeepLinkPayload('ch_qr_ayah-2-255')).toEqual({
      channelCode: 'qr',
      postId: 'ayah-2-255',
    });
  });

  it('returns null for undefined/empty input', () => {
    expect(parseDeepLinkPayload(undefined)).toBeNull();
    expect(parseDeepLinkPayload(null)).toBeNull();
    expect(parseDeepLinkPayload('')).toBeNull();
  });

  it('returns null for malformed payloads', () => {
    expect(parseDeepLinkPayload('garbage')).toBeNull();
    expect(parseDeepLinkPayload('ch_sf')).toBeNull();
    expect(parseDeepLinkPayload('ch__post42')).toBeNull();
    expect(parseDeepLinkPayload('ch_SF_post42')).toBeNull(); // codes are lowercase only
  });

  it('trims surrounding whitespace', () => {
    expect(parseDeepLinkPayload('  ch_un_post1  ')).toEqual({
      channelCode: 'un',
      postId: 'post1',
    });
  });
});
