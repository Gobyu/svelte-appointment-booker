import { json, error } from '@sveltejs/kit';
import { q } from '$lib/server/db';
import { addMinutesHHMM, isISODate, jsWeekdayMonday1to7, toHHMM } from '$lib/server/utils';

export const GET = async ({ url }) => {
	const date = url.searchParams.get('date') ?? '';
	const slotMinutes = Math.max(5, parseInt(url.searchParams.get('slotMinutes') ?? '30', 10) || 30);
	if (!isISODate(date)) throw error(400, 'date must be YYYY-MM-DD');

	const pad2 = (n: number) => String(n).padStart(2, '0');
	const toHHMMFromDate = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

	const handleWithWindow = async (
		start_time?: string | null,
		end_time?: string | null,
		meta: Record<string, any> = {}
	) => {
		if (!start_time || !end_time) {
			return json({ date, slotMinutes, times: [], ...meta });
		}

		let start = toHHMM(start_time);
		let end = toHHMM(end_time);

		const candidates: string[] = [];
		for (let t = start; addMinutesHHMM(t, slotMinutes) <= end; t = addMinutesHHMM(t, slotMinutes)) {
			candidates.push(t);
		}

		const now = new Date();
		const isToday = new Date(`${date}T00:00:00`).toDateString() === now.toDateString();
		const future = isToday
			? candidates.filter((t) => new Date(`${date}T${t}:00`) > now)
			: candidates;
		if (future.length === 0) return json({ date, slotMinutes, times: [], ...meta });

		const apptSql = `SELECT id, time, duration FROM appointments WHERE date = ?`;
		const aRows = await q<any[]>(apptSql, [date]);
		const existing = (aRows || []).map((r) => ({
			start: toHHMM(r.time),
			end: addMinutesHHMM(toHHMM(r.time), Number(r.duration) || 0)
		}));
		const overlaps = (s: string, e: string, S: string, E: string) => s < E && e > S;

		const free = future.filter((t) => {
			const e = addMinutesHHMM(t, slotMinutes);
			for (const ex of existing) if (overlaps(t, e, ex.start, ex.end)) return false;
			return true;
		});

		return json({ date, slotMinutes, times: free, ...meta });
	};
	const specialSql = `
		SELECT
			id,
			label,
			\`comment\`,
			(is_open + 0) AS is_open,
			-- return timestamps as strings we can parse reliably
			DATE_FORMAT(start_time, '%Y-%m-%d %H:%i:%S') AS start_ts,
			DATE_FORMAT(end_time,   '%Y-%m-%d %H:%i:%S') AS end_ts,
			DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
			DATE_FORMAT(COALESCE(end_date, start_date), '%Y-%m-%d') AS end_date
		FROM special_days
		WHERE start_date <= ?
		  AND COALESCE(end_date, start_date) >= ?
		ORDER BY
		  (COALESCE(end_date, start_date) = start_date) DESC,
		  DATEDIFF(COALESCE(end_date, start_date), start_date) ASC,
		  id ASC
		LIMIT 1
	`;
	const sRows = await q<any[]>(specialSql, [date, date]);
	if (sRows?.length) {
		const s = sRows[0];

		if (s.is_open === 0) {
			return json({
				date,
				slotMinutes,
				times: [],
				holidayLabel: s.label ?? null,
				holidayComment: s.comment ?? null,
				isOpenOverride: false
			});
		}

		if (s.start_ts && s.end_ts) {
			const dayStart = new Date(`${date}T00:00:00`);
			const dayEnd = new Date(`${date}T23:59:59`);
			const rangeStart = new Date(s.start_ts.replace(' ', 'T'));
			const rangeEnd = new Date(s.end_ts.replace(' ', 'T'));

			const windowStart = rangeStart > dayStart ? rangeStart : dayStart;
			const windowEnd = rangeEnd < dayEnd ? rangeEnd : dayEnd;

			if (windowStart >= windowEnd) {
				return json({
					date,
					slotMinutes,
					times: [],
					holidayLabel: s.label ?? null,
					holidayComment: s.comment ?? null,
					isOpenOverride: true
				});
			}

			const startHHMM = toHHMMFromDate(windowStart);
			const endHHMM = toHHMMFromDate(windowEnd);

			return handleWithWindow(startHHMM, endHHMM, {
				holidayLabel: s.label ?? null,
				holidayComment: s.comment ?? null,
				isOpenOverride: true
			});
		}

		var specialMeta: Record<string, any> | null = {
			holidayLabel: s.label ?? null,
			holidayComment: s.comment ?? null,
			isOpenOverride: true
		};
	} else {
		var specialMeta: Record<string, any> | null = null;
	}
	if (!sRows?.length) {
		const md = Number(date.slice(5, 7) + date.slice(8, 10));
		const holidaySql = `
			SELECT
				id, holiday, comment, is_open, start_time, end_time, start_md, end_md
			FROM holiday_hours
			WHERE
				(start_md <= end_md AND ? BETWEEN start_md AND end_md)
				OR
				(start_md >  end_md AND (? >= start_md OR ? <= end_md))
			ORDER BY (start_md = end_md) DESC, id ASC
			LIMIT 1
		`;
		const hRows = await q<any[]>(holidaySql, [md, md, md]);
		const holiday = hRows[0] ?? null;

		if (holiday) {
			const isOpen = !!holiday.is_open;

			if (!isOpen) {
				return json({
					date,
					slotMinutes,
					times: [],
					holidayLabel: holiday.holiday ?? null,
					holidayComment: holiday.comment ?? null,
					isOpenOverride: false
				});
			}

			if (holiday.start_time && holiday.end_time) {
				return handleWithWindow(holiday.start_time, holiday.end_time, {
					holidayLabel: holiday.holiday ?? null,
					holidayComment: holiday.comment ?? null,
					isOpenOverride: true
				});
			}
		}
	}

	const weekDay = jsWeekdayMonday1to7(date);
	const bizSql = `SELECT start_time, end_time, is_open FROM business_hours WHERE week_day = ? LIMIT 1`;
	const bRows = await q<any[]>(bizSql, [weekDay]);

	if (!bRows.length || !bRows[0].is_open) {
		return json({ date, slotMinutes, times: [], ...(specialMeta ?? {}) });
	}
	return handleWithWindow(bRows[0].start_time, bRows[0].end_time, specialMeta ?? {});
};
