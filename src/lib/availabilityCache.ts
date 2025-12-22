// src/lib/availabilityCache.ts
import { cached, invalidateKey, invalidateAll } from '$lib/cache';

export type NormalizedAvailability = {
	times: string[];
	holidayLabel: string | null;
	holidayComment: string | null;
	isOpenOverride: boolean | null;
};

type AvailabilityResponse = {
	times?: string[];
	holidayLabel?: string | null;
	holidayComment?: string | null;
	isOpenOverride?: boolean | null;

	// legacy/alt shapes
	holiday_name?: string | null;
	comment?: string | null;
	is_open?: boolean | null;
	holiday?: { name?: string | null; comment?: string | null; is_open?: boolean | null } | null;
};

const dayStore = new Map<string, any>();
const monthStore = new Map<string, any>();

function normalize(data: AvailabilityResponse): NormalizedAvailability {
	const holidayLabel =
		data.holidayLabel ??
		data.holiday_name ??
		data.holiday?.name ??
		(typeof (data as any).holiday === 'string' ? (data as any).holiday : null) ??
		null;

	const holidayComment = data.holidayComment ?? data.comment ?? data.holiday?.comment ?? null;
	const isOpenOverride = data.isOpenOverride ?? data.is_open ?? data.holiday?.is_open ?? null;

	const times =
		((data.times ?? (data as any).available ?? (data as any).slots ?? []) as string[]) ?? [];
	return { times, holidayLabel, holidayComment, isOpenOverride };
}

function todayISO() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function endOfMonth(d: Date) {
	return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function toISODate(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isPastDateISO(iso: string) {
	const t = new Date(iso + 'T00:00');
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return t < today;
}

function monthKey(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthKeyFromISO(iso: string) {
	return iso.slice(0, 7); // YYYY-MM
}

// You can extend this later to include location id if your backend supports it.
function dayKey(dateISO: string, slotMinutes: number) {
	return `avail:day:${slotMinutes}:${dateISO}`;
}
function monthKeyCache(month: Date, slotMinutes: number) {
	return `avail:month:${slotMinutes}:${monthKey(month)}`;
}

async function fetchDay(
	fetchFn: typeof fetch,
	dateISO: string,
	slotMinutes: number
): Promise<NormalizedAvailability> {
	const qs1 = new URLSearchParams({ date: dateISO, slotMinutes: String(slotMinutes) });
	let res = await fetchFn(`/api/availability?${qs1}`);
	if (!res.ok) {
		const qs2 = new URLSearchParams({ date: dateISO, slot_minutes: String(slotMinutes) });
		res = await fetchFn(`/api/availability?${qs2}`);
		if (!res.ok) {
			const resPost = await fetchFn(`/api/availability`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ date: dateISO, slotMinutes, slot_minutes: slotMinutes })
			});
			if (!resPost.ok) throw new Error(`Availability HTTP ${resPost.status}`);
			return normalize((await resPost.json()) as AvailabilityResponse);
		}
	}
	return normalize((await res.json()) as AvailabilityResponse);
}

/**
 * Cached day availability.
 * TTL is shorter for "today" because "now" changes what slots are in the future.
 */
export async function getDayAvailabilityCached(args: {
	fetchFn: typeof fetch;
	dateISO: string;
	slotMinutes: number;
}): Promise<NormalizedAvailability> {
	const ttlMs = args.dateISO === todayISO() ? 30_000 : 5 * 60_000; // 30s today, 5m future
	return cached(
		dayStore,
		dayKey(args.dateISO, args.slotMinutes),
		() => fetchDay(args.fetchFn, args.dateISO, args.slotMinutes),
		{ ttlMs }
	);
}

/**
 * Cached month map: ISO -> hasSlots (true/false/undefined)
 * undefined means: request failed for that day.
 */
export async function getMonthAvailabilityMapCached(args: {
	fetchFn: typeof fetch;
	month: Date; // any date within the month
	slotMinutes: number;
	concurrency?: number;
}): Promise<Record<string, boolean | undefined>> {
	const key = monthKeyCache(args.month, args.slotMinutes);
	const ttlMs = 2 * 60_000; // 2 minutes; tune if needed

	return cached(
		monthStore,
		key,
		async () => {
			const year = args.month.getFullYear();
			const monthIndex = args.month.getMonth();
			const daysInMonth = endOfMonth(args.month).getDate();

			const isos = Array.from({ length: daysInMonth }, (_, i) =>
				toISODate(new Date(year, monthIndex, i + 1))
			);

			const out: Record<string, boolean | undefined> = {};
			for (const iso of isos) if (isPastDateISO(iso)) out[iso] = false;

			const toFetch = isos.filter((iso) => !isPastDateISO(iso));
			const queue = [...toFetch];
			const CONCURRENCY = Math.max(1, args.concurrency ?? 6);

			await Promise.all(
				Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
					while (queue.length) {
						const iso = queue.shift()!;
						try {
							const day = await getDayAvailabilityCached({
								fetchFn: args.fetchFn,
								dateISO: iso,
								slotMinutes: args.slotMinutes
							});
							out[iso] = (day.times?.length ?? 0) > 0;
						} catch {
							out[iso] = undefined;
						}
					}
				})
			);

			return out;
		},
		{ ttlMs }
	);
}

// ---- invalidation (call after booking) ----
export function invalidateAvailabilityForDate(dateISO: string, slotMinutes: number) {
	invalidateKey(dayStore, dayKey(dateISO, slotMinutes));
	// also invalidate the month map containing this date
	const mk = monthKeyFromISO(dateISO);
	invalidateKey(monthStore, `avail:month:${slotMinutes}:${mk}`);
}

export function invalidateAllAvailability() {
	invalidateAll(dayStore);
	invalidateAll(monthStore);
}
