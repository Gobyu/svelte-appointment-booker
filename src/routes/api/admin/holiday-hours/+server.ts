// src/routes/api/admin/holiday-hours/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { isISODate, normalizeTimeHHMMSS } from '$lib/server/utils';

function maxDayForMonth(m: number) {
	// Allow Feb 29 (for leap-day entries); validate strictly for 30/31-day months
	return [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m] ?? 31;
}
function validMD(m?: number, d?: number) {
	return !!m && !!d && m >= 1 && m <= 12 && d >= 1 && d <= maxDayForMonth(m);
}

/** GET: list all holiday rows (range params optional; ignored for year-agnostic data) */
export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	// Optional; if present but invalid, 400 (keeps callers honest)
	const from = event.url.searchParams.get('from');
	const to = event.url.searchParams.get('to');
	if ((from && !isISODate(from)) || (to && !isISODate(to))) {
		throw error(400, 'invalid date range');
	}

	const rows = await q<any[]>(
		`SELECT
			 id,
			 holiday,
			 comment,
			 (is_open + 0) AS is_open,
			 DATE_FORMAT(start_time, '%H:%i') AS start_time,
			 DATE_FORMAT(end_time,   '%H:%i') AS end_time,
			 start_month, start_day, end_month, end_day
		 FROM holiday_hours
		 ORDER BY (start_month*100 + start_day) ASC, (end_month*100 + end_day) ASC, id ASC`
	);

	const normalized = (rows ?? []).map((r) => ({
		id: r.id,
		holiday: r.holiday,
		comment: r.comment ?? null,
		is_open: r.is_open === 1,
		start_time: r.start_time ?? null, // 'HH:MM' or null
		end_time: r.end_time ?? null,
		start_month: Number(r.start_month),
		start_day: Number(r.start_day),
		end_month: Number(r.end_month),
		end_day: Number(r.end_day)
	}));

	return json(normalized);
};

/** POST: create a new annual holiday override */
export const POST: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

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
		`INSERT INTO holiday_hours
		 (holiday, comment, is_open, start_time, end_time, start_month, start_day, end_month, end_day)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			String(holiday).trim(),
			comment ? String(comment).trim() : null,
			open ? 1 : 0,
			st,
			et,
			sm,
			sd,
			em,
			ed
		]
	);

	return json({ ok: true, id: result?.insertId ?? null });
};
