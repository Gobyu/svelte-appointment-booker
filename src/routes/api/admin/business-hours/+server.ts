import { json, error } from '@sveltejs/kit';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const DEFAULT_START = '09:00:00';
const DEFAULT_END = '17:00:00';

function toHHMMSS(v: unknown): string {
	if (typeof v !== 'string') throw error(400, 'time must be HH:MM');
	const s = v.trim();
	if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
	if (/^\d{2}:\d{2}$/.test(s)) return s + ':00';
	throw error(400, 'time must be HH:MM');
}

export const GET = async ({ locals }) => {
	requireAdmin(locals.user);

	const rows = await q<any[]>(
		`SELECT week_day,
		        TIME_FORMAT(start_time, '%H:%i') AS start_time,
		        TIME_FORMAT(end_time,   '%H:%i') AS end_time,
		        (is_open + 0) AS is_open
		   FROM business_hours`,
		[]
	);

	const map = new Map<number, any>(rows.map((r) => [Number(r.week_day), r]));
	const out = DAYS.map((d) => ({
		week_day: d,
		start_time: map.get(d)?.start_time ?? '09:00',
		end_time: map.get(d)?.end_time ?? '17:00',
		is_open: !!map.get(d)?.is_open
	}));

	return json(out);
};

export const PUT = async ({ locals, request }) => {
	requireAdmin(locals.user);

	const body = await request.json().catch(() => []);
	if (!Array.isArray(body)) throw error(400, 'expected an array');

	for (const r of body) {
		const day = Number(r?.week_day);
		if (!Number.isInteger(day) || day < 1 || day > 7) {
			throw error(400, 'week_day must be 1..7');
		}

		// CLOSE: only flip the flag; do not touch times.
		if (!r?.is_open) {
			const res: any = await q('UPDATE business_hours SET is_open = 0 WHERE week_day = ?', [day]);
			if (!res?.affectedRows) {
				// If no row yet, create one with defaults but closed
				await q(
					'INSERT INTO business_hours (week_day, start_time, end_time, is_open) VALUES (?, ?, ?, 0)',
					[day, DEFAULT_START, DEFAULT_END]
				);
			}
			continue;
		}

		// OPEN: require and upsert times.
		const st = toHHMMSS(r?.start_time);
		const et = toHHMMSS(r?.end_time);
		if (st >= et) throw error(400, 'opening time cannot be after closing time');

		await q(
			`INSERT INTO business_hours (week_day, start_time, end_time, is_open)
			 VALUES (?, ?, ?, 1)
			 ON DUPLICATE KEY UPDATE start_time = VALUES(start_time),
			                         end_time   = VALUES(end_time),
			                         is_open    = VALUES(is_open)`,
			[day, st, et]
		);
	}

	return json({ ok: true });
};
