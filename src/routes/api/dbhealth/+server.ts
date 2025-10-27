import { json } from '@sveltejs/kit';
import { q } from '$lib/server/db';

export const GET = async () => {
	try {
		// trivial query that works everywhere
		const rows = await q('SELECT 1 AS ok');
		return json({ ok: true, rows });
	} catch (err: any) {
		console.error('db-health error:', err?.code || err?.name, err?.message);
		return new Response(JSON.stringify({ ok: false, code: err?.code, message: err?.message }), {
			status: 500,
			headers: { 'content-type': 'application/json' }
		});
	}
};
