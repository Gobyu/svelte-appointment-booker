import { json, error } from '@sveltejs/kit';
import { q } from '$lib/server/db';
import { addMinutesHHMM, isISODate, jsWeekdayMonday1to7, toHHMM } from '$lib/server/utils';

export const GET = async ({ url }) => {
	const date = url.searchParams.get('date') ?? '';
	const slotMinutes = Math.max(5, parseInt(url.searchParams.get('slotMinutes') ?? '30', 10) || 30);

	if (!isISODate(date)) throw error(400, 'date must be YYYY-MM-DD');

	// 1) holiday RANGE override first
	const holidaySql = `
    SELECT id, holiday, comment, is_open, start_time, end_time, start_date, end_date
    FROM holiday_hours
    WHERE start_date <= ?
      AND COALESCE(end_date, start_date) >= ?
    ORDER BY
      (COALESCE(end_date, start_date) = start_date) DESC,
      DATEDIFF(COALESCE(end_date, start_date), start_date) ASC,
      id ASC
    LIMIT 1
  `;
	const hRows = await q<any[]>(holidaySql, [date, date]);
	const useHoliday = hRows.length > 0;

	const handleWithWindow = async (
		start_time?: string | null,
		end_time?: string | null,
		meta: Record<string, any> = {}
	) => {
		if (!start_time || !end_time) return json({ date, slotMinutes, times: [], ...meta });

		let start = toHHMM(start_time);
		let end = toHHMM(end_time);

		// 2) build candidate slots
		const candidates: string[] = [];
		for (let t = start; addMinutesHHMM(t, slotMinutes) <= end; t = addMinutesHHMM(t, slotMinutes)) {
			candidates.push(t);
		}

		// 3) remove past times if today
		const now = new Date();
		const isToday = new Date(`${date}T00:00:00`).toDateString() === now.toDateString();
		const future = isToday
			? candidates.filter((t) => new Date(`${date}T${t}:00`) > now)
			: candidates;
		if (future.length === 0) return json({ date, slotMinutes, times: [], ...meta });

		// 4) remove conflicts
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

	if (useHoliday) {
		const h = hRows[0];
		if (h.is_open === 0) {
			return json({
				date,
				slotMinutes,
				times: [],
				holidayLabel: h.holiday ?? null,
				holidayComment: h.comment ?? null,
				isOpenOverride: false
			});
		}
		return handleWithWindow(h.start_time, h.end_time, {
			holidayLabel: h.holiday ?? null,
			holidayComment: h.comment ?? null,
			isOpenOverride: true
		});
	}

	// 2) fallback to weekly business_hours
	const weekDay = jsWeekdayMonday1to7(date);
	const bizSql = `SELECT start_time, end_time, is_open FROM business_hours WHERE week_day = ? LIMIT 1`;
	const bRows = await q<any[]>(bizSql, [weekDay]);
	if (!bRows.length || bRows[0].is_open === 0) return json({ date, slotMinutes, times: [] });
	return handleWithWindow(bRows[0].start_time, bRows[0].end_time);
};
