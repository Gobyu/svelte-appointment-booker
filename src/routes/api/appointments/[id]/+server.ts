import { json, error } from '@sveltejs/kit';
import { q } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';

export const PATCH = async ({ locals, params, request }) => {
	requireAdmin(locals.user);
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid id');

	const patch = await request.json().catch(() => ({}));
	const allow = ['active', 'paid', 'date', 'time', 'duration', 'type', 'comments'];
	const fields = Object.keys(patch).filter((k) => allow.includes(k));
	if (fields.length === 0) throw error(400, 'No valid fields');

	const sets: string[] = [];
	const values: any[] = [];
	for (const f of fields) {
		sets.push(`${f} = ?`);
		values.push(patch[f]);
	}
	values.push(id);

	const sql = `UPDATE appointments SET ${sets.join(', ')} WHERE id = ? LIMIT 1`;
	await q(sql, values);
	const row = (await q<any[]>('SELECT * FROM appointments WHERE id = ? LIMIT 1', [id]))[0];
	return json(row ?? {});
};
