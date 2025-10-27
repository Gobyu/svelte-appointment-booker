export function onlyDigits(s: any) {
	return String(s ?? '').replace(/\D/g, '');
}
export function normalizeNANPTo10(raw: any) {
	const d = onlyDigits(raw ?? '');
	if (d.length === 10) return d;
	if (d.length === 11 && d.startsWith('1')) return d.slice(1);
	return null;
}
export function isISODate(s: any) {
	return /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? ''));
}
export function normalizeTimeHHMMSS(t: any) {
	if (!t) return null;
	const s = String(t);
	if (!/^\d{2}:\d{2}(:\d{2})?$/.test(s)) return null;
	return s.length === 5 ? `${s}:00` : s;
}
export function isValidWeekday(n: any) {
	return Number.isInteger(n) && n >= 1 && n <= 7;
}
export function toHHMM(timeStr: any) {
	return String(timeStr ?? '').slice(0, 5);
}
export function addMinutesHHMM(hhmm: string, mins: number) {
	const [H, M] = hhmm.split(':').map(Number);
	const total = H * 60 + M + mins;
	const h = Math.floor(total / 60);
	const m = total % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
// JS: Sun=0..Sat=6 -> Mon=1..Sun=7
export function jsWeekdayMonday1to7(dateISO: string) {
	const d = new Date(`${dateISO}T00:00:00`);
	const n = d.getDay();
	return n === 0 ? 7 : n;
}
