import type { Cookies } from '@sveltejs/kit';

const COOKIE_NAME = 'user';

export type UserPayload = { id: number; email: string; role: 'admin' | 'staff' | 'user' };

export function setUserCookie({ cookies }: { cookies: Cookies }, user: UserPayload) {
	cookies.set(COOKIE_NAME, JSON.stringify(user), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: 60 * 60 * 24 * 7
	});
}

export function clearUserCookie({ cookies }: { cookies: Cookies }) {
	cookies.delete(COOKIE_NAME, { path: '/' });
}

export function getUserFromCookies(cookies: Cookies): UserPayload | null {
	const raw = cookies.get(COOKIE_NAME);
	if (!raw) return null;
	try {
		const u = JSON.parse(raw);
		if (
			u &&
			typeof u.id === 'number' &&
			typeof u.email === 'string' &&
			typeof u.role === 'string'
		) {
			return u as UserPayload;
		}
	} catch {}
	return null;
}

export function requireAdmin(user: UserPayload | null) {
	if (!user || user.role !== 'admin') {
		const err = Object.assign(new Error('Unauthorized'), { status: 401 });
		throw err;
	}
}
