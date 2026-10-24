import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		const raw = url.searchParams.get('redirect') || '/';
		const safe = raw.startsWith('/') && !raw.startsWith('//') && raw !== '/login' ? raw : '/';
		throw redirect(302, safe);
	}
	return {};
};
