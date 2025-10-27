import { json, error } from '@sveltejs/kit';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';

const DEFAULT_START = '09:00:00';
const DEFAULT_END = '17:00:00';

function toHHMMSS(v: unknown): string {
	if (typeof v !== 'string') throw error(400, 'time must be HH:MM');
	const s = v.trim();
	if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
	if (/^\d{2}:\d{2}$/.test(s)) return s + ':00';
	throw error(400, 'time must be HH:MM');
}

export const PUT = async ({ locals, params, request }) => {
	requireAdmin(locals.user);

	const day = Number(params.week_day);
	if (!Number.isInteger(day) || day < 1 || day > 7) {
		throw error(400, 'week_day must be 1..7');
	}

	const body = await request.json().catch(() => ({}));
	const open = !!body?.is_open;

	// CLOSE: only flip the flag; do not modify times.
	if (!open) {
		const res: any = await q('UPDATE business_hours SET is_open = 0 WHERE week_day = ?', [day]);

		// If the row doesn't exist yet, create one with defaults but closed.
		if (!res?.affectedRows) {
			await q(
				'INSERT INTO business_hours (week_day, start_time, end_time, is_open) VALUES (?, ?, ?, 0)',
				[day, DEFAULT_START, DEFAULT_END]
			);
		}
		return json({ ok: true });
	}

	// OPEN: require times and upsert them.
	const st = toHHMMSS(body?.start_time);
	const et = toHHMMSS(body?.end_time);
	if (st >= et) throw error(400, 'opening time cannot be after closing time');

	await q(
		`INSERT INTO business_hours (week_day, start_time, end_time, is_open)
		 VALUES (?, ?, ?, 1)
		 ON DUPLICATE KEY UPDATE start_time = VALUES(start_time),
		                         end_time   = VALUES(end_time),
		                         is_open    = VALUES(is_open)`,
		[day, st, et]
	);

	return json({ ok: true });
};
