// src/lib/servicesCache.ts
import { cached, invalidateAll } from '$lib/cache';

export type ServiceT = {
	id: number;
	name: string;
	description: string | null;
	price: number;
};

const store = new Map<string, any>();
const KEY = 'services:list';

// Match your backend cache (max-age=600). Client can be longer if you want.
const TTL_MS = 10 * 60 * 1000;

export async function getServicesCached(fetchFn: typeof fetch): Promise<ServiceT[]> {
	return cached(
		store,
		KEY,
		async () => {
			const r = await fetchFn('/api/services');
			if (!r.ok) throw new Error(await r.text());
			return (await r.json()) as ServiceT[];
		},
		{ ttlMs: TTL_MS }
	);
}

export function invalidateServicesCache() {
	invalidateAll(store);
}
