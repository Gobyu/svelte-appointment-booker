<script lang="ts">
	const API_HOLIDAYS = '/api/admin/holiday-hours';

	type HolidayRow = {
		id: number;
		holiday: string;
		comment: string | null;
		is_open: boolean;
		start_time: string | null;
		end_time: string | null;
		start_month: number;
		start_day: number;
		end_month: number;
		end_day: number;
	};
	function fmt12(t: string | null | undefined) {
		if (!t) return '—';
		const [H, M] = t.split(':').map(Number);
		const h = ((H + 11) % 12) + 1; // 0→12, 13→1 ...
		const ampm = H >= 12 ? 'PM' : 'AM';
		return `${h}:${String(M).padStart(2, '0')} ${ampm}`;
	}

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
	const pad2 = (n: number) => String(n).padStart(2, '0');
	const mdKey = (m: number, d: number) => m * 100 + d;
	const monthName = (m: number) =>
		new Date(`2000-${pad2(m)}-01T00:00:00`).toLocaleString(undefined, { month: 'long' });
	const fmtMMDD = (m: number, d: number) => `${pad2(m)} / ${pad2(d)}`;

	function validateMD(m: number, d: number) {
		return m >= 1 && m <= 12 && d >= 1 && d <= 31;
	}
	function validateTimes(open: boolean, s: string | null, e: string | null) {
		if (!open) return true;
		if (!s || !e) {
			alert('Set both start and end times.');
			return false;
		}
		if (s >= e) {
			alert('Start must be before end.');
			return false;
		}
		return true;
	}

	let loading = $state(false);
	let errorText = $state<string | null>(null);
	let holidays = $state<HolidayRow[]>([]);
	let from = $state(todayISO());
	let to = $state(addDays(todayISO(), 365));
	let showAddModal = $state(false);
	let grouped = $state<Record<number, HolidayRow[]>>({});

	async function load() {
		loading = true;
		errorText = null;
		try {
			const qs = new URLSearchParams({ from, to });
			const r = await fetch(`${API_HOLIDAYS}?${qs.toString()}`);
			if (!r.ok) throw new Error(await r.text());
			const data: HolidayRow[] = await r.json();
			holidays = data.map((h) => ({
				...h,
				comment: h.comment ?? null,
				start_time: h.start_time ? h.start_time.slice(0, 5) : null,
				end_time: h.end_time ? h.end_time.slice(0, 5) : null
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

	$effect(() => {
		const sorted = [...holidays].sort((a, b) => {
			const aKey = mdKey(a.start_month, a.start_day);
			const bKey = mdKey(b.start_month, b.start_day);
			return aKey - bKey || a.id - b.id;
		});
		const g: Record<number, HolidayRow[]> = {};
		for (const h of sorted) {
			(g[h.start_month] ??= []).push(h);
		}
		grouped = g;
	});

	let draft = $state<HolidayRow>({
		id: 0,
		holiday: '',
		comment: null,
		is_open: false,
		start_time: null,
		end_time: null,
		start_month: new Date().getMonth() + 1,
		start_day: new Date().getDate(),
		end_month: new Date().getMonth() + 1,
		end_day: new Date().getDate()
	});

	function validateRowLike(
		row: Pick<
			HolidayRow,
			| 'holiday'
			| 'is_open'
			| 'start_time'
			| 'end_time'
			| 'start_month'
			| 'start_day'
			| 'end_month'
			| 'end_day'
		>
	) {
		if (!row.holiday.trim()) {
			alert('Enter a label');
			return false;
		}
		if (!validateMD(row.start_month, row.start_day)) {
			alert('Invalid start month/day');
			return false;
		}
		if (!validateMD(row.end_month, row.end_day)) {
			alert('Invalid end month/day');
			return false;
		}
		if (!validateTimes(row.is_open, row.start_time, row.end_time)) return false;
		return true;
	}

	// ---- ADD ----
	async function addOverride() {
		if (!draft.end_month || !draft.end_day) {
			draft.end_month = draft.start_month;
			draft.end_day = draft.start_day;
		}
		if (!validateRowLike(draft)) return;

		const payload = {
			holiday: draft.holiday.trim(),
			comment: draft.comment?.trim() || null,
			is_open: draft.is_open,
			start_time: draft.is_open ? withSeconds(draft.start_time) : null,
			end_time: draft.is_open ? withSeconds(draft.end_time) : null,
			start_month: draft.start_month,
			start_day: draft.start_day,
			end_month: draft.end_month,
			end_day: draft.end_day
		};
		const r = await fetch(API_HOLIDAYS, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!r.ok) return alert(await r.text());

		draft = {
			id: 0,
			holiday: '',
			comment: null,
			is_open: false,
			start_time: null,
			end_time: null,
			start_month: new Date().getMonth() + 1,
			start_day: new Date().getDate(),
			end_month: new Date().getMonth() + 1,
			end_day: new Date().getDate()
		};
		showAddModal = false;
		await load();
	}

	// ---- DELETE ----
	async function deleteRow(idx: number, m: number) {
		const h = grouped[m][idx];
		if (!confirm(`Delete override for ${h.holiday}?`)) return;
		const r = await fetch(`${API_HOLIDAYS}/${h.id}`, { method: 'DELETE' });
		if (!r.ok) return alert(await r.text());
		await load();
	}

	// ---- EDIT (modal) ----
	let showEditModal = $state(false);
	let edit = $state<(HolidayRow & { _m: number; _idx: number }) | null>(null);

	function openEdit(idx: number, m: number) {
		const h = grouped[m][idx];
		edit = { ...h, _m: m, _idx: idx };
		showEditModal = true;
	}

	async function saveEdit() {
		if (!edit) return;

		// Fill missing end_* with start_* if needed
		if (!edit.end_month || !edit.end_day) {
			edit.end_month = edit.start_month;
			edit.end_day = edit.start_day;
		}
		if (!validateRowLike(edit)) return;

		const payload = {
			holiday: edit.holiday.trim(),
			comment: edit.comment?.trim() || null,
			is_open: edit.is_open,
			start_time: edit.is_open ? withSeconds(edit.start_time) : null,
			end_time: edit.is_open ? withSeconds(edit.end_time) : null,
			start_month: edit.start_month,
			start_day: edit.start_day,
			end_month: edit.end_month,
			end_day: edit.end_day
		};

		const r = await fetch(`${API_HOLIDAYS}/${edit.id}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!r.ok) return alert(await r.text());

		showEditModal = false;
		edit = null;
		await load();
	}
</script>

<section class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
		<div>
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
				</a>Holiday hours
			</h1>
			<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
				Closed days or custom open hours (repeats every year).
			</p>
		</div>

		<div class="flex items-center gap-2">
			<label class="text-sm text-gray-600 dark:text-gray-300"
				>From
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
			<label class="text-sm text-gray-600 dark:text-gray-300"
				>To
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

	<div
		class="rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
	>
		{#if loading}
			<p class="text-gray-600 dark:text-gray-300">Loading…</p>
		{:else if holidays.length === 0}
			<p class="text-gray-600 dark:text-gray-300">No overrides.</p>
		{:else}
			<div class="space-y-8">
				{#each Object.keys(grouped)
					.map(Number)
					.sort((a, b) => a - b) as m}
					<div>
						<h2 class="mb-3 text-[2rem] font-semibold text-gray-900 dark:text-gray-100">
							{monthName(m)}
						</h2>

						<div class="space-y-3">
							{#each grouped[m] as h, idx}
								<div class="rounded-xl border border-gray-200 p-4 dark:border-zinc-700">
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div>
											<div class="text-[1.5rem] font-semibold">{h.holiday}</div>
											<div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
												<span class="dark:border-zinc-700">
													{#if h.start_month == h.end_month && h.start_day == h.end_day}
														{fmtMMDD(h.start_month, h.start_day)}
													{:else}
														{fmtMMDD(h.start_month, h.start_day)} - {fmtMMDD(
															h.end_month,
															h.end_day
														)}
													{/if}
												</span>
												<span class="dark:border-zinc-700">
													{#if h.is_open}
														{fmt12(h.start_time)} – {fmt12(h.end_time)}
													{:else}
														Closed
													{/if}
												</span>
											</div>
										</div>

										<div class="flex gap-2">
											<button
												class="rounded bg-zinc-900 px-3 py-1.5 text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
												onclick={() => openEdit(idx, m)}
											>
												Edit
											</button>
											<button
												class="rounded border px-3 py-1.5 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
												onclick={() => deleteRow(idx, m)}
											>
												Delete
											</button>
										</div>
									</div>

									{#if h.comment}
										<p class="mt-3 text-sm text-gray-700 dark:text-gray-300">{h.comment}</p>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

{#if showAddModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Add holiday override"
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
				<h2 class="text-lg font-semibold">Add override</h2>
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
						value={draft.holiday}
						oninput={(e) => {
							draft.holiday = (e.currentTarget as HTMLInputElement).value;
						}}
						placeholder="Holiday name"
					/>
				</label>

				<div class="grid grid-cols-2 gap-3">
					<label class="text-sm"
						>Start month
						<select
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={draft.start_month}
							oninput={(e) => {
								draft.start_month = Number((e.currentTarget as HTMLSelectElement).value);
							}}
						>
							{#each Array.from({ length: 12 }, (_, i) => i + 1) as mOpt}
								<option value={mOpt}>{monthName(mOpt)}</option>
							{/each}
						</select>
					</label>
					<label class="text-sm"
						>Start day
						<input
							type="number"
							min="1"
							max="31"
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={draft.start_day}
							oninput={(e) => {
								draft.start_day = Number((e.currentTarget as HTMLInputElement).value);
							}}
						/>
					</label>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<label class="text-sm"
						>End month (optional)
						<select
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={draft.end_month}
							oninput={(e) => {
								draft.end_month = Number((e.currentTarget as HTMLSelectElement).value);
							}}
						>
							{#each Array.from({ length: 12 }, (_, i) => i + 1) as mOpt}
								<option value={mOpt}>{monthName(mOpt)}</option>
							{/each}
						</select>
					</label>
					<label class="text-sm"
						>End day (optional)
						<input
							type="number"
							min="1"
							max="31"
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={draft.end_day}
							oninput={(e) => {
								draft.end_day = Number((e.currentTarget as HTMLInputElement).value);
							}}
						/>
					</label>
				</div>

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
					<span>Open these day(s) (custom hours)</span>
				</label>

				{#if draft.is_open}
					<div class="grid grid-cols-2 gap-3">
						<label class="text-sm"
							>Opening time
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
							>Closing time
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
						onclick={addOverride}
					>
						Add override
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Override MODAL -->
{#if showEditModal && edit}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Edit holiday override"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				showEditModal = false;
				edit = null;
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
				showEditModal = false;
				edit = null;
			}}
		></button>

		<!-- panel -->
		<div
			class="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
		>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Edit override</h2>
				<button
					class="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => {
						showEditModal = false;
						edit = null;
					}}
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
						bind:value={edit.holiday}
						placeholder="Holiday name"
					/>
				</label>

				<div class="grid grid-cols-2 gap-3">
					<label class="text-sm"
						>Start month
						<select
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							bind:value={edit.start_month}
						>
							{#each Array.from({ length: 12 }, (_, i) => i + 1) as mOpt}
								<option value={mOpt}>{monthName(mOpt)}</option>
							{/each}
						</select>
					</label>
					<label class="text-sm"
						>Start day
						<input
							type="number"
							min="1"
							max="31"
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							bind:value={edit.start_day}
						/>
					</label>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<label class="text-sm"
						>End month
						<select
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							bind:value={edit.end_month}
						>
							{#each Array.from({ length: 12 }, (_, i) => i + 1) as mOpt}
								<option value={mOpt}>{monthName(mOpt)}</option>
							{/each}
						</select>
					</label>
					<label class="text-sm"
						>End day
						<input
							type="number"
							min="1"
							max="31"
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							bind:value={edit.end_day}
						/>
					</label>
				</div>

				<label class="text-sm"
					>Comment (optional)
					<textarea
						rows="3"
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						bind:value={edit.comment}
					></textarea>
				</label>

				<label class="inline-flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						bind:checked={edit.is_open}
						oninput={(e) => {
							const c = (e.currentTarget as HTMLInputElement).checked;
							if (c) {
								edit!.start_time ??= '09:00';
								edit!.end_time ??= '17:00';
							} else {
								edit!.start_time = null;
								edit!.end_time = null;
							}
						}}
					/>
					<span>Open these day(s) (custom hours)</span>
				</label>

				{#if edit.is_open}
					<div class="grid grid-cols-2 gap-3">
						<label class="text-sm"
							>Opening time
							<input
								type="time"
								class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
								bind:value={edit.start_time}
							/>
						</label>
						<label class="text-sm"
							>Closing time
							<input
								type="time"
								class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
								bind:value={edit.end_time}
							/>
						</label>
					</div>
				{/if}

				<div class="mt-1 flex justify-end gap-2">
					<button
						class="rounded border px-3 py-2 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
						onclick={() => {
							showEditModal = false;
							edit = null;
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
