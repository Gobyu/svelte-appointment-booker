import type { LayoutServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user) {
    const redir = encodeURIComponent(url.pathname + url.search);
    throw redirect(302, `/login?redirect=${redir}`);
  }
  if (user.role !== 'admin') {
    throw error(403, 'Admins only');
  }
  return { user };
};

export const prerender = false;
