import { json, error } from '@sveltejs/kit';
import { q } from '$lib/server/db';
import bcrypt from 'bcrypt';
import { setUserCookie } from '$lib/server/auth';

export const POST = async ({ request, cookies }) => {
  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) throw error(400, { message: 'Missing credentials' });

  const rows = await q<any[]>(
    'SELECT id, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  const user = rows?.[0];
  if (!user) throw error(401, { message: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw error(401, { message: 'Invalid email or password' });

  setUserCookie({ cookies } as any, { id: user.id, email: user.email, role: user.role });
  return json({ id: user.id, email: user.email, role: user.role });
};
