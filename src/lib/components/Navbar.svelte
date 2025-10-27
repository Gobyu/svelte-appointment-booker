<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';

	const props = $props<{
		orgName?: string;
		user?: App.Locals['user'];
	}>();

	const orgName = $derived(props.orgName ?? 'YourOrg');
	const user = $derived(props.user ?? null);

	const currentPath = $derived(page.url.pathname);
	const isActive = (href: string) => currentPath === href;

	let mobileOpen = $state(false);
	let theme = $state<'light' | 'dark'>(
		typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light'
	);

	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
		if (stored) theme = stored;
	}

	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', theme === 'dark');
			try {
				localStorage.setItem('theme', theme);
			} catch {}
		}
	});

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
	}

	async function logout() {
		try {
			await fetch('/auth/logout', { method: 'POST' });
		} catch {}
		await invalidateAll();
		await goto('/', { replaceState: true });
	}
</script>

<nav
	class="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-700 dark:bg-gray-900/90"
>
	<div class="mx-auto max-w-6xl px-4">
		<div class="flex h-14 items-center justify-between">
			<a
				href="/"
				class="font-semibold tracking-tight text-gray-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-gray-100"
			>
				{orgName}
			</a>

			<!-- Mobile menu toggle -->
			<button
				class="ml-2 inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none md:hidden dark:hover:bg-gray-800"
				aria-label="Toggle navigation"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					{#if mobileOpen}
						<path
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M6 18L18 6M6 6l12 12"
						/>
					{:else}
						<path
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 6h18M3 12h18M3 18h18"
						/>
					{/if}
				</svg>
			</button>

			<!-- Desktop links -->
			<ul class="hidden items-center gap-6 md:flex">
				<li>
					<a
						href="/about"
						class="rounded px-1 py-1 text-gray-700 transition hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-gray-300 dark:hover:text-gray-100"
						class:font-semibold={isActive('/about')}
						aria-current={isActive('/about') ? 'page' : undefined}>About</a
					>
				</li>
				<li>
					<a
						href="/reviews"
						class="rounded px-1 py-1 text-gray-700 transition hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-gray-300 dark:hover:text-gray-100"
						class:font-semibold={isActive('/reviews')}
						aria-current={isActive('/reviews') ? 'page' : undefined}>Reviews</a
					>
				</li>
				<li>
					<a
						href="/BookAppointment"
						class="rounded px-1 py-1 text-gray-700 transition hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-gray-300 dark:hover:text-gray-100"
						class:font-semibold={isActive('/BookAppointment')}
						aria-current={isActive('/BookAppointment') ? 'page' : undefined}>Book appointment</a
					>
				</li>

				{#if user?.role === 'admin'}
					<li>
						<a
							href="/manage"
							class="rounded px-1 py-1 text-gray-700 transition hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-gray-300 dark:hover:text-gray-100"
							class:font-semibold={isActive('/manage')}
							aria-current={isActive('/manage') ? 'page' : undefined}>Manage</a
						>
					</li>
				{/if}
			</ul>

			<!-- Right side controls -->
			<div class="flex items-center gap-3">
				{#if user}
					<button
						type="button"
						class="rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
						onclick={logout}
					>
						Log out
					</button>
				{:else}
					<a
						href="/login"
						class="rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
					>
						Log in
					</a>
				{/if}

				<!-- Theme toggle -->
				<button
					type="button"
					aria-label="Toggle theme"
					title="Toggle theme"
					class="rounded-full border border-gray-300 p-2 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-gray-600 dark:hover:bg-gray-800"
					onclick={toggleTheme}
				>
					{#if theme === 'light'}
						<!-- Moon Icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-gray-700"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 12.79A9 9 0 0112.21 3a7 7 0 109.58 9.79z"
							/>
						</svg>
					{:else}
						<!-- Sun Icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-yellow-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 3v1m0 16v1m8.485-8.485h1M4.515 12.515h1m12.02 7.071l.707.707M6.757 6.757l.707.707m12.02-7.071l.707.707M6.757 17.243l.707.707M12 5a7 7 0 100 14 7 7 0 000-14z"
							/>
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile dropdown -->
	{#if mobileOpen}
		<div class="border-t border-gray-200 md:hidden dark:border-gray-700">
			<ul class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
				<li>
					<a
						href="/about"
						class="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-gray-100 dark:hover:bg-gray-800"
						onclick={() => (mobileOpen = false)}>About</a
					>
				</li>
				<li>
					<a
						href="/reviews"
						class="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-gray-100 dark:hover:bg-gray-800"
						onclick={() => (mobileOpen = false)}>Reviews</a
					>
				</li>
				<li>
					<a
						href="/BookAppointment"
						class="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-gray-100 dark:hover:bg-gray-800"
						onclick={() => (mobileOpen = false)}>Book appointment</a
					>
				</li>

				{#if user?.role === 'admin'}
					<li>
						<a
							href="/manage"
							class="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-gray-100 dark:hover:bg-gray-800"
							onclick={() => (mobileOpen = false)}>Manage</a
						>
					</li>
				{/if}

				<li class="mt-1 flex items-center justify-between">
					{#if user}
						<button
							type="button"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
							onclick={async () => {
								await logout();
								mobileOpen = false;
							}}
						>
							Log out
						</button>
					{:else}
						<a
							href="/login"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
							onclick={() => (mobileOpen = false)}
						>
							Log in
						</a>
					{/if}
				</li>
			</ul>
		</div>
	{/if}
</nav>
