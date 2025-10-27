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
	function fmt12(t: string | null | undefined) {
		if (!t) return '—';
		const [H, M] = t.split(':').map(Number);
		const h = ((H + 11) % 12) + 1; // 0→12, 13→1 ...
		const ampm = H >= 12 ? 'PM' : 'AM';
		return `${h}:${String(M).padStart(2, '0')} ${ampm}`;
	}

	const withSeconds = (t: string | null) => (t ? (t.length === 8 ? t : `${t}:00`) : null);
	const fmt = (t: string | null | undefined) => (t && t.length >= 4 ? t.slice(0, 5) : '—');

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

	// ----- Quick close (kept) -----
	async function closeDay(day: DayKey) {
		if (!confirm(`Close every ${DAY_NAMES[day]}?`)) return;
		const r = await fetch(`${API_BUSINESS}/${day}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ is_open: 0, start_time: null, end_time: null })
		});
		if (!r.ok) return alert(await r.text());
		rows[day] = { ...rows[day], is_open: false, start_time: '09:00', end_time: '17:00' };
	}

	// ===== Edit modal =====
	let showEdit = $state(false);
	let editingDay = $state<DayKey | null>(null);
	let draft = $state<BusinessHour | null>(null);

	function openEdit(day: DayKey) {
		editingDay = day;
		const src = rows[day];
		draft = {
			week_day: day,
			is_open: src.is_open,
			start_time: src.start_time ?? '09:00',
			end_time: src.end_time ?? '17:00'
		};
		showEdit = true;
	}

	function ensureDefaultsWhenOpening() {
		if (!draft) return;
		if (draft.is_open) {
			draft.start_time ??= '09:00';
			draft.end_time ??= '17:00';
		} else {
			// keep last set times but they won’t be sent
		}
	}

	async function saveEdit() {
		if (!draft || editingDay == null) return;

		if (draft.is_open) {
			if (!draft.start_time || !draft.end_time) return alert('Set both start and end times.');
			if (toMinutes(draft.start_time) >= toMinutes(draft.end_time))
				return alert('Start must be before end.');
		}

		const payload = {
			is_open: draft.is_open ? 1 : 0,
			start_time: draft.is_open ? withSeconds(draft.start_time) : null,
			end_time: draft.is_open ? withSeconds(draft.end_time) : null
		};

		const r = await fetch(`${API_BUSINESS}/${editingDay}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!r.ok) return alert(await r.text());

		// reflect changes locally
		rows[editingDay] = {
			week_day: editingDay,
			is_open: draft.is_open,
			start_time: draft.is_open ? (draft.start_time ?? '09:00') : '09:00',
			end_time: draft.is_open ? (draft.end_time ?? '17:00') : '17:00'
		};

		showEdit = false;
		editingDay = null;
		draft = null;
	}
</script>

<section class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">
			<a
				href="/manage"
				aria-label="Back to management"
				class="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-zinc-700 dark:hover:bg-zinc-800"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					class="h-5 w-5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</a>Business hours
		</h1>
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
					<th class="px-4 py-3"></th>
					<th class="px-4 py-3">Opening</th>
					<th class="px-4 py-3">Closing</th>
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
								<span>{fmt12(rows[day].start_time)}</span>
							{:else}
								<span class="text-gray-500">Closed</span>
							{/if}
						</td>
						<td class="px-4 py-3">
							{#if rows[day].is_open}
								<span>{fmt12(rows[day].end_time)}</span>
							{:else}
								<span class="text-gray-500">—</span>
							{/if}
						</td>

						<td class="px-4 py-3">
							<div class="flex gap-2">
								<button
									class="rounded bg-zinc-900 px-3 py-1.5 text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
									onclick={() => openEdit(day)}
								>
									Edit
								</button>

								{#if rows[day].is_open}
									<button
										class="rounded border px-3 py-1.5 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
										onclick={() => closeDay(day)}
									>
										Close
									</button>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<!-- Edit modal -->
{#if showEdit && draft && editingDay}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Edit business hours"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				showEdit = false;
				editingDay = null;
				draft = null;
			}
		}}
		tabindex="0"
	>
		<!-- backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-black/40"
			aria-label="Close modal"
			onclick={() => {
				showEdit = false;
				editingDay = null;
				draft = null;
			}}
		></button>

		<!-- panel -->
		<div
			class="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
		>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Edit — {DAY_NAMES[editingDay]}</h2>
				<button
					class="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => {
						showEdit = false;
						editingDay = null;
						draft = null;
					}}
				>
					Close
				</button>
			</div>

			<div class="grid gap-3">
				<label class="inline-flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						bind:checked={draft.is_open}
						oninput={() => ensureDefaultsWhenOpening()}
					/>
					<span>Open this day</span>
				</label>

				{#if draft.is_open}
					<div class="grid grid-cols-2 gap-3">
						<label class="text-sm"
							>Opening
							<input
								type="time"
								class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
								bind:value={draft.start_time}
							/>
						</label>
						<label class="text-sm"
							>Closing
							<input
								type="time"
								class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
								bind:value={draft.end_time}
							/>
						</label>
					</div>
				{/if}

				<div class="mt-1 flex justify-end gap-2">
					<button
						class="rounded border px-3 py-2 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
						onclick={() => {
							showEdit = false;
							editingDay = null;
							draft = null;
						}}
					>
						Cancel
					</button>
					<button
						class="rounded bg-zinc-900 px-3 py-2 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
						onclick={saveEdit}
					>
						Save changes
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
