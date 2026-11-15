export interface ParsedDeepLink {
  channelCode: string;
  postId: string;
}

/**
 * Parses a Telegram /start deep-link payload of the form "ch_<code>_<postId>".
 * Returns null for anything that doesn't match — callers should treat that
 * as "no attribution", never throw.
 *
 * Examples:
 *   "ch_sf_post42"  -> { channelCode: "sf", postId: "post42" }
 *   "ch_qr_ayah12"  -> { channelCode: "qr", postId: "ayah12" }
 *   "garbage"       -> null
 */
export function parseDeepLinkPayload(payload: string | undefined | null): ParsedDeepLink | null {
  if (!payload) return null;
  const match = /^ch_([a-z]{2,10})_([A-Za-z0-9-]{1,64})$/.exec(payload.trim());
  if (!match) return null;
  const [, channelCode, postId] = match;
  return { channelCode, postId };
}
