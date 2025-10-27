// src/routes/api/admin/holiday-hours/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import { isISODate } from '$lib/server/utils';
import { requireAdmin } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');

	await requireAdmin(user);

	const from = event.url.searchParams.get('from') ?? '';
	const to = event.url.searchParams.get('to') ?? '';
	if (!isISODate(from) || !isISODate(to)) throw error(400, 'a date range is required');

	const sql = `
    SELECT id,
           DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
           DATE_FORMAT(end_date,   '%Y-%m-%d') AS end_date,
           holiday, comment, (is_open + 0) AS is_open,
           DATE_FORMAT(start_time, '%H:%i') AS start_time,
           DATE_FORMAT(end_time,   '%H:%i') AS end_time
    FROM holiday_hours
    WHERE NOT (COALESCE(end_date, start_date) < ? OR start_date > ?)
    ORDER BY start_date ASC, COALESCE(end_date, start_date) ASC, id ASC
  `;

	const rows = await q<any[]>(sql, [from, to]);
	const normalized = rows.map((r) => ({ ...r, is_open: r.is_open === 1 }));
	return json(normalized);
};
