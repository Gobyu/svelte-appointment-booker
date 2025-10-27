// src/routes/api/admin/special-days/[id]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { isISODate } from '$lib/server/utils';

const isISODateTime = (s: unknown) =>
	typeof s === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s);

const normalizeTimestamp = (s: string | null | undefined): string | null => {
	if (!s) return null;
	const t = s.replace('T', ' ');
	return t.length === 16 ? `${t}:00` : t;
};

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
		start_time?: string | null;
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
		if (st >= et) throw error(400, 'start_time must be before end_time');
	}
	if (end_date && end_date < start_date) throw error(400, 'invalid date range');

	const result: any = await q(
		`UPDATE special_days
		    SET \`label\` = ?, \`comment\` = ?, is_open = ?,
		        start_date = ?, end_date = ?,
		        start_time = ?, end_time = ?
		  WHERE id = ?`,
		[
			String(label).trim(),
			comment ? String(comment).trim() : null,
			open ? 1 : 0,
			start_date,
			end_date,
			st,
			et,
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

	const res: any = await q('DELETE FROM special_days WHERE id = ?', [id]);
	if (!res?.affectedRows) throw error(404, 'not found');

	return json({ ok: true });
};
