import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';

const toBool = (v: any) => !!Number(v);

export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

	const rows = await q<any[]>(
		`SELECT id, name, description, (price + 0) AS price, (availability + 0) AS availability
       FROM services
      ORDER BY name IS NULL, name ASC, id ASC`
	);

	return json(
		(rows ?? []).map((r) => ({
			id: r.id,
			name: r.name,
			description: r.description ?? null,
			price: Number(r.price),
			availability: toBool(r.availability)
		}))
	);
};

export const POST: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	await requireAdmin(user);

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
		`INSERT INTO services (name, description, price, availability)
     VALUES (?, ?, ?, ?)`,
		[String(name).trim(), description ? String(description) : null, p, avail]
	);

	return json({ ok: true, id: res?.insertId ?? null });
};
