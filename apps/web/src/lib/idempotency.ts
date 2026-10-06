// One idempotency key per checkout attempt. A retry of the SAME order reuses
// the key (so a request that reached the server is not duplicated); if the
// customer changes the order in between, a new key is issued.

interface StoredKey {
  fingerprint: string;
  key: string;
}

const storageKey = (storeSlug: string) => `kld:checkout:${storeSlug}`;

/** crypto.randomUUID needs a secure context; fall back for plain-http LAN testing. */
function uuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function idempotencyKeyFor(storeSlug: string, payload: unknown): string {
  const fingerprint = JSON.stringify(payload);
  try {
    const raw = sessionStorage.getItem(storageKey(storeSlug));
    const stored = raw ? (JSON.parse(raw) as StoredKey) : null;
    if (stored?.fingerprint === fingerprint) return stored.key;
    const key = uuidV4();
    sessionStorage.setItem(
      storageKey(storeSlug),
      JSON.stringify({ fingerprint, key } satisfies StoredKey),
    );
    return key;
  } catch {
    return uuidV4();
  }
}

export function clearIdempotencyKey(storeSlug: string): void {
  try {
    sessionStorage.removeItem(storageKey(storeSlug));
  } catch {
    // ignore
  }
}
