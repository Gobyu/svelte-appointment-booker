import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	const rows = await q<any[]>(
		`SELECT id, name, description, (price + 0) AS price
       FROM services
      WHERE availability = 1
      ORDER BY name IS NULL, name ASC, id ASC`
	);

	const data = (rows ?? []).map((r) => ({
		id: r.id,
		name: r.name,
		description: r.description ?? null,
		price: Number(r.price)
	}));

	return json(data, {
		headers: {
			'Cache-Control': 'public, max-age=60'
		}
	});
};
