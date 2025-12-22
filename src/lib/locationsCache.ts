// src/lib/locationsCache.ts
import { cached, invalidateAll } from '$lib/cache';

export type LocationT = {
	id: number;
	name: string;
	address: string;
	postal: string;
	city: string;
	province: string;
	lat: number;
	lng: number;
};

const store = new Map<string, any>();
const KEY = 'locations:list';

// Your backend uses max-age=3600; keep client TTL aligned
const TTL_MS = 60 * 60 * 1000;

export async function getLocationsCached(fetchFn: typeof fetch): Promise<LocationT[]> {
	return cached(
		store,
		KEY,
		async () => {
			const r = await fetchFn('/api/locations');
			if (!r.ok) throw new Error(await r.text());
			return (await r.json()) as LocationT[];
		},
		{ ttlMs: TTL_MS }
	);
}

export function invalidateLocationsCache() {
	invalidateAll(store);
}
