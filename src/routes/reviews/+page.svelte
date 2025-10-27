<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const PAGE_SIZE = 5;

	let sort = $state<'newest' | 'rating_desc' | 'rating_asc'>('newest');
	let page = $state(1);
	let total = $state<number | null>(null);
	let loading = $state(false);

	// Dialog state
	let errorOpen = $state(false);
	let errorText = $state<string | null>(null);
	let successOpen = $state(false);
	let successText = $state<string | null>(null);

	type Review = {
		ReviewID: number;
		Rating: number;
		TypeOfMassage: string;
		Comments: string | null;
		CreatedAt: string;
	};

	type PageBucket = { items: Review[] };
	type SortCache = { pages: Record<number, PageBucket>; total: number | null; fetchedAt: number };

	let cache = $state<Record<'newest' | 'rating_desc' | 'rating_asc', SortCache>>({
		newest: { pages: {}, total: null, fetchedAt: 0 },
		rating_desc: { pages: {}, total: null, fetchedAt: 0 },
		rating_asc: { pages: {}, total: null, fetchedAt: 0 }
	});

	// Helpers for cache
	function setPageCache(p: number, s: typeof sort, items: Review[], totalMaybe?: number) {
		cache[s].pages[p] = { items };
		if (typeof totalMaybe === 'number') cache[s].total = totalMaybe;
		cache[s].fetchedAt = Date.now();
	}
	function pageCached(p: number, s: typeof sort) {
		return !!cache[s].pages[p];
	}

	// Dialog helpers
	function showError(msg: string) {
		errorText = msg;
		errorOpen = true;
	}
	function showSuccess(msg: string) {
		successText = msg;
		successOpen = true;
	}

	// Data fetching
	async function fetchPage(p: number, s: typeof sort, withCount: boolean) {
		loading = true;
		try {
			const params = new URLSearchParams({
				limit: String(PAGE_SIZE),
				offset: String((p - 1) * PAGE_SIZE),
				sort: s
			});
			if (withCount) params.set('withCount', '1');

			const res = await fetch(`/api/reviews?${params.toString()}`);
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json();

			const items: Review[] = Array.isArray(data) ? data : data.items;
			const totalMaybe: number | undefined = Array.isArray(data) ? undefined : data.total;

			setPageCache(p, s, items, totalMaybe);
			if (withCount && typeof totalMaybe === 'number') total = totalMaybe;
		} catch (e: any) {
			showError(e?.message || 'Failed to load reviews.');
		} finally {
			loading = false;
		}
	}

	function totalPages() {
		const t = cache[sort].total ?? total ?? 0;
		return Math.max(1, Math.ceil(t / PAGE_SIZE));
	}

	async function goTo(p: number) {
		const clamped = Math.min(Math.max(1, p), totalPages());
		if (clamped === page) return;
		page = clamped;

		if (!pageCached(page, sort)) {
			await fetchPage(page, sort, false);
		}
		goto(`/reviews?page=${page}&sort=${sort}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: false
		});
	}

	async function onSortChange(newSort: typeof sort) {
		if (newSort === sort) return;
		sort = newSort;
		page = 1;
		total = cache[sort].total;

		if (!pageCached(1, sort)) {
			await fetchPage(1, sort, true);
		}
		goto(`/reviews?page=1&sort=${sort}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	onMount(async () => {
		const params = new URLSearchParams(location.search);
		const initialPage = Math.max(1, Number(params.get('page') ?? '1'));
		const initialSort = (params.get('sort') ?? 'newest') as typeof sort;
		sort = ['newest', 'rating_desc', 'rating_asc'].includes(initialSort) ? initialSort : 'newest';
		page = initialPage;

		if (!pageCached(page, sort)) {
			await fetchPage(page, sort, true);
		} else {
			total = cache[sort].total;
		}
	});

	function stars(n: number) {
		return Array.from({ length: 5 })
			.map((_, i) => (i < n ? '★' : '☆'))
			.join('');
	}
</script>

<section class="mx-auto max-w-3xl px-4 py-8">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-3xl font-semibold tracking-tight">Reviews</h1>

		<div class="flex items-center gap-2">
			<label for="sort" class="text-sm text-gray-600 dark:text-gray-300">Sort</label>
			<select
				id="sort"
				class="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900
               focus:ring-2 focus:ring-gray-300 focus:outline-none
               dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
				onchange={(e) => onSortChange((e.target as HTMLSelectElement).value as any)}
			>
				<option value="newest" selected={sort === 'newest'}>Newest</option>
				<option value="rating_desc" selected={sort === 'rating_desc'}>Highest rating</option>
				<option value="rating_asc" selected={sort === 'rating_asc'}>Lowest rating</option>
			</select>
		</div>
	</div>

	<div class="min-h-[160px] space-y-4">
		{#if loading && !cache[sort].pages[page]}
			<div class="animate-pulse rounded-xl border border-gray-200 p-4 dark:border-zinc-700">
				<div class="h-4 w-24 rounded bg-gray-200 dark:bg-zinc-800"></div>
				<div class="mt-2 h-4 w-40 rounded bg-gray-200 dark:bg-zinc-800"></div>
				<div class="mt-2 h-16 w-full rounded bg-gray-200 dark:bg-zinc-800"></div>
			</div>
			<div class="animate-pulse rounded-xl border border-gray-200 p-4 dark:border-zinc-700">
				<div class="h-4 w-24 rounded bg-gray-200 dark:bg-zinc-800"></div>
				<div class="mt-2 h-4 w-40 rounded bg-gray-200 dark:bg-zinc-800"></div>
				<div class="mt-2 h-16 w-full rounded bg-gray-200 dark:bg-zinc-800"></div>
			</div>
		{:else if cache[sort].pages[page]?.items?.length}
			{#each cache[sort].pages[page].items as r}
				<article
					class="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
				>
					<div class="flex items-center justify-between">
						<p class="text-sm text-gray-500 dark:text-gray-400">
							{new Date(r.CreatedAt).toLocaleString()}
						</p>
						<p class="font-semibold" aria-label="Rating">{stars(r.Rating)}</p>
					</div>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">
						<span class="font-medium">Type:</span>
						{r.TypeOfMassage}
					</p>
					{#if r.Comments}
						<p class="mt-2 text-gray-900 dark:text-gray-100">{r.Comments}</p>
					{/if}
				</article>
			{/each}
		{:else}
			<p class="text-gray-600 dark:text-gray-300">No reviews yet.</p>
		{/if}
	</div>

	{#if (cache[sort].total ?? 0) > PAGE_SIZE}
		<div class="mt-6 flex items-center justify-between">
			<button
				class="rounded-lg border border-gray-300 px-3 py-1.5
               text-sm hover:bg-gray-50 disabled:opacity-50
               dark:border-zinc-700 dark:hover:bg-zinc-800"
				disabled={page <= 1 || loading}
				onclick={() => goTo(page - 1)}
			>
				← Previous
			</button>

			<p class="text-sm text-gray-600 dark:text-gray-300">
				Page {page} of {Math.max(1, Math.ceil((cache[sort].total ?? 0) / PAGE_SIZE))}
			</p>

			<button
				class="rounded-lg border border-gray-300 px-3 py-1.5
               text-sm hover:bg-gray-50 disabled:opacity-50
               dark:border-zinc-700 dark:hover:bg-zinc-800"
				disabled={loading || page >= Math.max(1, Math.ceil((cache[sort].total ?? 0) / PAGE_SIZE))}
				onclick={() => goTo(page + 1)}
			>
				Next →
			</button>
		</div>
	{/if}

	<div
		class="mt-10 rounded-xl border border-gray-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
	>
		<h2 class="text-xl font-semibold">Leave a review</h2>
		<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
			Provide the email or phone used for a past appointment.
		</p>

		<form
			class="mt-4 grid gap-4"
			onsubmit={async (e) => {
				e.preventDefault();
				const form = e.currentTarget as HTMLFormElement;
				const fd = new FormData(form);

				const payload = {
					TypeOfMassage: String(fd.get('type') ?? ''),
					Rating: Number(fd.get('rating') ?? 0),
					Comments: String(fd.get('comments') ?? ''),
					contact: String(fd.get('contact') ?? '')
				};

				loading = true;
				try {
					const r = await fetch('/api/reviews', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify(payload)
					});
					if (!r.ok) throw new Error(await r.text());

					form.reset();

					cache.newest = { pages: {}, total: null, fetchedAt: 0 };
					sort = 'newest';
					page = 1;
					total = null;
					await fetchPage(1, 'newest', true);
					goto(`/reviews?page=1&sort=newest`, {
						replaceState: true,
						keepFocus: true,
						noScroll: true
					});

					showSuccess('Thanks for your review! It has been submitted successfully.');
				} catch (err: any) {
					showError(err?.message || 'Failed to submit review.');
				} finally {
					loading = false;
				}
			}}
		>
			<div class="grid gap-1">
				<label for="type" class="text-sm font-medium">Type of massage</label>
				<input
					id="type"
					name="type"
					required
					placeholder="e.g., Deep Tissue"
					class="rounded-lg border border-gray-300 bg-white px-3 py-2
                 text-gray-900 outline-none
                 focus:ring-2 focus:ring-gray-300
                 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
				/>
			</div>

			<div class="grid gap-1">
				<label for="rating" class="text-sm font-medium">Rating</label>
				<select
					id="rating"
					name="rating"
					required
					class="rounded-lg border border-gray-300 bg-white px-3 py-2
                 text-gray-900 outline-none
                 focus:ring-2 focus:ring-gray-300
                 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
				>
					<option value="" disabled selected>Select</option>
					<option value="5">★★★★★ — 5</option>
					<option value="4">★★★★☆ — 4</option>
					<option value="3">★★★☆☆ — 3</option>
					<option value="2">★★☆☆☆ — 2</option>
					<option value="1">★☆☆☆☆ — 1</option>
				</select>
			</div>

			<div class="grid gap-1">
				<label for="comments" class="text-sm font-medium">Comments (optional)</label>
				<textarea
					id="comments"
					name="comments"
					rows="4"
					class="rounded-lg border border-gray-300 bg-white px-3 py-2
                 text-gray-900 outline-none
                 focus:ring-2 focus:ring-gray-300
                 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
					placeholder="Share your experience..."
				></textarea>
			</div>

			<div class="grid gap-1">
				<label for="contact" class="text-sm font-medium">Email or phone (required)</label>
				<input
					id="contact"
					name="contact"
					required
					class="rounded-lg border border-gray-300 bg-white px-3 py-2
                 text-gray-900 outline-none
                 focus:ring-2 focus:ring-gray-300
                 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
					placeholder="you@example.com or (555) 555-5555"
				/>
			</div>

			<div class="flex items-center gap-3">
				<button
					class="rounded-xl border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50
                 dark:border-zinc-700 dark:hover:bg-zinc-800"
					type="submit"
					disabled={loading}
				>
					{loading ? 'Submitting…' : 'Submit review'}
				</button>
			</div>
		</form>
	</div>
</section>

<!-- Error Dialog -->
{#if errorOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<button
			type="button"
			class="absolute inset-0 cursor-default bg-black/40"
			aria-label="Close error overlay"
			onclick={() => {
				errorOpen = false;
			}}
		></button>

		<div
			role="dialog"
			aria-modal="true"
			class="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl
             dark:bg-zinc-900 dark:text-gray-100"
		>
			<h3 class="text-lg font-semibold text-red-700 dark:text-red-400">Something went wrong</h3>
			<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">{errorText}</p>
			<div class="mt-4 flex justify-end gap-2">
				<button
					class="rounded-lg border border-gray-300 px-4 py-2 text-sm
                 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => {
						errorOpen = false;
					}}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Success Dialog -->
{#if successOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<button
			type="button"
			class="absolute inset-0 cursor-default bg-black/40"
			aria-label="Close success overlay"
			onclick={() => {
				successOpen = false;
			}}
		></button>
		<div
			role="dialog"
			aria-modal="true"
			class="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl
             dark:bg-zinc-900 dark:text-gray-100"
		>
			<h3 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Review submitted</h3>
			<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">{successText}</p>
			<div class="mt-4 flex justify-end gap-2">
				<button
					class="rounded-lg border border-gray-300 px-4 py-2 text-sm
                 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => {
						successOpen = false;
					}}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
