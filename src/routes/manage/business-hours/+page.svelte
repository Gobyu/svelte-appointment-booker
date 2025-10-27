<script lang="ts">
	// Adjust if your endpoints differ
	const API_BUSINESS = '/api/admin/business-hours';

	type DayKey = 1 | 2 | 3 | 4 | 5 | 6 | 7;
	type BusinessHour = {
		week_day: DayKey; // 1=Mon … 7=Sun
		start_time: string | null; // "HH:MM"
		end_time: string | null; // "HH:MM"
		is_open: boolean;
	};

	const DAY_NAMES: Record<DayKey, string> = {
		1: 'Monday',
		2: 'Tuesday',
		3: 'Wednesday',
		4: 'Thursday',
		5: 'Friday',
		6: 'Saturday',
		7: 'Sunday'
	};

	// local state: full 1..7 map
	let loading = $state(false);
	let errorText = $state<string | null>(null);
	let rows = $state<Record<DayKey, BusinessHour>>({
		1: { week_day: 1, start_time: '09:00', end_time: '17:00', is_open: false },
		2: { week_day: 2, start_time: '09:00', end_time: '17:00', is_open: false },
		3: { week_day: 3, start_time: '09:00', end_time: '17:00', is_open: false },
		4: { week_day: 4, start_time: '09:00', end_time: '17:00', is_open: false },
		5: { week_day: 5, start_time: '09:00', end_time: '17:00', is_open: false },
		6: { week_day: 6, start_time: '09:00', end_time: '17:00', is_open: false },
		7: { week_day: 7, start_time: '09:00', end_time: '17:00', is_open: false }
	});

	function toMinutes(hhmm: string) {
		const [h, m] = hhmm.split(':').map(Number);
		return h * 60 + m;
	}
	const withSeconds = (t: string | null) => (t ? (t.length === 8 ? t : `${t}:00`) : null);

	async function fetchHours() {
		loading = true;
		errorText = null;
		try {
			const r = await fetch(API_BUSINESS);
			if (!r.ok) throw new Error(await r.text());
			const data: Array<{
				week_day: DayKey;
				start_time: string | null;
				end_time: string | null;
				is_open: 0 | 1 | boolean;
			}> = await r.json();

			// reset defaults then apply from API
			const next = { ...rows };
			(Object.keys(next) as unknown as DayKey[]).forEach((d) => {
				next[d] = { week_day: d, start_time: '09:00', end_time: '17:00', is_open: false };
			});
			data.forEach((row) => {
				next[row.week_day] = {
					week_day: row.week_day,
					start_time: row.start_time ? row.start_time.slice(0, 5) : '09:00',
					end_time: row.end_time ? row.end_time.slice(0, 5) : '17:00',
					is_open: !!row.is_open
				};
			});
			rows = next;
		} catch (e: any) {
			errorText = e?.message ?? 'Failed to load';
		} finally {
			loading = false;
		}
	}
	$effect(() => {
		void fetchHours();
	});

	async function saveDay(day: DayKey) {
		const row = rows[day];
		if (row.is_open) {
			if (!row.start_time || !row.end_time) return alert('Set both start and end.');
			if (toMinutes(row.start_time) >= toMinutes(row.end_time))
				return alert('Start must be before end.');
		}
		const payload = {
			is_open: row.is_open ? 1 : 0,
			start_time: row.is_open ? withSeconds(row.start_time) : null,
			end_time: row.is_open ? withSeconds(row.end_time) : null
		};
		const r = await fetch(`${API_BUSINESS}/${day}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!r.ok) return alert(await r.text());
		alert(`${DAY_NAMES[day]} saved`);
	}

	async function closeDay(day: DayKey) {
		if (!confirm(`Close every ${DAY_NAMES[day]}?`)) return;
		const r = await fetch(`${API_BUSINESS}/${day}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ is_open: 0, start_time: null, end_time: null })
		});
		if (!r.ok) return alert(await r.text());
		rows[day].is_open = false;
	}
</script>

<section class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6">
		<a
			href="/manage"
			aria-label="Back to management"
			class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-zinc-700 dark:hover:bg-zinc-800"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				class="h-5 w-5"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>

		<h1 class="text-3xl font-bold">Business hours</h1>
		<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
			Toggle a weekday open/closed and set default hours.
		</p>
	</div>

	{#if errorText}
		<div
			class="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
		>
			{errorText}
		</div>
	{/if}

	<div
		class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow dark:border-zinc-700 dark:bg-zinc-900"
	>
		<table class="w-full text-sm">
			<thead>
				<tr class="text-left text-gray-600 dark:text-gray-300">
					<th class="px-4 py-3">Weekday</th>
					<th class="px-4 py-3">Start</th>
					<th class="px-4 py-3">End</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody>
				{#each [1, 2, 3, 4, 5, 6, 7] as d}
					{@const day = d as 1 | 2 | 3 | 4 | 5 | 6 | 7}
					<tr class="border-t border-gray-200 dark:border-zinc-700">
						<td class="px-4 py-3 font-medium">{DAY_NAMES[day]}</td>
						<td class="px-4 py-3">
							{#if rows[day].is_open}
								<input
									type="time"
									class="w-[8.5rem] rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
									value={rows[day].start_time ?? ''}
									oninput={(e) => {
										rows[day].start_time = (e.currentTarget as HTMLInputElement).value;
									}}
								/>
							{:else}
								<span class="text-gray-500">Closed</span>
							{/if}
						</td>
						<td class="px-4 py-3">
							{#if rows[day].is_open}
								<input
									type="time"
									class="w-[8.5rem] rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
									value={rows[day].end_time ?? ''}
									oninput={(e) => {
										rows[day].end_time = (e.currentTarget as HTMLInputElement).value;
									}}
								/>
							{:else}
								<span class="text-gray-500"></span>
							{/if}
						</td>
						<td class="px-4 py-3">
							{#if rows[day].is_open}
								<div class="flex gap-2">
									<button
										class="rounded bg-zinc-900 px-3 py-1.5 text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
										onclick={() => saveDay(day)}>Save</button
									>
									<button
										class="rounded border px-3 py-1.5 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
										onclick={() => closeDay(day)}>Close</button
									>
								</div>
							{:else}
								<button
									class="rounded border px-3 py-1.5 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
									onclick={() => {
										rows[day].is_open = true;
										rows[day].start_time ??= '09:00';
										rows[day].end_time ??= '17:00';
										void saveDay(day);
									}}
								>
									Open & Save
								</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
