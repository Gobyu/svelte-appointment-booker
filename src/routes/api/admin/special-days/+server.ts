// src/routes/api/admin/special-days/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { isISODate } from '$lib/server/utils';

// Minimal timestamp validator/normalizer for 'YYYY-MM-DD HH:MM[:SS]' or 'YYYY-MM-DDTHH:MM[:SS]'
const isISODateTime = (s: unknown) =>
	typeof s === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s);

const normalizeTimestamp = (s: string | null | undefined): string | null => {
	if (!s) return null;
	const t = s.replace('T', ' ');
	return t.length === 16 ? `${t}:00` : t; // add :SS if missing
};

/** GET: list special days within a real date range (inclusive) */
export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	const from = event.url.searchParams.get('from') ?? '';
	const to = event.url.searchParams.get('to') ?? '';
	if (!isISODate(from) || !isISODate(to)) throw error(400, 'a date range is required');

	const rows = await q<any[]>(
		`SELECT id,
		        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
		        DATE_FORMAT(end_date,   '%Y-%m-%d') AS end_date,
		        \`label\`, \`comment\`, (is_open + 0) AS is_open,
		        DATE_FORMAT(start_time, '%Y-%m-%d %H:%i:%S') AS start_time,
		        DATE_FORMAT(end_time,   '%Y-%m-%d %H:%i:%S') AS end_time
		   FROM special_days
		  WHERE NOT (COALESCE(end_date, start_date) < ? OR start_date > ?)
		  ORDER BY start_date ASC, COALESCE(end_date, start_date) ASC, id ASC`,
		[from, to]
	);

	const normalized = (rows ?? []).map((r) => ({
		id: r.id,
		start_date: r.start_date,
		end_date: r.end_date,
		label: r.label,
		comment: r.comment ?? null,
		is_open: r.is_open === 1,
		start_time: r.start_time, // 'YYYY-MM-DD HH:MM:SS' or null
		end_time: r.end_time
	}));

	return json(normalized);
};

/** POST: create a new special day */
export const POST: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	const body = await event.request.json().catch(() => ({}) as any);
	const {
		start_date,
		end_date = null,
		label,
		comment = null,
		is_open,
		start_time,
		end_time
	} = body as {
		start_date: string;
		end_date?: string | null;
		label: string;
		comment?: string | null;
		is_open: boolean | 0 | 1;
		start_time?: string | null; // 'YYYY-MM-DD HH:MM[:SS]' or '...T...'
		end_time?: string | null;
	};

	if (!isISODate(start_date)) throw error(400, 'invalid start_date');
	if (end_date && !isISODate(end_date)) throw error(400, 'invalid end_date');
	if (!label || !String(label).trim()) throw error(400, 'label is required');

	const open = !!is_open;
	const st = open ? normalizeTimestamp(start_time) : null;
	const et = open ? normalizeTimestamp(end_time) : null;

	if (open) {
		if (!st || !et) throw error(400, 'start_time and end_time are required when open');
		if (!isISODateTime(st) || !isISODateTime(et)) throw error(400, 'invalid timestamp format');
		// ensure chronological order
		if (st >= et) throw error(400, 'start_time must be before end_time');
	}
	if (end_date && end_date < start_date) throw error(400, 'invalid date range');

	const result: any = await q(
		`INSERT INTO special_days
		 (\`label\`, \`comment\`, is_open, start_date, end_date, start_time, end_time)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			String(label).trim(),
			comment ? String(comment).trim() : null,
			open ? 1 : 0,
			start_date,
			end_date,
			st,
			et
		]
	);

	return json({ ok: true, id: result?.insertId ?? null });
};
