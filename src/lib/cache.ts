// src/lib/cache.ts
export type CacheEntry<T> = {
	value?: T;
	at?: number;
	promise?: Promise<T>;
};

export type CacheOptions = {
	ttlMs?: number;
};

const DEFAULT_TTL_MS = 10 * 60 * 1000;

function isFresh(entry: CacheEntry<any> | undefined, ttlMs: number) {
	if (!entry?.at) return false;
	return Date.now() - entry.at < ttlMs;
}

/**
 * In-memory cache with:
 * - TTL
 * - promise de-duping (same key shares one inflight request)
 *
 * NOTE: Only use from the browser (call from onMount/effects).
 * If called during SSR, it will just fetch without caching.
 */
export async function cached<T>(
	store: Map<string, CacheEntry<T>>,
	key: string,
	fetcher: () => Promise<T>,
	opts?: CacheOptions
): Promise<T> {
	// Avoid cross-user cache in SSR
	if (import.meta.env.SSR) return fetcher();

	const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
	const entry = store.get(key);

	if (entry && entry.value !== undefined && isFresh(entry, ttlMs)) return entry.value;
	if (entry?.promise) return entry.promise;

	const next: CacheEntry<T> = entry ?? {};
	next.promise = (async () => {
		const v = await fetcher();
		next.value = v;
		next.at = Date.now();
		return v;
	})();

	store.set(key, next);

	try {
		return await next.promise;
	} finally {
		next.promise = undefined;
	}
}

export function invalidateKey(store: Map<string, any>, key: string) {
	store.delete(key);
}

export function invalidateAll(store: Map<string, any>) {
	store.clear();
}
