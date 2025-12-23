// src/routes/api/admin/locations/[id]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';

const toTrimmedStringOrNull = (v: unknown): string | null => {
	if (v === null || v === undefined) return null;
	return String(v).trim();
};

const isFiniteNumber = (v: unknown) => {
	if (typeof v === 'number') return Number.isFinite(v);
	if (typeof v === 'string' && v.trim() !== '') return Number.isFinite(Number(v));
	return false;
};

const toNumber = (v: unknown, field: string): number => {
	if (!isFiniteNumber(v)) throw error(400, `invalid ${field}`);
	return typeof v === 'number' ? v : Number(String(v));
};

export const PUT: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	const id = Number(event.params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(400, 'invalid ID');

	const body = await event.request.json().catch(() => ({}) as any);

	const name = toTrimmedStringOrNull(body?.name);
	const address = toTrimmedStringOrNull(body?.address);
	const postal = toTrimmedStringOrNull(body?.postal);
	const city = toTrimmedStringOrNull(body?.city);
	const province = toTrimmedStringOrNull(body?.province);

	// allow null/undefined from client, but DB fields are usually NOT NULL
	if (!name) throw error(400, 'name is required');
	if (!address) throw error(400, 'address is required');
	if (!postal) throw error(400, 'postal is required');
	if (!city) throw error(400, 'city is required');
	if (!province) throw error(400, 'province is required');

	const lat = toNumber(body?.lat, 'lat');
	const lng = toNumber(body?.lng, 'lng');

	// Optional sanity checks (feel free to relax if needed)
	if (lat < -90 || lat > 90) throw error(400, 'invalid lat range');
	if (lng < -180 || lng > 180) throw error(400, 'invalid lng range');

	const result: any = await q(
		`UPDATE locations
		    SET \`name\` = ?, \`address\` = ?, \`postal\` = ?,
		        \`city\` = ?, \`province\` = ?, \`lat\` = ?, \`lng\` = ?
		  WHERE id = ?`,
		[name, address, postal, city, province, lat, lng, id]
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

	const res: any = await q('DELETE FROM locations WHERE id = ?', [id]);
	if (!res?.affectedRows) throw error(404, 'not found');

	return json({ ok: true });
};
