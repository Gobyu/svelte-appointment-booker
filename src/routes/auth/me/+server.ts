import { json } from '@sveltejs/kit';

export const GET = async ({ locals }) => {
	return json(locals.user ?? null);
};
