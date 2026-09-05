// Bounded per-isolate cache and request coalescing. No user identity or raw IP is stored.
const cache = new Map<string, { expires: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
export async function cached<T>(
  key: string,
  ttl: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  if (pending.has(key)) return pending.get(key) as Promise<T>;
  if (pending.size >= 50)
    throw new Error('Provider capacity temporarily reached');
  const promise = loader()
    .then((value) => {
      if (cache.size >= 150) cache.delete(cache.keys().next().value!);
      cache.set(key, { value, expires: Date.now() + ttl });
      return value;
    })
    .finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}
export async function fetchBounded(
  url: string,
  options: RequestInit = {},
  maxBytes = 2_000_000,
) {
  const headers = new Headers(options.headers);
  headers.set(
    'User-Agent',
    'FairwayOS/0.1 (+https://github.com/carneymo/fairway-os)',
  );
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(9000),
    headers,
  });
  if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty upstream response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error('Upstream response too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(all);
}
export function apiError(message: string, status = 503) {
  return Response.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}
export function coordinates(request: Request) {
  const p = new URL(request.url).searchParams;
  if (!p.has('lat') || !p.has('lon')) throw new Error('Coordinates required');
  const lat = Number(p.get('lat')),
    lon = Number(p.get('lon'));
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  )
    throw new Error('Invalid coordinates');
  return { lat, lon };
}
export function safeWebsite(value?: string) {
  if (!value) return undefined;
  try {
    const u = new URL(value.startsWith('www.') ? 'https://' + value : value);
    return /^https?:$/.test(u.protocol) && !u.username && !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
