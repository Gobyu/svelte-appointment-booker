<script lang="ts">
	const API_APPTS = '/api/appointments';
	const API_APPTS_ADMIN = '/api/admin/appointments';
	const API_LOCS = '/api/locations';

	type Tab = 'today' | 'current' | 'past' | 'all';

	type Location = {
		id: number;
		name: string;
		address: string;
		postal: string;
		city: string;
		province: string;
		lat: number;
		lng: number;
	};

	type Appt = {
		id: number;
		name: string;
		email: string | null;
		phoneNumber: string | null;
		location: number | null; // ✅ now an id (FK)
		date: string; // "YYYY-MM-DD"
		time: string; // "HH:MM" (we normalize)
		duration: number;
		type: string;
		comments: string | null;
		active: 0 | 1;
		paid: 0 | 1;
	};

	let loading = $state(false);
	let errorText = $state<string | null>(null);
	let total = $state(0);
	let q = $state('');
	let from = $state('');
	let to = $state('');
	let tab = $state<Tab>('all');
	let items = $state<Appt[]>([]);

	// locations
	let locLoading = $state(false);
	let locs = $state<Location[]>([]);
	const locNameById = $derived.by<Record<number, string>>(() => {
		const m: Record<number, string> = {};
		for (const l of locs) m[l.id] = l.name;
		return m;
	});
	const locName = (id: number | null | undefined) =>
		id == null ? '—' : (locNameById[id] ?? `#${id}`);

	// ===== Sorting (RUNES) =====
	type SortKey =
		| 'location'
		| 'when'
		| 'client'
		| 'contact'
		| 'type'
		| 'duration'
		| 'active'
		| 'paid';
	let sortKey = $state<SortKey>('when');
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(key: SortKey) {
		if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	function sortIcon(key: SortKey) {
		if (sortKey !== key) return '';
		return sortDir === 'asc' ? '▲' : '▼';
	}

	function cmp(a: unknown, b: unknown) {
		const an = typeof a === 'number' ? a : Number(String(a));
		const bn = typeof b === 'number' ? b : Number(String(b));
		const bothNumeric = Number.isFinite(an) && Number.isFinite(bn);

		if (bothNumeric) return an === bn ? 0 : an < bn ? -1 : 1;

		const as = String(a ?? '').toLowerCase();
		const bs = String(b ?? '').toLowerCase();
		return as === bs ? 0 : as < bs ? -1 : 1;
	}

	function apptSortValue(a: Appt, key: SortKey) {
		switch (key) {
			case 'location':
				return a.location == null ? '' : (locNameById[a.location] ?? '');
			case 'when': {
				const d = String(a.date).slice(0, 10);
				const t = String(a.time).slice(0, 5);
				return `${d} ${t}`;
			}
			case 'client':
				return a.name ?? '';
			case 'contact':
				return `${a.email ?? ''} ${a.phoneNumber ?? ''}`.trim();
			case 'type':
				return a.type ?? '';
			case 'duration':
				return a.duration ?? 0;
			case 'active':
				return a.active ? 1 : 0;
			case 'paid':
				return a.paid ? 1 : 0;
		}
	}

	// ===== Formatting =====
	function fmtAppt(dateLike: string, timeLike: string) {
		const iso = String(dateLike).slice(0, 10);
		const [y, m, d] = iso.split('-');

		const hhmm = String(timeLike).slice(0, 5);
		const [hhStr, mmStr] = hhmm.split(':');
		const hh = Number(hhStr);
		const mm = Number(mmStr || '0');

		const ampm = hh >= 12 ? 'PM' : 'AM';
		const h12 = hh % 12 || 12;

		return `${m}/${d}/${y} - ${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
	}

	function todayISO() {
		const d = new Date();
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${dd}`;
	}
	const dateOnly = (s: string) => String(s).slice(0, 10);
	const isPastDate = (isoDate: string) => dateOnly(isoDate) < todayISO(); // YYYY-MM-DD compares lexicographically

	// ===== Tabs filter =====
	const displayItems = $derived.by<Appt[]>(() => {
		const t = todayISO();
		switch (tab) {
			case 'today':
				return items.filter((a) => dateOnly(a.date) === t);
			case 'current':
				return items.filter((a) => !!a.active);
			case 'past':
				return items.filter((a) => !a.active);
			default:
				return items;
		}
	});

	// ===== Local search filter =====
	const filteredItems = $derived.by<Appt[]>(() => {
		const needle = q.trim().toLowerCase();
		if (!needle) return displayItems;

		const tokens = needle.split(/\s+/).filter(Boolean);

		return displayItems.filter((a) => {
			const locLabel = a.location == null ? '' : (locNameById[a.location] ?? '');
			const hay = [
				a.name,
				a.email ?? '',
				a.phoneNumber ?? '',
				locLabel,
				a.type,
				a.comments ?? '',
				String(a.duration ?? ''),
				String(a.active ? 'yes' : 'no'),
				String(a.paid ? 'yes' : 'no'),
				String(a.date ?? ''),
				String(a.time ?? '')
			]
				.join(' ')
				.toLowerCase();

			return tokens.every((t) => hay.includes(t));
		});
	});

	// ===== Sorted view =====
	const sortedDisplayItems = $derived.by<Appt[]>(() => {
		const arr = [...filteredItems];
		arr.sort((A, B) => {
			const d = cmp(apptSortValue(A, sortKey), apptSortValue(B, sortKey));
			return sortDir === 'asc' ? d : -d;
		});
		return arr;
	});

	// ===== Loads =====
	async function fetchLocations() {
		locLoading = true;
		try {
			const r = await fetch(API_LOCS);
			if (!r.ok) throw new Error(await r.text());
			const data: Location[] = await r.json();
			locs = data;
		} finally {
			locLoading = false;
		}
	}

	async function load() {
		loading = true;
		errorText = null;
		try {
			const qs = new URLSearchParams();
			// NOTE: q is local-filter only (so the search box always works)
			if (from) qs.set('from', from);
			if (to) qs.set('to', to);
			qs.set('limit', '200');

			const r = await fetch(`${API_APPTS}?${qs.toString()}`);
			if (!r.ok) throw new Error(await r.text());
			const data = await r.json();

			const raw: any[] = data.items ?? [];
			items = raw.map((a) => ({
				...a,
				location:
					a.location == null || a.location === ''
						? null
						: typeof a.location === 'string'
							? Number(a.location)
							: a.location,
				time: String(a.time ?? '').slice(0, 5) // normalize to HH:MM for UI
			})) as Appt[];

			total = data.total ?? items.length;
		} catch (e: any) {
			errorText = e?.message ?? 'Failed to load';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void fetchLocations();
		void load();
	});

	async function setTab(next: Tab) {
		tab = next;
		sortKey = 'when';
		sortDir = 'asc';

		if (next === 'today') {
			from = todayISO();
			to = todayISO();
			await load();
		} else {
			if (from || to) {
				from = '';
				to = '';
				await load();
			}
		}
	}

	// ===== Edit modal + constraints =====
	let showEdit = $state(false);
	let editingId = $state<number | null>(null);
	let draft = $state<Appt | null>(null);
	let confirmVoid = $state(false);
	let saving = $state(false);

	function openEdit(appt: Appt) {
		editingId = appt.id;
		draft = { ...appt };
		confirmVoid = false;
		showEdit = true;
	}
	function closeEdit() {
		showEdit = false;
		editingId = null;
		draft = null;
		confirmVoid = false;
		saving = false;
	}

	function validateDraft(d: Appt) {
		if (!String(d.name ?? '').trim()) return 'Client name is required.';
		if (!isPastDate(d.date)) {
			if (!dateOnly(d.date) || dateOnly(d.date).length !== 10) return 'Invalid date.';
			if (!String(d.time ?? '').match(/^\d{2}:\d{2}$/)) return 'Invalid time.';
			const dur = Number(d.duration);
			if (!Number.isFinite(dur) || dur <= 0) return 'Duration must be > 0.';
			if (!String(d.type ?? '').trim()) return 'Type is required.';
		}
		return null;
	}

	async function saveEdit() {
		if (!draft || editingId == null) return;
		const id = editingId;
		const d = draft;

		const msg = validateDraft(d);
		if (msg) return alert(msg);

		const past = isPastDate(d.date);

		// Client-side restriction:
		// past => ONLY allow name + paid
		const payload: any = past
			? { name: String(d.name).trim(), paid: d.paid ? 1 : 0 }
			: {
					name: String(d.name).trim(),
					email: d.email ? String(d.email).trim() : null,
					phoneNumber: d.phoneNumber ? String(d.phoneNumber).trim() : null,
					location: d.location == null ? null : Number(d.location),
					date: dateOnly(d.date),
					time: String(d.time).slice(0, 5), // "HH:MM"
					duration: Number(d.duration),
					type: String(d.type).trim(),
					comments: d.comments ? String(d.comments).trim() : null,
					active: d.active ? 1 : 0,
					paid: d.paid ? 1 : 0
				};

		saving = true;
		try {
			const r = await fetch(`${API_APPTS_ADMIN}/${id}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!r.ok) return alert(await r.text());

			// reflect changes locally
			items = items.map((x) => (x.id === id ? ({ ...x, ...payload } as Appt) : x));
			closeEdit();
		} finally {
			saving = false;
		}
	}

	async function voidAppointment(id: number) {
		saving = true;
		try {
			const r = await fetch(`${API_APPTS_ADMIN}/${id}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: 'VOID' })
			});
			if (!r.ok) return alert(await r.text());

			items = items.map((x) => (x.id === id ? ({ ...x, name: 'VOID' } as Appt) : x));
			closeEdit();
		} finally {
			saving = false;
		}
	}
</script>

<section class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
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
				</a>All appointments
			</h1>
			<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">View & edit bookings.</p>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<div
				role="tablist"
				aria-label="Appointment views"
				class="inline-flex overflow-hidden rounded-lg border border-gray-300 bg-white text-sm dark:border-zinc-700 dark:bg-zinc-900"
			>
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'today'}
					class={`px-3 py-1.5 ${
						tab === 'today'
							? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black'
							: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800'
					}`}
					onclick={() => setTab('today')}
				>
					Today
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'current'}
					class={`border-l border-gray-300 px-3 py-1.5 dark:border-zinc-700 ${
						tab === 'current'
							? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black'
							: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800'
					}`}
					onclick={() => setTab('current')}
				>
					Current
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'past'}
					class={`border-l border-gray-300 px-3 py-1.5 dark:border-zinc-700 ${
						tab === 'past'
							? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black'
							: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800'
					}`}
					onclick={() => setTab('past')}
				>
					Past
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'all'}
					class={`border-l border-gray-300 px-3 py-1.5 dark:border-zinc-700 ${
						tab === 'all'
							? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black'
							: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800'
					}`}
					onclick={() => setTab('all')}
				>
					All
				</button>
			</div>

			<input
				placeholder="Search…"
				class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
				value={q}
				oninput={(e) => (q = (e.currentTarget as HTMLInputElement).value)}
			/>

			<input
				type="date"
				class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
				value={from}
				oninput={(e) => {
					from = (e.currentTarget as HTMLInputElement).value;
					void load();
				}}
			/>
			<span class="text-sm">to</span>
			<input
				type="date"
				class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
				value={to}
				oninput={(e) => {
					to = (e.currentTarget as HTMLInputElement).value;
					void load();
				}}
			/>
		</div>
	</div>

	{#if errorText}
		<div
			role="alert"
			class="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
			aria-live="assertive"
		>
			{errorText}
		</div>
	{/if}

	<div
		class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow dark:border-zinc-700 dark:bg-zinc-900"
	>
		{#if loading}
			<p class="p-4 text-gray-600 dark:text-gray-300">Loading…</p>
		{:else if sortedDisplayItems.length === 0}
			<p class="p-4 text-gray-600 dark:text-gray-300">No appointments.</p>
		{:else}
			<table class="w-full text-sm">
				<thead>
					<tr class="text-left text-gray-600 dark:text-gray-300">
						<th class="px-4 py-3">
							<button
								class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
								onclick={() => toggleSort('location')}
							>
								Location <span class="text-xs">{sortIcon('location')}</span>
							</button>
						</th>
						<th class="px-4 py-3">
							<button
								class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
								onclick={() => toggleSort('when')}
							>
								When <span class="text-xs">{sortIcon('when')}</span>
							</button>
						</th>
						<th class="px-4 py-3">
							<button
								class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
								onclick={() => toggleSort('client')}
							>
								Client <span class="text-xs">{sortIcon('client')}</span>
							</button>
						</th>
						<th class="px-4 py-3">
							<button
								class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
								onclick={() => toggleSort('contact')}
							>
								Contact <span class="text-xs">{sortIcon('contact')}</span>
							</button>
						</th>
						<th class="px-4 py-3">
							<button
								class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
								onclick={() => toggleSort('type')}
							>
								Type <span class="text-xs">{sortIcon('type')}</span>
							</button>
						</th>
						<th class="px-4 py-3">
							<button
								class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
								onclick={() => toggleSort('duration')}
							>
								Duration <span class="text-xs">{sortIcon('duration')}</span>
							</button>
						</th>
						<th class="px-4 py-3">
							<button
								class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
								onclick={() => toggleSort('active')}
							>
								Active <span class="text-xs">{sortIcon('active')}</span>
							</button>
						</th>
						<th class="px-4 py-3">
							<button
								class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
								onclick={() => toggleSort('paid')}
							>
								Paid <span class="text-xs">{sortIcon('paid')}</span>
							</button>
						</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>

				<tbody>
					{#each sortedDisplayItems as a (a.id)}
						<tr class="border-t border-gray-200 dark:border-zinc-700">
							<td class="px-4 py-3">{locName(a.location)}</td>
							<td class="px-4 py-3">{fmtAppt(a.date, a.time)}</td>
							<td class="px-4 py-3 font-medium">{a.name}</td>
							<td class="px-4 py-3 text-gray-700 dark:text-gray-300">
								{a.email ?? ''}{a.email && a.phoneNumber ? ' · ' : ''}{a.phoneNumber ?? ''}
							</td>
							<td class="px-4 py-3">{a.type}</td>
							<td class="px-4 py-3">{a.duration}m</td>
							<td class="px-4 py-3">{a.active ? 'Yes' : 'No'}</td>
							<td class="px-4 py-3">{a.paid ? 'Yes' : 'No'}</td>
							<td class="px-4 py-3">
								{#if String(a.name).trim().toUpperCase() !== 'VOID'}
									<button
										class="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
										onclick={() => openEdit(a)}
										aria-label="Edit appointment"
									>
										✎
									</button>
								{:else}
									<span class="text-xs text-gray-500">VOID</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</section>

<!-- Edit modal -->
{#if showEdit && draft && editingId}
	{@const d = draft as Appt}
	{@const id = editingId as number}
	{@const past = isPastDate(d.date)}

	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Edit appointment"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				closeEdit();
			}
		}}
		tabindex="0"
	>
		<button
			type="button"
			class="absolute inset-0 bg-black/40"
			aria-label="Close modal"
			onclick={closeEdit}
		></button>

		<div
			class="relative z-10 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
		>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Appointment #{id}</h2>
				<button
					class="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={closeEdit}
				>
					Close
				</button>
			</div>

			{#if past}
				<div
					class="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
				>
					This appointment date is in the past. You can only edit <b>Client</b>, <b>Paid</b> and
					<b>Comments</b>.
				</div>
			{/if}

			<div class="grid gap-3">
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<label class="text-sm sm:col-span-2">
						Client
						<input
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={d.name}
							oninput={(e) => (d.name = (e.currentTarget as HTMLInputElement).value)}
						/>
					</label>

					<label class="text-sm">
						Paid
						<div class="mt-2">
							<input
								type="checkbox"
								checked={!!d.paid}
								oninput={(e) => (d.paid = (e.currentTarget as HTMLInputElement).checked ? 1 : 0)}
							/>
						</div>
					</label>

					<label class="text-sm">
						Active
						<div class="mt-2">
							<input
								type="checkbox"
								disabled={past}
								checked={!!d.active}
								oninput={(e) => (d.active = (e.currentTarget as HTMLInputElement).checked ? 1 : 0)}
							/>
						</div>
					</label>

					<label class="text-sm">
						Email
						<input
							disabled={past}
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={d.email ?? ''}
							oninput={(e) => (d.email = (e.currentTarget as HTMLInputElement).value || null)}
						/>
					</label>

					<label class="text-sm">
						Phone
						<input
							disabled={past}
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={d.phoneNumber ?? ''}
							oninput={(e) => (d.phoneNumber = (e.currentTarget as HTMLInputElement).value || null)}
						/>
					</label>

					<label class="text-sm sm:col-span-2">
						Location
						<select
							disabled={past || locLoading}
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={d.location == null ? '' : String(d.location)}
							onchange={(e) => {
								const v = (e.currentTarget as HTMLSelectElement).value;
								d.location = v ? Number(v) : null;
							}}
						>
							<option value="">{locLoading ? 'Loading…' : '—'}</option>
							{#each locs as l (l.id)}
								<option value={String(l.id)}>{l.name}</option>
							{/each}
						</select>
					</label>

					<label class="text-sm">
						Date
						<input
							type="date"
							disabled={past}
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={dateOnly(d.date)}
							oninput={(e) => (d.date = (e.currentTarget as HTMLInputElement).value)}
						/>
					</label>

					<label class="text-sm">
						Time
						<input
							type="time"
							disabled={past}
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={String(d.time).slice(0, 5)}
							oninput={(e) => (d.time = (e.currentTarget as HTMLInputElement).value)}
						/>
					</label>

					<label class="text-sm">
						Duration (min)
						<input
							type="number"
							min="1"
							step="1"
							disabled={past}
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={String(d.duration)}
							oninput={(e) => (d.duration = Number((e.currentTarget as HTMLInputElement).value))}
						/>
					</label>

					<label class="text-sm">
						Type
						<input
							disabled={past}
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={d.type}
							oninput={(e) => (d.type = (e.currentTarget as HTMLInputElement).value)}
						/>
					</label>

					<label class="text-sm sm:col-span-2">
						Comments
						<textarea
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							rows="3"
							value={d.comments ?? ''}
							oninput={(e) => (d.comments = (e.currentTarget as HTMLTextAreaElement).value || null)}
						></textarea>
					</label>
				</div>
			</div>

			<hr class="my-4 border-gray-200 dark:border-zinc-700" />

			<!-- No delete. Use VOID instead -->
			<div
				class="rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40"
			>
				<p class="mb-2 text-sm text-red-800 dark:text-red-200">
					Permanently deleting is not supported. <br />
					Canceled appointments have client name <b>VOID</b>. <br />
					Canceling appointments will set client name to <b>VOID</b>.
				</p>

				{#if !confirmVoid}
					<button
						class="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
						disabled={saving}
						onclick={() => (confirmVoid = true)}
					>
						Cancel Appointment
					</button>
				{:else}
					<div class="flex items-center gap-2">
						<button
							class="rounded bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
							disabled={saving}
							onclick={() => voidAppointment(id)}
						>
							Confirm
						</button>
						<button
							class="rounded border px-3 py-2 text-sm hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
							onclick={() => (confirmVoid = false)}
						>
							Cancel
						</button>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="mt-4 flex items-center justify-end gap-2">
				<button
					type="button"
					class="rounded border px-3 py-2 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={closeEdit}
					disabled={saving}
				>
					Cancel
				</button>

				<button
					type="button"
					class="rounded bg-zinc-900 px-3 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-60 dark:bg-zinc-100 dark:text-black"
					onclick={saveEdit}
					disabled={saving}
				>
					Save changes
				</button>
			</div>
		</div>
	</div>
{/if}
