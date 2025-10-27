<script lang="ts">
	const SERVICES_API = '/api/admin/services';

	type ServiceRow = {
		id: number;
		name: string;
		description: string | null;
		price: number;
		availability: boolean;
	};

	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null);
	let serviceList = $state<ServiceRow[]>([]);

	async function fetchServices() {
		isLoading = true;
		errorMessage = null;
		try {
			const response = await fetch(SERVICES_API);
			if (!response.ok) throw new Error(await response.text());
			serviceList = await response.json();
		} catch (e: any) {
			errorMessage = e?.message ?? 'Failed to load';
		} finally {
			isLoading = false;
		}
	}
	$effect(() => {
		void fetchServices();
	});

	let isAddModalOpen = $state(false);
	let newServiceDraft = $state<ServiceRow>({
		id: 0,
		name: '',
		description: null,
		price: 0,
		availability: true
	});

	function resetNewServiceDraft() {
		newServiceDraft = { id: 0, name: '', description: null, price: 0, availability: true };
	}

	async function createService() {
		if (!newServiceDraft.name.trim()) return alert('Enter a name');
		const payload = {
			name: newServiceDraft.name.trim(),
			description: newServiceDraft.description?.trim() || null,
			price: Number(newServiceDraft.price),
			availability: !!newServiceDraft.availability
		};
		const response = await fetch(SERVICES_API, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!response.ok) return alert(await response.text());
		resetNewServiceDraft();
		isAddModalOpen = false;
		await fetchServices();
	}

	let isEditModalOpen = $state(false);
	let editServiceDraft = $state<ServiceRow | null>(null);

	function openEditModal(service: ServiceRow) {
		editServiceDraft = { ...service };
		isEditModalOpen = true;
	}

	async function saveEditedService() {
		if (!editServiceDraft) return;
		const draft = editServiceDraft;
		if (!draft.name.trim()) return alert('Enter a name');
		const payload = {
			name: draft.name.trim(),
			description: draft.description?.trim() || null,
			price: Number(draft.price),
			availability: !!draft.availability
		};
		const response = await fetch(`${SERVICES_API}/${draft.id}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!response.ok) return alert(await response.text());
		isEditModalOpen = false;
		editServiceDraft = null;
		await fetchServices();
	}

	async function deleteServiceById(id: number, name: string) {
		if (!confirm(`Delete service "${name}"?`)) return;
		const response = await fetch(`${SERVICES_API}/${id}`, { method: 'DELETE' });
		if (!response.ok) return alert(await response.text());
		await fetchServices();
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
				</a>Services
			</h1>
			<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
				Create, edit, and toggle service availability.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<button
				class="rounded border px-3 py-1.5 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
				onclick={fetchServices}
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
		{:else if serviceList.length === 0}
			<p class="text-gray-600 dark:text-gray-300">No services.</p>
		{:else}
			<div class="space-y-3">
				{#each serviceList as service}
					<div class="rounded-xl border border-gray-200 p-3 dark:border-zinc-700">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="truncate text-[2rem] font-semibold">{service.name || '—'}</div>
								<div class="mt-1 text-sm text-gray-600 dark:text-gray-300">
									<span class="mr-3">${service.price.toFixed(2)} CAD/hr</span>
									<span class="mr-3"
										>Status: {service.availability ? 'Available' : 'Unavailable'}</span
									>
									<span class="mt-1 block">{service.description ?? '—'}</span>
								</div>
							</div>
							<div class="flex shrink-0 gap-2">
								<button
									class="rounded bg-zinc-900 px-3 py-1.5 text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
									onclick={() => openEditModal(service)}
								>
									Edit
								</button>
								<button
									class="rounded border px-3 py-1.5 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
									onclick={() => deleteServiceById(service.id, service.name)}
								>
									Delete
								</button>
							</div>
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
		aria-label="Add service"
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
				<h2 class="text-lg font-semibold">Add service</h2>
				<button
					class="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => (isAddModalOpen = false)}
				>
					Close
				</button>
			</div>

			<div class="grid gap-3">
				<label class="text-sm">
					Name
					<input
						type="text"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-base font-semibold dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						value={newServiceDraft.name}
						oninput={(e) => {
							newServiceDraft.name = (e.currentTarget as HTMLInputElement).value;
						}}
						placeholder="Service name"
					/>
				</label>

				<label class="text-sm">
					Price/hr &#40;$CAD&#41;
					<input
						type="number"
						min="0"
						step="0.01"
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						value={newServiceDraft.price}
						oninput={(e) => {
							newServiceDraft.price = Number((e.currentTarget as HTMLInputElement).value || 0);
						}}
					/>
				</label>

				<label class="text-sm">
					Description (optional)
					<input
						type="text"
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						value={newServiceDraft.description ?? ''}
						oninput={(e) => {
							const value = (e.currentTarget as HTMLInputElement).value;
							newServiceDraft.description = value ? value : null;
						}}
						placeholder="Short description"
					/>
				</label>

				<label class="inline-flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={newServiceDraft.availability}
						oninput={(e) => {
							newServiceDraft.availability = (e.currentTarget as HTMLInputElement).checked;
						}}
					/>
					<span>Available</span>
				</label>

				<div class="mt-1 flex justify-end gap-2">
					<button
						class="rounded border px-3 py-2 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
						onclick={() => (isAddModalOpen = false)}
					>
						Cancel
					</button>
					<button
						class="rounded bg-zinc-900 px-3 py-2 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
						onclick={createService}
					>
						Add service
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if isEditModalOpen && editServiceDraft}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Edit service"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				isEditModalOpen = false;
				editServiceDraft = null;
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
				editServiceDraft = null;
			}}
		></button>

		<div
			class="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
		>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Edit service</h2>
				<button
					class="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => {
						isEditModalOpen = false;
						editServiceDraft = null;
					}}
				>
					Close
				</button>
			</div>

			<div class="grid gap-3">
				<label class="text-sm">
					Name
					<input
						type="text"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-base font-semibold dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						bind:value={editServiceDraft.name}
						placeholder="Service name"
					/>
				</label>

				<label class="text-sm">
					Price/hr &#40;$CAD&#41;
					<input
						type="number"
						min="0"
						step="0.01"
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						bind:value={editServiceDraft.price}
					/>
				</label>

				<label class="text-sm">
					Description (optional)
					<input
						type="text"
						class="mt-1 w-full rounded border border-gray-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						value={editServiceDraft.description ?? ''}
						oninput={(e) => {
							const value = (e.currentTarget as HTMLInputElement).value;
							editServiceDraft!.description = value ? value : null;
						}}
						placeholder="Short description"
					/>
				</label>

				<label class="inline-flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={editServiceDraft.availability} />
					<span>Available</span>
				</label>

				<div class="mt-1 flex justify-end gap-2">
					<button
						class="rounded border px-3 py-2 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
						onclick={() => {
							isEditModalOpen = false;
							editServiceDraft = null;
						}}
					>
						Cancel
					</button>
					<button
						class="rounded bg-zinc-900 px-3 py-2 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
						onclick={saveEditedService}
					>
						Save changes
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
