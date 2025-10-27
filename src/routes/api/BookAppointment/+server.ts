import { json, error } from '@sveltejs/kit';
import { q } from '$lib/server/db';
import { normalizeNANPTo10, isISODate } from '$lib/server/utils';

export const POST = async ({ request }) => {
	const { name, phoneNumber, email, date, time, duration, type, comments } = await request
		.json()
		.catch(() => ({}));

	if (!name || !date || !time || !duration || !type)
		throw error(400, { message: 'Missing required fields' });

	const dur = Number(duration);
	if (!Number.isInteger(dur) || ![30, 60].includes(dur))
		throw error(400, { message: 'Duration must be 30 or 60 minutes' });

	const phone10 = phoneNumber != null && phoneNumber !== '' ? normalizeNANPTo10(phoneNumber) : null;
	if (phoneNumber && !phone10) throw error(400, { message: 'Invalid phone number' });

	const startHHMM = String(time).slice(0, 5);
	if (!/^\d{2}:\d{2}$/.test(startHHMM) || !isISODate(date))
		throw error(400, { message: 'Invalid date/time' });

	const selectedDateTime = new Date(`${date}T${startHHMM}`);
	if (selectedDateTime < new Date())
		throw error(400, { message: 'Appointment cannot be in the past' });

	const conflictSql = `
    SELECT id FROM appointments
    WHERE date = ?
      AND TIME(?) < ADDTIME(time, SEC_TO_TIME(duration*60))
      AND ADDTIME(TIME(?), SEC_TO_TIME(?*60)) > time
    LIMIT 1
  `;
	const cRows = await q<any[]>(conflictSql, [date, startHHMM, startHHMM, dur]);
	if (cRows.length > 0) throw error(409, { message: 'Time conflict with another appointment' });

	const insertSql = `
    INSERT INTO appointments
      (name, phoneNumber, email, date, time, duration, type, comments, active, paid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
  `;
	await q(insertSql, [
		name,
		phone10,
		email ?? null,
		date,
		`${startHHMM}:00`,
		dur,
		type,
		comments ?? null
	]);
	return json({ message: 'Appointment saved successfully' });
};
