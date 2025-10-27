import { json, error } from '@sveltejs/kit';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';

export const GET = async ({ locals, url }) => {
	requireAdmin(locals.user);
	const date = url.searchParams.get('date'); // 'yyyy-mm-dd' or null
	const rows = date
		? await q<any[]>('SELECT * FROM appointments WHERE date = ? ORDER BY time ASC', [date])
		: await q<any[]>('SELECT * FROM appointments ORDER BY date DESC, time ASC LIMIT 200', []);
	return json({ items: rows });
};
