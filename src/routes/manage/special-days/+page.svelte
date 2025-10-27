<script lang="ts">
	const SPECIAL_DAYS_API = '/api/admin/special-days';

	type SpecialDay = {
		id: number;
		start_date: string;
		end_date: string | null;
		label: string;
		comment: string | null;
		is_open: boolean;
		start_time: string | null;
		end_time: string | null;
	};

	function getTodayISO() {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
			now.getDate()
		).padStart(2, '0')}`;
	}

	function addDays(isoDate: string, daysToAdd: number) {
		const baseDate = new Date(isoDate);
		baseDate.setDate(baseDate.getDate() + daysToAdd);
		return `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(
			2,
			'0'
		)}-${String(baseDate.getDate()).padStart(2, '0')}`;
	}

	const withSeconds = (time: string | null) =>
		time ? (time.length === 8 ? time : `${time}:00`) : null;

	function toTimestamp(dateISO: string | null, timeHHMM: string | null): string | null {
		if (!dateISO || !timeHHMM) return null;
		return `${dateISO} ${withSeconds(timeHHMM)}`;
	}

	function extractTimeHHMM(timestamp: string | null): string | null {
		if (!timestamp) return null;
		const timePart = timestamp.includes(' ')
			? timestamp.split(' ')[1]
			: timestamp.includes('T')
				? timestamp.split('T')[1]
				: timestamp;
		return timePart.slice(0, 5);
	}

	function formatMMDD(iso: string | null | undefined) {
		if (!iso) return '—';
		const [year, month, day] = iso.split('-');
		return `${month} / ${day}`;
	}

	function format12Hour(time: string | null | undefined) {
		if (!time) return '—';
		const [hours24, minutes] = time.split(':').map(Number);
		const hours12 = ((hours24 + 11) % 12) + 1;
		const ampm = hours24 >= 12 ? 'PM' : 'AM';
		return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
	}

	function getMonthKey(isoDate: string) {
		return isoDate.slice(0, 7);
	}

	function formatMonthHeader(key: string) {
		const monthAnchorDate = new Date(`${key}-01T00:00:00`);
		return monthAnchorDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });
	}

	function validateDateRange(startISO: string, endISO: string | null) {
		if (endISO && endISO < startISO) {
			alert('End date must be on/after start date.');
			return false;
		}
		return true;
	}

	function validateOpenTimes(
		isOpen: boolean,
		startTime: string | null,
		endTime: string | null,
		startDateISO: string,
		endDateISO: string | null
	) {
		if (!isOpen) return true;
		if (!startTime || !endTime) {
			alert('Set both start and end times.');
			return false;
		}
		if ((endDateISO ?? startDateISO) === startDateISO && startTime >= endTime) {
			alert('Start must be before end for single-day entries.');
			return false;
		}
		return true;
	}

	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null);

	let dateFrom = $state(getTodayISO());
	let dateTo = $state(addDays(getTodayISO(), 365));

	async function fetchSpecialDays() {
		isLoading = true;
		errorMessage = null;
		try {
			const params = new URLSearchParams({ from: dateFrom, to: dateTo });
			const response = await fetch(`${SPECIAL_DAYS_API}?${params.toString()}`);
			if (!response.ok) throw new Error(await response.text());
			const rows: SpecialDay[] = await response.json();
			specialDays = rows.map((row) => ({
				...row,
				comment: row.comment ?? null,
				start_time: extractTimeHHMM(row.start_time),
				end_time: extractTimeHHMM(row.end_time)
			}));
		} catch (e: any) {
			errorMessage = e?.message ?? 'Failed to load';
		} finally {
			isLoading = false;
		}
	}

	let specialDays = $state<SpecialDay[]>([]);
	let daysByMonth = $state<Record<string, SpecialDay[]>>({});

	$effect(() => {
		void fetchSpecialDays();
	});

	$effect(() => {
		const sorted = [...specialDays].sort((left, right) =>
			left.start_date < right.start_date
				? -1
				: left.start_date > right.start_date
					? 1
					: left.id - right.id
		);
		const grouped: Record<string, SpecialDay[]> = {};
		for (const specialDay of sorted) {
			const key = getMonthKey(specialDay.start_date);
			(grouped[key] ??= []).push(specialDay);
		}
		daysByMonth = grouped;
	});

	let isAddModalOpen = $state(false);
	let newSpecialDayDraft = $state<SpecialDay>({
		id: 0,
		start_date: getTodayISO(),
		end_date: null,
		label: '',
		comment: null,
		is_open: false,
		start_time: null,
		end_time: null
	});

	async function createSpecialDay() {
		if (!newSpecialDayDraft.start_date) return alert('Select start date');
		if (!newSpecialDayDraft.label.trim()) return alert('Enter a label');
		if (!validateDateRange(newSpecialDayDraft.start_date, newSpecialDayDraft.end_date)) return;
		if (
			!validateOpenTimes(
				newSpecialDayDraft.is_open,
				newSpecialDayDraft.start_time,
				newSpecialDayDraft.end_time,
				newSpecialDayDraft.start_date,
				newSpecialDayDraft.end_date
			)
		)
			return;

		const payload = {
			start_date: newSpecialDayDraft.start_date,
			end_date: newSpecialDayDraft.end_date,
			label: newSpecialDayDraft.label.trim(),
			comment: newSpecialDayDraft.comment?.trim() || null,
			is_open: newSpecialDayDraft.is_open,
			start_time: newSpecialDayDraft.is_open
				? toTimestamp(newSpecialDayDraft.start_date, newSpecialDayDraft.start_time)
				: null,
			end_time: newSpecialDayDraft.is_open
				? toTimestamp(
						newSpecialDayDraft.end_date ?? newSpecialDayDraft.start_date,
						newSpecialDayDraft.end_time
					)
				: null
		};

		const response = await fetch(SPECIAL_DAYS_API, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!response.ok) return alert(await response.text());

		newSpecialDayDraft = {
			id: 0,
			start_date: getTodayISO(),
			end_date: null,
			label: '',
			comment: null,
			is_open: false,
			start_time: null,
			end_time: null
		};
		isAddModalOpen = false;
		await fetchSpecialDays();
	}

	let isEditModalOpen = $state(false);
	let editSpecialDayDraft = $state<SpecialDay | null>(null);

	function openEditModal(row: SpecialDay) {
		editSpecialDayDraft = { ...row };
		isEditModalOpen = true;
	}

	async function saveEditedSpecialDay() {
		if (!editSpecialDayDraft) return;
		const draft = editSpecialDayDraft;

		if (!draft.label.trim()) return alert('Enter a label');
		if (!validateDateRange(draft.start_date, draft.end_date)) return;
		if (
			!validateOpenTimes(
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

		const response = await fetch(`${SPECIAL_DAYS_API}/${draft.id}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!response.ok) return alert(await response.text());

		isEditModalOpen = false;
		editSpecialDayDraft = null;
		await fetchSpecialDays();
	}

	async function deleteSpecialDayById(id: number, label: string) {
		if (!confirm(`Delete special day: ${label}?`)) return;
		const response = await fetch(`${SPECIAL_DAYS_API}/${id}`, { method: 'DELETE' });
		if (!response.ok) return alert(await response.text());
		await fetchSpecialDays();
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
					value={dateFrom}
					oninput={(e) => {
						dateFrom = (e.currentTarget as HTMLInputElement).value;
						void fetchSpecialDays();
					}}
				/>
			</label>
			<label class="text-sm text-gray-600 dark:text-gray-300">
				To
				<input
					type="date"
					class="ml-2 rounded border border-gray-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
					value={dateTo}
					oninput={(e) => {
						dateTo = (e.currentTarget as HTMLInputElement).value;
						void fetchSpecialDays();
					}}
				/>
			</label>
			<button
				class="rounded border px-3 py-1.5 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
				onclick={fetchSpecialDays}
			>
				Refresh
			</button>

			<button
				class="rounded bg-zinc-900 px-3 py-2 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
				onclick={() => (isAddModalOpen = true)}
			>
				Add
			</button>
		</div>
	</div>

	{#if errorMessage}
		<div
			class="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
		>
			{errorMessage}
		</div>
	{/if}

	<div
		class="rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
	>
		{#if isLoading}
			<p class="text-gray-600 dark:text-gray-300">Loading…</p>
		{:else if specialDays.length === 0}
			<p class="text-gray-600 dark:text-gray-300">No entries in range.</p>
		{:else}
			<div class="space-y-8">
				{#each Object.keys(daysByMonth) as monthKey}
					<div>
						<h3 class="mb-3 text-[2rem] font-semibold text-gray-900 dark:text-gray-100">
							{formatMonthHeader(monthKey)}
						</h3>

						<div class="space-y-3">
							{#each daysByMonth[monthKey] as specialDay}
								<div class="rounded-xl border border-gray-200 p-3 dark:border-zinc-700">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<div class="truncate text-[1.5rem] font-semibold">
												{specialDay.label || '—'}
											</div>
											<div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
												<span class="dark:border-zinc-700">
													{#if specialDay.start_date == specialDay.end_date || specialDay.end_date == null}
														{formatMMDD(specialDay.start_date)}
													{:else}
														{formatMMDD(specialDay.start_date)} – {formatMMDD(specialDay.end_date)}
													{/if}
												</span>
												<span class="dark:border-zinc-700">
													{#if specialDay.is_open}
														Open {format12Hour(specialDay.start_time)} – {format12Hour(
															specialDay.end_time
														)}
													{:else}
														Closed
													{/if}
												</span>
											</div>
											{#if specialDay.comment}
												<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
													{specialDay.comment}
												</p>
											{/if}
										</div>

										<div class="flex shrink-0 gap-2">
											<button
												class="rounded bg-zinc-900 px-3 py-1.5 text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
												onclick={() => openEditModal(specialDay)}
											>
												Edit
											</button>
											<button
												class="rounded border px-3 py-1.5 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
												onclick={() => deleteSpecialDayById(specialDay.id, specialDay.label)}
											>
												Delete
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

{#if isAddModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Add special day"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				isAddModalOpen = false;
			}
		}}
		tabindex="0"
	>
		<button
			type="button"
			class="absolute inset-0 bg-black/40"
			aria-label="Close modal"
			onclick={() => (isAddModalOpen = false)}
		></button>

		<div
			class="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
		>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Add special day</h2>
				<button
					class="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => (isAddModalOpen = false)}
				>
					Close
				</button>
			</div>

			<div class="grid gap-3">
				<label class="text-sm">
					Label
					<input
						type="text"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-base font-semibold dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						bind:value={newSpecialDayDraft.label}
						placeholder="Label"
					/>
				</label>

				<label class="text-sm">
					Start date
					<input
						type="date"
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						bind:value={newSpecialDayDraft.start_date}
					/>
				</label>

				<label class="text-sm">
					End date (optional)
					<input
						type="date"
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						value={newSpecialDayDraft.end_date ?? ''}
						oninput={(e) => {
							const value = (e.currentTarget as HTMLInputElement).value;
							newSpecialDayDraft.end_date = value || null;
						}}
					/>
				</label>

				<label class="text-sm">
					Comment (optional)
					<textarea
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						rows="3"
						bind:value={newSpecialDayDraft.comment}
					></textarea>
				</label>

				<label class="inline-flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						bind:checked={newSpecialDayDraft.is_open}
						oninput={() => {
							if (newSpecialDayDraft.is_open) {
								newSpecialDayDraft.start_time ??= '09:00';
								newSpecialDayDraft.end_time ??= '17:00';
							} else {
								newSpecialDayDraft.start_time = null;
								newSpecialDayDraft.end_time = null;
							}
						}}
					/>
					<span>Open during these times</span>
				</label>

				{#if newSpecialDayDraft.is_open}
					<div class="grid grid-cols-2 gap-3">
						<label class="text-sm">
							Opening time
							<input
								type="time"
								class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
								bind:value={newSpecialDayDraft.start_time}
							/>
						</label>
						<label class="text-sm">
							Closing time
							<input
								type="time"
								class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
								bind:value={newSpecialDayDraft.end_time}
							/>
						</label>
					</div>
				{/if}

				<div class="mt-1 flex justify-end gap-2">
					<button
						class="rounded border px-3 py-2 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
						onclick={() => (isAddModalOpen = false)}
					>
						Cancel
					</button>
					<button
						class="rounded bg-zinc-900 px-3 py-2 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
						onclick={createSpecialDay}
					>
						Add special day
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if isEditModalOpen && editSpecialDayDraft}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Edit special day"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				isEditModalOpen = false;
				editSpecialDayDraft = null;
			}
		}}
		tabindex="0"
	>
		<button
			type="button"
			class="absolute inset-0 bg-black/40"
			aria-label="Close modal"
			onclick={() => {
				isEditModalOpen = false;
				editSpecialDayDraft = null;
			}}
		></button>

		<div
			class="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
		>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Edit special day</h2>
				<button
					class="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => {
						isEditModalOpen = false;
						editSpecialDayDraft = null;
					}}
				>
					Close
				</button>
			</div>

			<div class="grid gap-3">
				<label class="text-sm">
					Label
					<input
						type="text"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-base font-semibold dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						bind:value={editSpecialDayDraft.label}
						placeholder="Label"
					/>
				</label>

				<label class="text-sm">
					Start date
					<input
						type="date"
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						bind:value={editSpecialDayDraft.start_date}
					/>
				</label>

				<label class="text-sm">
					End date (optional)
					<input
						type="date"
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						value={editSpecialDayDraft.end_date ?? ''}
						oninput={(e) => {
							const value = (e.currentTarget as HTMLInputElement).value;
							editSpecialDayDraft!.end_date = value || null;
						}}
					/>
				</label>

				<label class="text-sm">
					Comment (optional)
					<textarea
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						rows="3"
						bind:value={editSpecialDayDraft.comment}
					></textarea>
				</label>

				<label class="inline-flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						bind:checked={editSpecialDayDraft.is_open}
						oninput={() => {
							if (editSpecialDayDraft?.is_open) {
								editSpecialDayDraft.start_time ??= '09:00';
								editSpecialDayDraft.end_time ??= '17:00';
							} else if (editSpecialDayDraft) {
								editSpecialDayDraft.start_time = null;
								editSpecialDayDraft.end_time = null;
							}
						}}
					/>
					<span>Open during these times</span>
				</label>

				{#if editSpecialDayDraft.is_open}
					<div class="grid grid-cols-2 gap-3">
						<label class="text-sm">
							Opening time
							<input
								type="time"
								class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
								bind:value={editSpecialDayDraft.start_time}
							/>
						</label>
						<label class="text-sm">
							Closing time
							<input
								type="time"
								class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
								bind:value={editSpecialDayDraft.end_time}
							/>
						</label>
					</div>
				{/if}

				<div class="mt-1 flex justify-end gap-2">
					<button
						class="rounded border px-3 py-2 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
						onclick={() => {
							isEditModalOpen = false;
							editSpecialDayDraft = null;
						}}
					>
						Cancel
					</button>
					<button
						class="rounded bg-zinc-900 px-3 py-2 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
						onclick={saveEditedSpecialDay}
					>
						Save changes
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
