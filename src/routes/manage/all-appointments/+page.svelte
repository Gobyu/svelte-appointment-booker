<script lang="ts">
	const API_APPTS = '/api/appointments';

	type Tab = 'today' | 'current' | 'past' | 'all';
	type Appt = {
		id: number;
		name: string;
		email: string | null;
		phoneNumber: string | null;
		date: string;
		time: string;
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
	let tab = $state<'today' | 'current' | 'past' | 'all'>('all');
	let items = $state<Appt[]>([]);

	const displayItems = $derived.by<Appt[]>(() => {
		const todayISO = new Date().toISOString().slice(0, 10);

		switch (tab) {
			case 'today':
				return items.filter((a) => String(a.date).slice(0, 10) === todayISO);
			case 'current':
				return items.filter((a) => !!a.active);
			case 'past':
				return items.filter((a) => !a.active);
			default:
				return items; // 'all'
		}
	});

	function todayISO() {
		const d = new Date();
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${dd}`;
	}
	const dateOnly = (s: string) => String(s).slice(0, 10);

	async function setTab(next: Tab) {
		tab = next;
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

	function fmtAppt(dateLike: string, timeLike: string) {
		const iso = String(dateLike).slice(0, 10);
		const [y, m, d] = iso.split('-');

		const hhmm = String(timeLike).slice(0, 5);
		const [hhStr, mmStr] = hhmm.split(':');
		const hh = Number(hhStr);
		const mm = Number(mmStr || '0');

		const ampm = hh >= 12 ? 'PM' : 'AM';
		const h12 = hh % 12 || 12;

		const dateStr = `${m}/${d}/${y}`;
		const timeStr = `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
		return `${dateStr} - ${timeStr}`;
	}

	async function load() {
		loading = true;
		errorText = null;
		try {
			const qs = new URLSearchParams();
			if (q) qs.set('q', q);
			if (from) qs.set('from', from);
			if (to) qs.set('to', to);
			qs.set('limit', '200');
			const r = await fetch(`${API_APPTS}?${qs.toString()}`);
			if (!r.ok) throw new Error(await r.text());
			const data = await r.json();
			items = data.items ?? [];
			total = data.total ?? items.length;
		} catch (e: any) {
			errorText = e?.message ?? 'Failed to load';
		} finally {
			loading = false;
		}
	}
	$effect(() => {
		void load();
	});
</script>

<section class="mx-auto max-w-6xl px-4 py-8">
	<!-- Header: title + tabs + filters -->
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
			<!-- Tabs -->
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

			<!-- Filters -->
			<input
				placeholder="Search…"
				class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
				value={q}
				oninput={(e) => {
					q = (e.currentTarget as HTMLInputElement).value;
					void load();
				}}
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

	<!-- Error -->
	{#if errorText}
		<div
			role="alert"
			class="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
			aria-live="assertive"
		>
			{errorText}
		</div>
	{/if}

	<!-- Table -->
	<div
		class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow dark:border-zinc-700 dark:bg-zinc-900"
	>
		{#if loading}
			<p class="p-4 text-gray-600 dark:text-gray-300">Loading…</p>
		{:else if displayItems.length === 0}
			<p class="p-4 text-gray-600 dark:text-gray-300">No appointments.</p>
		{:else}
			<table class="w-full text-sm">
				<thead>
					<tr class="text-left text-gray-600 dark:text-gray-300">
						<th class="px-4 py-3">When</th>
						<th class="px-4 py-3">Client</th>
						<th class="px-4 py-3">Contact</th>
						<th class="px-4 py-3">Type</th>
						<th class="px-4 py-3">Duration</th>
						<th class="px-4 py-3">Active</th>
						<th class="px-4 py-3">Paid</th>
					</tr>
				</thead>
				<tbody>
					{#each displayItems as a (a.id)}
						<tr class="border-t border-gray-200 dark:border-zinc-700">
							<td class="px-4 py-3">{fmtAppt(a.date, a.time)}</td>
							<td class="px-4 py-3 font-medium">{a.name}</td>
							<td class="px-4 py-3 text-gray-700 dark:text-gray-300">
								{a.email ?? ''}{a.email && a.phoneNumber ? ' · ' : ''}{a.phoneNumber ?? ''}
							</td>
							<td class="px-4 py-3">{a.type}</td>
							<td class="px-4 py-3">{a.duration}m</td>
							<td class="px-4 py-3">{a.active ? 'Yes' : 'No'}</td>
							<td class="px-4 py-3">{a.paid ? 'Yes' : 'No'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</section>
