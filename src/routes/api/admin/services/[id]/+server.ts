import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';

export const PUT: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	const id = Number(event.params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(400, 'invalid ID');

	const body = await event.request.json().catch(() => ({}) as any);
	const {
		name,
		description = null,
		price,
		availability
	} = body as {
		name: string;
		description?: string | null;
		price: number | string;
		availability: boolean | 0 | 1;
	};

	if (!name || !String(name).trim()) throw error(400, 'name is required');
	const p = Number(price);
	if (!Number.isFinite(p) || p < 0) throw error(400, 'price must be a non-negative number');

	const avail = !!availability ? 1 : 0;

	const res: any = await q(
		`UPDATE services
        SET name = ?, description = ?, price = ?, availability = ?
      WHERE id = ?`,
		[String(name).trim(), description ? String(description) : null, p, avail, id]
	);
	if (!res?.affectedRows) throw error(404, 'not found');

	return json({ ok: true });
};

export const DELETE: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	const id = Number(event.params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(400, 'invalid ID');

	const res: any = await q(`DELETE FROM services WHERE id = ?`, [id]);
	if (!res?.affectedRows) throw error(404, 'not found');

	return json({ ok: true });
};
