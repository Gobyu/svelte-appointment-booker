import { json } from '@sveltejs/kit';
import { clearUserCookie } from '$lib/server/auth';

export const POST = async ({ cookies }) => {
	clearUserCookie({ cookies } as any);
	return json({ ok: true });
};
