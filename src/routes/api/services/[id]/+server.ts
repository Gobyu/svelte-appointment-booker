import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	const id = Number(event.params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(400, 'invalid ID');

	const rows = await q<any[]>(
		`SELECT id, name, description, (price + 0) AS price, (availability + 0) AS availability
       FROM services
      WHERE id = ?
      LIMIT 1`,
		[id]
	);

	if (!rows?.length) throw error(404, 'not found');

	const r = rows[0];
	const isAvailable = Number(r.availability) === 1;

	if (!isAvailable) {
		const user = event.locals.user;
		if (!user) throw error(404, 'not found');
		await requireAdmin(user);
	}

	return json({
		id: r.id,
		name: r.name,
		description: r.description ?? null,
		price: Number(r.price),
		availability: isAvailable
	});
};
