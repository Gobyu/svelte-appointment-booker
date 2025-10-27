import { json, error } from '@sveltejs/kit';
import { q } from '$lib/server/db';
import { isISODate } from '$lib/server/utils';

export const GET = async ({ url }) => {
	const date = url.searchParams.get('date') ?? '';
	if (!isISODate(date)) throw error(400, 'invalid date format');

	const md = Number(date.slice(5, 7) + date.slice(8, 10));

	const sql = `
    SELECT
      holiday,
      \`comment\`,
      (is_open + 0) AS is_open,
      DATE_FORMAT(start_time, '%H:%i') AS start_time,
      DATE_FORMAT(end_time,   '%H:%i') AS end_time
    FROM holiday_hours
    WHERE
      (start_md <= end_md AND ? BETWEEN start_md AND end_md)
      OR
      (start_md >  end_md AND (? >= start_md OR ? <= end_md))
    -- prefer single-day rows if overlaps exist, then smallest id
    ORDER BY (start_md = end_md) DESC, id ASC
    LIMIT 1
  `;

	const rows = await q<any[]>(sql, [md, md, md]);
	if (!rows?.length) return json({ exists: false });

	const r = rows[0];
	return json({
		exists: true,
		holiday: r.holiday,
		comment: r.comment,
		is_open: r.is_open === 1,
		start_time: r.start_time,
		end_time: r.end_time
	});
};
