// src/routes/api/services/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { q } from '$lib/server/db';
import crypto from 'node:crypto';

type ServiceRow = {
	id: number;
	name: string;
	description: string | null;
	price: number | string;
	availability?: number | string;
};

function makeEtag(payload: unknown) {
	const body = JSON.stringify(payload);
	const hash = crypto.createHash('sha256').update(body).digest('base64url');
	return `"${hash}"`;
}

export const GET: RequestHandler = async ({ request, locals }) => {
	// Public users: only show available services
	// If you want admins to see everything, you can extend this later.
	const rows = await q<ServiceRow[]>(
		`SELECT id, name, description, (price + 0) AS price, (availability + 0) AS availability
		   FROM services
		  WHERE (availability + 0) = 1
		  ORDER BY id ASC`
	);

	const services = (rows ?? []).map((r) => ({
		id: r.id,
		name: r.name,
		description: r.description ?? null,
		price: Number(r.price)
	}));

	const etag = makeEtag(services);
	const inm = request.headers.get('if-none-match');

	if (inm && inm === etag) {
		return new Response(null, {
			status: 304,
			headers: {
				ETag: etag,
				'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400'
			}
		});
	}

	return json(services, {
		headers: {
			ETag: etag,
			'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400'
		}
	});
};
