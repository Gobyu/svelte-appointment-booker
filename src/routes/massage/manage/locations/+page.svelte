<!-- src/routes/massage/manange/locations/+page.svelte (add sorting) -->
<script lang="ts">
	const API_PUBLIC = '/api/locations';
	const API_ADMIN = '/api/admin/locations';

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

	let loading = $state(false);
	let errorText = $state<string | null>(null);
	let locations = $state<Location[]>([]);

	type SortKey = 'name' | 'address' | 'city' | 'province' | 'postal' | 'lat' | 'lng';
	let sortKey = $state<SortKey>('name');
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(key: SortKey) {
		if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortKey = key;
			sortDir = 'asc';
		}
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

	// ✅ use $derived.by for a function body
	let sortedLocations = $derived.by(() => {
		const arr = [...locations];
		arr.sort((A, B) => {
			const d = cmp(A[sortKey], B[sortKey]);
			return sortDir === 'asc' ? d : -d;
		});
		return arr;
	});

	async function fetchLocations() {
		loading = true;
		errorText = null;
		try {
			const r = await fetch(API_PUBLIC, { cache: 'no-store' });
			if (!r.ok) throw new Error(await r.text());
			const data: Location[] = await r.json();

			locations = data.map((x) => ({
				...x,
				lat: typeof (x as any).lat === 'string' ? Number((x as any).lat) : x.lat,
				lng: typeof (x as any).lng === 'string' ? Number((x as any).lng) : x.lng
			}));
		} catch (e: any) {
			errorText = e?.message ?? 'Failed to load';
		} finally {
			loading = false;
		}
	}

	$effect(() => void fetchLocations());
	let confirmDelete = $state(false);

	async function deleteLocation(id: number) {
		const r = await fetch(`${API_ADMIN}/${id}`, { method: 'DELETE' });
		if (!r.ok) return alert(await r.text());

		locations = locations.filter((l) => l.id !== id);
		closeModal();
	}

	// ===== Edit modal state (keep yours) =====
	let showEdit = $state(false);
	let editingId = $state<number | null>(null);
	let draft = $state<Location | null>(null);
	function openEdit(loc: Location) {
		editingId = loc.id;
		draft = { ...loc };
		confirmDelete = false;
		showEdit = true;
	}

	function closeModal() {
		showEdit = false;
		editingId = null;
		draft = null;
		confirmDelete = false;
	}

	function toNumberOrNull(v: unknown) {
		if (v === null || v === undefined) return null;
		const n = typeof v === 'number' ? v : Number(String(v));
		return Number.isFinite(n) ? n : null;
	}

	function validateDraft(d: Location) {
		if (!String(d.name).trim()) return 'Name is required';
		if (!String(d.address).trim()) return 'Address is required';
		if (!String(d.postal).trim()) return 'Postal is required';
		if (!String(d.city).trim()) return 'City is required';
		if (!String(d.province).trim()) return 'Province is required';

		const lat = toNumberOrNull(d.lat);
		const lng = toNumberOrNull(d.lng);
		if (lat === null || lng === null) return 'Latitude and longitude must be numbers';
		if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90';
		if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180';
		return null;
	}

	async function saveEdit() {
		if (!draft || editingId == null) return;

		const msg = validateDraft(draft);
		if (msg) return alert(msg);

		const payload = {
			name: String(draft.name).trim(),
			address: String(draft.address).trim(),
			postal: String(draft.postal).trim(),
			city: String(draft.city).trim(),
			province: String(draft.province).trim(),
			lat: Number(draft.lat),
			lng: Number(draft.lng)
		};

		const r = await fetch(`${API_ADMIN}/${editingId}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!r.ok) return alert(await r.text());

		locations = locations.map((l) => (l.id === editingId ? { ...l, ...payload } : l));
		closeModal();
	}

	async function deleteLocationConfirmed() {
		if (!editingId) return;
		const r = await fetch(`${API_ADMIN}/${editingId}`, { method: 'DELETE' });
		if (!r.ok) return alert(await r.text());
		locations = locations.filter((l) => l.id !== editingId);
		closeModal();
	}
</script>

<section class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">
			<a
				href="/massage/manange"
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
			</a>
			Locations
		</h1>
		<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
			Edit or delete location details used for appointment booking.
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
					<th class="px-4 py-3">
						<button
							class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
							onclick={() => toggleSort('name')}
						>
							Name
							{#if sortKey === 'name'}<span class="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span
								>{/if}
						</button>
					</th>
					<th class="px-4 py-3">
						<button
							class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
							onclick={() => toggleSort('address')}
						>
							Address
							{#if sortKey === 'address'}<span class="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span
								>{/if}
						</button>
					</th>
					<th class="px-4 py-3">
						<button
							class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
							onclick={() => toggleSort('city')}
						>
							City
							{#if sortKey === 'city'}<span class="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span
								>{/if}
						</button>
					</th>
					<th class="px-4 py-3">
						<button
							class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
							onclick={() => toggleSort('province')}
						>
							Province
							{#if sortKey === 'province'}<span class="text-xs"
									>{sortDir === 'asc' ? '▲' : '▼'}</span
								>{/if}
						</button>
					</th>
					<th class="px-4 py-3">
						<button
							class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
							onclick={() => toggleSort('postal')}
						>
							Postal
							{#if sortKey === 'postal'}<span class="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span
								>{/if}
						</button>
					</th>
					<th class="px-4 py-3">
						<button
							class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
							onclick={() => toggleSort('lat')}
						>
							Latitude
							{#if sortKey === 'lat'}<span class="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span
								>{/if}
						</button>
					</th>
					<th class="px-4 py-3">
						<button
							class="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
							onclick={() => toggleSort('lng')}
						>
							Longitude
							{#if sortKey === 'lng'}<span class="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span
								>{/if}
						</button>
					</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>

			<tbody>
				{#if loading}
					<tr class="border-t border-gray-200 dark:border-zinc-700">
						<td class="px-4 py-4 text-gray-500" colspan="8">Loading…</td>
					</tr>
				{:else if sortedLocations.length === 0}
					<tr class="border-t border-gray-200 dark:border-zinc-700">
						<td class="px-4 py-4 text-gray-500" colspan="8">No locations found.</td>
					</tr>
				{:else}
					{#each sortedLocations as loc (loc.id)}
						<tr class="border-t border-gray-200 dark:border-zinc-700">
							<td class="px-4 py-3 font-medium">{loc.name}</td>
							<td class="px-4 py-3">{loc.address}</td>
							<td class="px-4 py-3">{loc.city}</td>
							<td class="px-4 py-3">{loc.province}</td>
							<td class="px-4 py-3">{loc.postal}</td>
							<td class="px-4 py-3 tabular-nums">{loc.lat}</td>
							<td class="px-4 py-3 tabular-nums">{loc.lng}</td>
							<td class="px-4 py-3">
								<button
									class="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
									onclick={() => openEdit(loc)}
								>
									✎
								</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</section>

<!-- Edit modal (keep your existing modal; just ensure delete confirm still works) -->
{#if showEdit && draft && editingId}
	{@const d = draft as Location}
	{@const id = editingId as number}

	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Edit location"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				closeModal();
			}
		}}
		tabindex="0"
	>
		<button
			type="button"
			class="absolute inset-0 bg-black/40"
			aria-label="Close modal"
			onclick={closeModal}
		></button>

		<div
			class="relative z-10 w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
		>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Edit — {d.name}</h2>
			</div>

			<!-- ✅ fields -->
			<div class="grid gap-3">
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<label class="text-sm"
						>Name
						<input
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							bind:value={d.name}
						/>
					</label>

					<label class="text-sm"
						>Postal
						<input
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							bind:value={d.postal}
						/>
					</label>

					<label class="text-sm sm:col-span-2"
						>Address
						<input
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							bind:value={d.address}
						/>
					</label>

					<label class="text-sm"
						>City
						<input
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							bind:value={d.city}
						/>
					</label>

					<label class="text-sm"
						>Province
						<input
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							bind:value={d.province}
						/>
					</label>

					<label class="text-sm"
						>Latitude
						<input
							type="number"
							step="any"
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 tabular-nums dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={String(d.lat)}
							oninput={(e) => (d.lat = Number((e.currentTarget as HTMLInputElement).value))}
						/>
					</label>

					<label class="text-sm"
						>Longitude
						<input
							type="number"
							step="any"
							class="mt-1 w-full rounded border border-gray-300 px-2 py-1 tabular-nums dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
							value={String(d.lng)}
							oninput={(e) => (d.lng = Number((e.currentTarget as HTMLInputElement).value))}
						/>
					</label>
				</div>
			</div>

			<hr class="my-4 border-gray-200 dark:border-zinc-700" />

			<div
				class="rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40"
			>
				<p class="mb-2 text-sm text-red-800 dark:text-red-200">
					Danger zone — deleting a location is permanent.
				</p>

				{#if !confirmDelete}
					<button
						class="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
						onclick={() => (confirmDelete = true)}
					>
						Delete location
					</button>
				{:else}
					<div class="flex items-center gap-2">
						<button
							class="rounded bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
							onclick={() => deleteLocation(id)}
						>
							Yes, delete
						</button>
						<button
							class="rounded border px-3 py-2 text-sm hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
							onclick={() => (confirmDelete = false)}
						>
							Cancel
						</button>
					</div>
				{/if}
			</div>

			<div class="mt-4 flex items-center justify-end gap-2">
				<button
					type="button"
					class="rounded border px-3 py-2 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={closeModal}
				>
					Cancel
				</button>

				<button
					type="button"
					class="rounded bg-blue-500 px-3 py-2 font-semibold text-white hover:opacity-90 dark:text-white"
					onclick={saveEdit}
				>
					Save changes
				</button>
			</div>
		</div>
	</div>
{/if}
