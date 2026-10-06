// Table QR codes link to the storefront with `?t=<label>`, e.g. `?t=Ban-02-Sanh-01`.
// Table mode comes from the URL ONLY: opened with `t` = sitting at a table,
// opened without it = ordering remotely. Nothing is stored in the browser,
// so a later visit without `t` is never stuck in table mode. Internal links
// carry `t` along (see <StoreLink>).

export const MAX_TABLE_LABEL_LENGTH = 60;
export const TABLE_PARAM = 't';

/** Keep letters (any language), digits and a few separators; dashes become spaces. */
export function sanitizeTableLabel(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N} ._#/·-]/gu, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TABLE_LABEL_LENGTH);
}

/** `/order` → `/order?t=Chòi%2003` while in table mode. */
export function withTableParam(href: string, table: string | null): string {
  if (!table) return href;
  const [path, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set(TABLE_PARAM, table);
  return `${path}?${params.toString()}`;
}

/** Note sent to the store: "[<label>] <customer note>". */
export function tableNotePrefix(label: string): string {
  return `[${label}] `;
}
