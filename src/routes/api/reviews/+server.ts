import { json, type RequestHandler } from '@sveltejs/kit';
import { q } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	const limit = Math.max(0, Math.min(50, Math.floor(Number(url.searchParams.get('limit') ?? '0'))));
	const offset = Math.max(0, Math.floor(Number(url.searchParams.get('offset') ?? '0')));
	const sortParam = (url.searchParams.get('sort') ?? 'newest').toLowerCase();
	const withCount = url.searchParams.get('withCount') === '1';
	const orderBy =
		sortParam === 'rating_desc'
			? 'Rating DESC, CreatedAt DESC, ReviewID DESC'
			: sortParam === 'rating_asc'
				? 'Rating ASC,  CreatedAt DESC, ReviewID DESC'
				: 'CreatedAt DESC, ReviewID DESC';

	try {
		const base = `
      SELECT ReviewID, Rating, TypeOfMassage, Comments, CreatedAt
      FROM \`reviews\`
      ORDER BY ${orderBy}
    `;
		const sql = limit > 0 ? `${base} LIMIT ${limit} OFFSET ${offset}` : base;

		const items = await q<any[]>(sql);
		if (!withCount) return json(items);

		const totalRows = await q<any[]>(`SELECT COUNT(*) AS c FROM \`reviews\``);
		const total = Number(totalRows?.[0]?.c ?? 0);
		return json({ items, total });
	} catch {
		return new Response('Failed to load reviews', {
			status: 500,
			headers: { 'content-type': 'text/plain' }
		});
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({}) as any);
		const { TypeOfMassage, Rating, Comments, contact } = body ?? {};
		const ratingNum = Number(Rating);
		if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
			return new Response('Rating must be between 1 and 5.', {
				status: 400,
				headers: { 'content-type': 'text/plain' }
			});
		}
		if (typeof TypeOfMassage !== 'string' || !TypeOfMassage.trim()) {
			return new Response('Please include the type of massage', {
				status: 400,
				headers: { 'content-type': 'text/plain' }
			});
		}
		if (TypeOfMassage.length > 50) {
			return new Response('Type of massage is too long', {
				status: 400,
				headers: { 'content-type': 'text/plain' }
			});
		}
		if (Comments != null && typeof Comments !== 'string') {
			return new Response('Comments must be a string.', {
				status: 400,
				headers: { 'content-type': 'text/plain' }
			});
		}
		if (Comments && Comments.length > 500) {
			return new Response('Comments too long', {
				status: 400,
				headers: { 'content-type': 'text/plain' }
			});
		}
		if (!contact || typeof contact !== 'string') {
			return new Response('Email or phone is required.', {
				status: 400,
				headers: { 'content-type': 'text/plain' }
			});
		}

		const digits = String(contact).replace(/\D/g, '');
		const phone10 =
			digits.length === 10
				? digits
				: digits.length === 11 && digits.startsWith('1')
					? digits.slice(1)
					: null;
		const maybeEmail = /\S+@\S+\.\S+/.test(contact) ? contact : null;

		const clauses: string[] = [];
		const params: any[] = [];
		if (maybeEmail) {
			clauses.push('email = ?');
			params.push(maybeEmail);
		}
		if (phone10) {
			clauses.push('phoneNumber = ?');
			params.push(phone10);
		}

		if (!clauses.length) {
			return new Response('Provide a valid email or a 10-digit phone number.', {
				status: 400,
				headers: { 'content-type': 'text/plain' }
			});
		}

		const verifierSql = `SELECT id FROM appointments WHERE ${clauses.join(' OR ')} LIMIT 1`;
		const match = await q<any[]>(verifierSql, params);
		if (!match.length) {
			return new Response('No matching past appointment for that email/phone.', {
				status: 403,
				headers: { 'content-type': 'text/plain' }
			});
		}

		const ins = await q<any>(
			`INSERT INTO \`reviews\` (Rating, TypeOfMassage, Comments) VALUES (?, ?, ?)`,
			[ratingNum, TypeOfMassage.trim(), Comments?.trim() || null]
		);

		const [created] = await q<any[]>(
			`SELECT ReviewID, Rating, TypeOfMassage, Comments, CreatedAt FROM \`reviews\` WHERE ReviewID = ?`,
			[ins.insertId]
		);

		return json(created ?? null, { status: 201 });
	} catch {
		return new Response('Failed to submit review', {
			status: 500,
			headers: { 'content-type': 'text/plain' }
		});
	}
};
