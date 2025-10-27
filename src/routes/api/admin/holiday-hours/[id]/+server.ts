// src/routes/api/admin/holiday-hours/[id]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { normalizeTimeHHMMSS } from '$lib/server/utils';

function maxDayForMonth(m: number) {
	return [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m] ?? 31;
}
function validMD(m?: number, d?: number) {
	return !!m && !!d && m >= 1 && m <= 12 && d >= 1 && d <= maxDayForMonth(m);
}

export const PUT: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	const id = Number(event.params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(400, 'invalid ID');

	const body = await event.request.json().catch(() => ({}) as any);
	const {
		holiday,
		comment = null,
		is_open,
		start_time,
		end_time,
		start_month,
		start_day,
		end_month,
		end_day
	} = body as {
		holiday: string;
		comment?: string | null;
		is_open: boolean | 0 | 1;
		start_time?: string | null; // 'HH:MM'
		end_time?: string | null; // 'HH:MM'
		start_month: number;
		start_day: number;
		end_month?: number;
		end_day?: number;
	};

	if (!holiday || !String(holiday).trim()) throw error(400, 'holiday is required');

	const sm = Number(start_month);
	const sd = Number(start_day);
	const em = Number(end_month ?? sm);
	const ed = Number(end_day ?? sd);

	if (!validMD(sm, sd)) throw error(400, 'invalid start month/day');
	if (!validMD(em, ed)) throw error(400, 'invalid end month/day');

	const open = !!is_open;
	const st = open ? normalizeTimeHHMMSS(start_time) : null;
	const et = open ? normalizeTimeHHMMSS(end_time) : null;

	if (open) {
		if (!st || !et) throw error(400, 'opening and closing time are required');
		if (st >= et) throw error(400, 'opening time cannot be after closing time');
	}

	const result: any = await q(
		`UPDATE holiday_hours
		    SET holiday = ?, comment = ?, is_open = ?,
		        start_time = ?, end_time = ?,
		        start_month = ?, start_day = ?, end_month = ?, end_day = ?
		  WHERE id = ?`,
		[
			String(holiday).trim(),
			comment ? String(comment).trim() : null,
			open ? 1 : 0,
			st,
			et,
			sm,
			sd,
			em,
			ed,
			id
		]
	);

	if (!result?.affectedRows) throw error(404, 'not found');
	return json({ ok: true });
};

export const DELETE: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	const id = Number(event.params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(400, 'invalid ID');

	const result: any = await q('DELETE FROM holiday_hours WHERE id = ?', [id]);
	if (!result?.affectedRows) throw error(404, 'not found');
	return json({ ok: true });
};
