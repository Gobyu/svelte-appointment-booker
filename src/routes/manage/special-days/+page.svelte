<script lang="ts">
	const API_SPECIAL = '/api/admin/special-days';

	type SpecialRow = {
		id: number;
		start_date: string; // YYYY-MM-DD
		end_date: string | null; // YYYY-MM-DD | null
		label: string;
		comment: string | null;
		is_open: boolean; // true = open with custom hours; false = closed all day
		start_time: string | null; // timestamp from API; we display HH:MM
		end_time: string | null; // timestamp from API; we display HH:MM
	};

	// --- Helpers ---
	function todayISO() {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}
	function addDays(iso: string, n: number) {
		const d = new Date(iso);
		d.setDate(d.getDate() + n);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}
	const withSeconds = (t: string | null) => (t ? (t.length === 8 ? t : `${t}:00`) : null);

	function toTimestamp(dateISO: string | null, timeHHMM: string | null): string | null {
		if (!dateISO || !timeHHMM) return null;
		return `${dateISO} ${withSeconds(timeHHMM)}`; // 'YYYY-MM-DD HH:MM:SS'
	}

	function parseTimePart(ts: string | null): string | null {
		if (!ts) return null;
		// Accept 'YYYY-MM-DD HH:MM[:SS]' or 'YYYY-MM-DDTHH:MM[:SS]' or just 'HH:MM[:SS]'
		const raw = ts.includes(' ') ? ts.split(' ')[1] : ts.includes('T') ? ts.split('T')[1] : ts;
		return raw.slice(0, 5);
	}

	function monthKey(isoDate: string) {
		return isoDate.slice(0, 7); // YYYY-MM
	}
	function formatMonthHeader(key: string) {
		const d = new Date(`${key}-01T00:00:00`);
		return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
	}

	function validateWindow(s: string, e: string | null) {
		if (e && e < s) {
			alert('End date must be on/after start date.');
			return false;
		}
		return true;
	}
	function validateTimes(
		open: boolean,
		s: string | null,
		e: string | null,
		sd: string,
		ed: string | null
	) {
		if (!open) return true;
		if (!s || !e) {
			alert('Set both start and end times.');
			return false;
		}
		// If single-day special, enforce start < end; for multi-day, allow any times
		if ((ed ?? sd) === sd && s >= e) {
			alert('Start must be before end for single-day entries.');
			return false;
		}
		return true;
	}

	// --- State ---
	let loading = $state(false);
	let errorText = $state<string | null>(null);
	let days = $state<SpecialRow[]>([]);
	let from = $state(todayISO());
	let to = $state(addDays(todayISO(), 365));

	// modal state
	let showAddModal = $state(false);

	// grouped months (YYYY-MM => SpecialRow[])
	let grouped = $state<Record<string, SpecialRow[]>>({});

	async function load() {
		loading = true;
		errorText = null;
		try {
			const qs = new URLSearchParams({ from, to });
			const r = await fetch(`${API_SPECIAL}?${qs.toString()}`);
			if (!r.ok) throw new Error(await r.text());
			const data: SpecialRow[] = await r.json();
			days = data.map((d) => ({
				...d,
				comment: d.comment ?? null,
				// display-only time parts for the UI
				start_time: parseTimePart(d.start_time),
				end_time: parseTimePart(d.end_time)
			}));
		} catch (e: any) {
			errorText = e?.message ?? 'Failed to load';
		} finally {
			loading = false;
		}
	}
	$effect(() => {
		void load();
	});

	// re-group whenever days changes
	$effect(() => {
		const sorted = [...days].sort((a, b) =>
			a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : a.id - b.id
		);
		const g: Record<string, SpecialRow[]> = {};
		for (const d of sorted) {
			const key = monthKey(d.start_date);
			(g[key] ??= []).push(d);
		}
		grouped = g;
	});

	// draft row for modal
	let draft = $state<SpecialRow>({
		id: 0,
		start_date: todayISO(),
		end_date: null,
		label: '',
		comment: null,
		is_open: false,
		start_time: null,
		end_time: null
	});

	async function addRow() {
		if (!draft.start_date) return alert('Select start date');
		if (!draft.label.trim()) return alert('Enter a label');
		if (!validateWindow(draft.start_date, draft.end_date)) return;
		if (
			!validateTimes(
				draft.is_open,
				draft.start_time,
				draft.end_time,
				draft.start_date,
				draft.end_date
			)
		)
			return;

		const payload = {
			start_date: draft.start_date,
			end_date: draft.end_date,
			label: draft.label.trim(),
			comment: draft.comment?.trim() || null,
			is_open: draft.is_open,
			start_time: draft.is_open ? toTimestamp(draft.start_date, draft.start_time) : null,
			end_time: draft.is_open
				? toTimestamp(draft.end_date ?? draft.start_date, draft.end_time)
				: null
		};

		const r = await fetch(API_SPECIAL, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!r.ok) return alert(await r.text());

		// reset & close
		draft = {
			id: 0,
			start_date: todayISO(),
			end_date: null,
			label: '',
			comment: null,
			is_open: false,
			start_time: null,
			end_time: null
		};
		showAddModal = false;
		await load();
	}

	async function saveRow(idx: number, mkey: string) {
		const d = grouped[mkey][idx];
		if (!d.label.trim()) return alert('Enter a label');
		if (!validateWindow(d.start_date, d.end_date)) return;
		if (!validateTimes(d.is_open, d.start_time, d.end_time, d.start_date, d.end_date)) return;

		const payload = {
			start_date: d.start_date,
			end_date: d.end_date,
			label: d.label.trim(),
			comment: d.comment?.trim() || null,
			is_open: d.is_open,
			start_time: d.is_open ? toTimestamp(d.start_date, d.start_time) : null,
			end_time: d.is_open ? toTimestamp(d.end_date ?? d.start_date, d.end_time) : null
		};

		const r = await fetch(`${API_SPECIAL}/${d.id}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!r.ok) return alert(await r.text());
		await load();
	}

	async function deleteRow(idx: number, mkey: string) {
		const d = grouped[mkey][idx];
		if (!confirm(`Delete special day: ${d.label}?`)) return;
		const r = await fetch(`${API_SPECIAL}/${d.id}`, { method: 'DELETE' });
		if (!r.ok) return alert(await r.text());
		await load();
	}
</script>

<section class="mx-auto max-w-6xl px-4 py-8">
	<!-- Top bar: title, filters, Add button -->
	<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-3xl font-bold">
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
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</a>Special days
			</h1>
			<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
				One-off closures or modified hours (specific dates with year).
			</p>
		</div>

		<div class="flex items-center gap-2">
			<label class="text-sm text-gray-600 dark:text-gray-300">
				From
				<input
					type="date"
					class="ml-2 rounded border border-gray-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
					value={from}
					oninput={(e) => {
						from = (e.currentTarget as HTMLInputElement).value;
						void load();
					}}
				/>
			</label>
			<label class="text-sm text-gray-600 dark:text-gray-300">
				To
				<input
					type="date"
					class="ml-2 rounded border border-gray-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
					value={to}
					oninput={(e) => {
						to = (e.currentTarget as HTMLInputElement).value;
						void load();
					}}
				/>
			</label>
			<button
				class="rounded border px-3 py-1.5 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
				onclick={load}
			>
				Refresh
			</button>

			<button
				class="rounded bg-zinc-900 px-3 py-2 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
				onclick={() => (showAddModal = true)}
			>
				Add
			</button>
		</div>
	</div>

	{#if errorText}
		<div
			class="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
		>
			{errorText}
		</div>
	{/if}

	<!-- Existing special days (grouped by month) -->
	<div
		class="rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
	>
		<h2 class="mb-3 text-lg font-semibold">Existing entries</h2>

		{#if loading}
			<p class="text-gray-600 dark:text-gray-300">Loading…</p>
		{:else if days.length === 0}
			<p class="text-gray-600 dark:text-gray-300">No entries in range.</p>
		{:else}
			<div class="space-y-8">
				{#each Object.keys(grouped) as mkey}
					<div>
						<h3 class="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
							{formatMonthHeader(mkey)}
						</h3>
						<div class="space-y-3">
							{#each grouped[mkey] as d, idx}
								<div class="rounded-xl border border-gray-200 p-3 dark:border-zinc-700">
									<label class="block text-sm">
										<span class="sr-only">Label</span>
										<input
											type="text"
											class="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
											value={d.label}
											oninput={(e) => {
												d.label = (e.currentTarget as HTMLInputElement).value;
											}}
											placeholder="Label"
										/>
									</label>

									<div class="grid items-start gap-3 md:grid-cols-[1fr_auto]">
										<div class="grid gap-3 sm:grid-cols-2">
											<label class="text-sm"
												>Start date
												<input
													type="date"
													class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
													value={d.start_date}
													oninput={(e) => {
														d.start_date = (e.currentTarget as HTMLInputElement).value;
													}}
												/>
											</label>
											<label class="text-sm"
												>End date (optional)
												<input
													type="date"
													class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
													value={d.end_date ?? ''}
													oninput={(e) => {
														const v = (e.currentTarget as HTMLInputElement).value;
														d.end_date = v || null;
													}}
												/>
											</label>

											<label class="text-sm"
												>Comment
												<textarea
													rows="2"
													class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
													oninput={(e) => {
														d.comment = (e.currentTarget as HTMLTextAreaElement).value || null;
													}}>{d.comment ?? ''}</textarea
												>
											</label>

											<label class="col-span-2 inline-flex items-center gap-2 text-sm">
												<input
													type="checkbox"
													checked={d.is_open}
													oninput={(e) => {
														const c = (e.currentTarget as HTMLInputElement).checked;
														d.is_open = c;
														if (c) {
															d.start_time ??= '09:00';
															d.end_time ??= '17:00';
														} else {
															d.start_time = null;
															d.end_time = null;
														}
													}}
												/>
												<span>Open during these times</span>
											</label>

											{#if d.is_open}
												<div class="col-span-2 grid grid-cols-2 gap-3">
													<label class="text-sm"
														>Start time
														<input
															type="time"
															class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
															value={d.start_time ?? ''}
															oninput={(e) => {
																d.start_time = (e.currentTarget as HTMLInputElement).value;
															}}
														/>
													</label>
													<label class="text-sm"
														>End time
														<input
															type="time"
															class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
															value={d.end_time ?? ''}
															oninput={(e) => {
																d.end_time = (e.currentTarget as HTMLInputElement).value;
															}}
														/>
													</label>
												</div>
											{/if}
										</div>

										<div class="flex justify-end gap-2">
											<button
												class="rounded bg-zinc-900 px-3 py-1.5 text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
												onclick={() => saveRow(idx, mkey)}
											>
												Save
											</button>
											<button
												class="rounded border px-3 py-1.5 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
												onclick={() => deleteRow(idx, mkey)}
											>
												Delete
											</button>
										</div>
									</div>

									<p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
										Range: {d.start_date} – {d.end_date ?? d.start_date}
										<span class="ml-2">
											{d.is_open
												? `(Open ${d.start_time ?? '??'}–${d.end_time ?? '??'})`
												: '(Closed all day)'}
										</span>
									</p>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- Add Special Day MODAL -->
{#if showAddModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Add special day"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				showAddModal = false;
			}
		}}
		tabindex="0"
	>
		<!-- backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-black/40"
			aria-label="Close modal"
			onclick={() => (showAddModal = false)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					showAddModal = false;
				}
			}}
		></button>

		<!-- panel -->
		<div
			class="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
		>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Add special day</h2>
				<button
					class="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => (showAddModal = false)}
				>
					Close
				</button>
			</div>

			<div class="grid gap-3">
				<label class="text-sm"
					>Label
					<input
						type="text"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-base font-semibold dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						value={draft.label}
						oninput={(e) => {
							draft.label = (e.currentTarget as HTMLInputElement).value;
						}}
						placeholder="Label"
					/>
				</label>

				<label class="text-sm"
					>Start date
					<input
						type="date"
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						value={draft.start_date}
						oninput={(e) => {
							draft.start_date = (e.currentTarget as HTMLInputElement).value;
						}}
					/>
				</label>

				<label class="text-sm"
					>End date (optional)
					<input
						type="date"
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						value={draft.end_date ?? ''}
						oninput={(e) => {
							const v = (e.currentTarget as HTMLInputElement).value;
							draft.end_date = v || null;
						}}
					/>
				</label>

				<label class="text-sm"
					>Comment (optional)
					<textarea
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						rows="3"
						oninput={(e) => {
							draft.comment = (e.currentTarget as HTMLTextAreaElement).value || null;
						}}>{draft.comment ?? ''}</textarea
					>
				</label>

				<label class="inline-flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={draft.is_open}
						oninput={(e) => {
							const c = (e.currentTarget as HTMLInputElement).checked;
							draft.is_open = c;
							if (c) {
								draft.start_time ??= '09:00';
								draft.end_time ??= '17:00';
							} else {
								draft.start_time = null;
								draft.end_time = null;
							}
						}}
					/>
					<span>Open during these times</span>
				</label>

				{#if draft.is_open}
					<div class="grid grid-cols-2 gap-3">
						<label class="text-sm"
							>Start time
							<input
								type="time"
								class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
								value={draft.start_time ?? ''}
								oninput={(e) => {
									draft.start_time = (e.currentTarget as HTMLInputElement).value;
								}}
							/>
						</label>
						<label class="text-sm"
							>End time
							<input
								type="time"
								class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
								value={draft.end_time ?? ''}
								oninput={(e) => {
									draft.end_time = (e.currentTarget as HTMLInputElement).value;
								}}
							/>
						</label>
					</div>
				{/if}

				<div class="mt-1 flex justify-end gap-2">
					<button
						class="rounded border px-3 py-2 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
						onclick={() => (showAddModal = false)}
					>
						Cancel
					</button>
					<button
						class="rounded bg-zinc-900 px-3 py-2 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
						onclick={addRow}
					>
						Add special day
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
