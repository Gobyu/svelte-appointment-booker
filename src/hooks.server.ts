import type { Handle } from '@sveltejs/kit';
import { getUserFromCookies } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = getUserFromCookies(event.cookies);
	return resolve(event);
};
