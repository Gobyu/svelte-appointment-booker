import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import crypto from 'node:crypto';

type LocationRow = {
	id: number;
	name: string;
	address: string;
	postal: string;
	city: string;
	province: string;
	lat: number;
	lng: number;
};

function makeEtag(payload: unknown) {
	// Strong ETag based on exact JSON bytes we return
	const body = JSON.stringify(payload);
	const hash = crypto.createHash('sha256').update(body).digest('base64url');
	return `"${hash}"`;
}

export const GET: RequestHandler = async ({ request }) => {
	const [rows] = await pool.query<any[]>(
		`
    SELECT id, name, address, postal, city, province, lat, lng
    FROM locations
    ORDER BY id ASC
    `
	);

	const locations = (rows as LocationRow[]).map((r) => ({
		...r,
		lat: typeof r.lat === 'string' ? Number(r.lat) : r.lat,
		lng: typeof r.lng === 'string' ? Number(r.lng) : r.lng
	}));

	const etag = makeEtag(locations);
	const inm = request.headers.get('if-none-match');
	if (inm && inm === etag) {
		return new Response(null, {
			status: 304,
			headers: {
				ETag: etag,
				// Locations rarely change; allow long cache, SWR for smooth refresh.
				'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
			}
		});
	}

	return json(locations, {
		headers: {
			ETag: etag,
			'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
		}
	});
};
