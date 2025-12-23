// src/routes/api/admin/appointments/[id]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { isISODate } from '$lib/server/utils';

const isHHMM = (s: unknown) => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);
const isHHMMSS = (s: unknown) => typeof s === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(s);
const normalizeTime = (s: string | null | undefined): string | null => {
	if (!s) return null;
	const t = String(s).trim();
	if (isHHMM(t)) return `${t}:00`;
	if (isHHMMSS(t)) return t;
	return null;
};

const to01 = (v: unknown): 0 | 1 => (v === 1 || v === true ? 1 : 0);

export const PUT: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	const id = Number(event.params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(400, 'invalid ID');

	const body = await event.request.json().catch(() => ({}) as any);

	// Accept partial updates
	const { name, email, phoneNumber, location, date, time, duration, type, comments, active, paid } =
		body as Partial<{
			name: string;
			email: string | null;
			phoneNumber: string | null;
			location: string | null;
			date: string;
			time: string | null; // "HH:MM" or "HH:MM:SS"
			duration: number;
			type: string;
			comments: string | null;
			active: boolean | 0 | 1;
			paid: boolean | 0 | 1;
		}>;

	const sets: string[] = [];
	const vals: any[] = [];

	if ('name' in body) {
		const v = String(name ?? '').trim();
		if (!v) throw error(400, 'name is required');
		sets.push('`name` = ?');
		vals.push(v); // "VOID" is allowed
	}

	if ('email' in body) {
		const v = email === null || email === undefined ? null : String(email).trim();
		sets.push('`email` = ?');
		vals.push(v || null);
	}

	if ('phoneNumber' in body) {
		const v = phoneNumber === null || phoneNumber === undefined ? null : String(phoneNumber).trim();
		sets.push('`phone_number` = ?');
		vals.push(v || null);
	}

	if ('location' in body) {
		const v = location === null || location === undefined ? null : String(location).trim();
		sets.push('`location` = ?');
		vals.push(v || null);
	}

	if ('date' in body) {
		if (!date || !isISODate(date)) throw error(400, 'invalid date');
		sets.push('`date` = ?');
		vals.push(date);
	}

	if ('time' in body) {
		const t = normalizeTime(time);
		if (time !== null && time !== undefined && t === null) throw error(400, 'invalid time');
		sets.push('`time` = ?');
		vals.push(t);
	}

	if ('duration' in body) {
		const d = Number(duration);
		if (!Number.isFinite(d) || d <= 0) throw error(400, 'invalid duration');
		sets.push('`duration` = ?');
		vals.push(Math.trunc(d));
	}

	if ('type' in body) {
		const v = String(type ?? '').trim();
		if (!v) throw error(400, 'type is required');
		sets.push('`type` = ?');
		vals.push(v);
	}

	if ('comments' in body) {
		const v = comments === null || comments === undefined ? null : String(comments).trim();
		sets.push('`comments` = ?');
		vals.push(v || null);
	}

	if ('active' in body) {
		sets.push('`active` = ?');
		vals.push(to01(active));
	}

	if ('paid' in body) {
		sets.push('`paid` = ?');
		vals.push(to01(paid));
	}

	if (!sets.length) throw error(400, 'no changes provided');

	const res: any = await q(`UPDATE appointments SET ${sets.join(', ')} WHERE id = ?`, [
		...vals,
		id
	]);
	if (!res?.affectedRows) throw error(404, 'not found');

	return json({ ok: true });
};

// No deletes — "void" by setting name to "VOID"
export const DELETE: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	throw error(405, 'Deleting appointments is not supported. Set client name to "VOID" instead.');
};
