import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { isISODate, normalizeTimeHHMMSS } from '$lib/server/utils';

export const PUT: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	const id = Number(event.params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(400, 'invalid ID');

	const body = await event.request.json().catch(() => ({}) as any);
	const {
		start_date,
		end_date = null,
		holiday,
		comment = null,
		is_open,
		start_time,
		end_time
	} = body as {
		start_date: string;
		end_date?: string | null;
		holiday: string;
		comment?: string | null;
		is_open: boolean | 0 | 1;
		start_time?: string | null;
		end_time?: string | null;
	};

	if (!isISODate(start_date)) throw error(400, 'invalid date format');
	if (end_date && !isISODate(end_date)) throw error(400, 'invalid date format');
	if (!holiday || !String(holiday).trim()) throw error(400, 'holiday is required');

	const open = !!is_open;
	const st = open ? normalizeTimeHHMMSS(start_time) : null;
	const et = open ? normalizeTimeHHMMSS(end_time) : null;

	if (open) {
		if (!st || !et) throw error(400, 'opening and closing time are required');
		if (st >= et) throw error(400, 'opening time cannot be after closing time');
	}
	if (end_date && end_date < start_date) throw error(400, 'invalid date range');

	const sql = `
    UPDATE holiday_hours
       SET start_date = ?, end_date = ?, holiday = ?, comment = ?, is_open = ?,
           start_time = ?, end_time = ?
     WHERE id = ?
  `;
	const result: any = await q(sql, [
		start_date,
		end_date,
		String(holiday).trim(),
		comment ? String(comment).trim() : null,
		open ? 1 : 0,
		st,
		et,
		id
	]);
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
