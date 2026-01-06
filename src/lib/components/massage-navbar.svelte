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
	const isFarmHome = $derived(currentPath === '/massage/home');

	const rightButtonHref = $derived(isFarmHome ? '/' : '/massage/home');
	const rightButtonLabel = $derived(isFarmHome ? '← Happy Family' : '← Happy Family Massage');

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
			await fetch('/massage/auth/logout', { method: 'POST' });
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
				href={rightButtonHref}
				class="text-xl font-bold tracking-tight text-gray-900 transition hover:scale-110
		hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400"
			>
				{rightButtonLabel}
			</a>

			<button
				class="ml-2 inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100 md:hidden dark:hover:bg-gray-800"
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

			<div class="hidden items-center gap-6 md:flex">
				<a
					href="/massage/about"
					class="rounded-xl px-4 py-2 text-sm font-medium text-gray-800
			transition
			hover:scale-110 hover:text-indigo-700
			dark:text-gray-100 dark:hover:text-indigo-400"
					class:font-semibold={isActive('/massage/about')}
					aria-current={isActive('/massage/about') ? 'page' : undefined}
				>
					About
				</a>

				<a
					href="/massage/reviews"
					class="rounded-xl px-4 py-2 text-sm font-medium text-gray-800
			transition
			hover:scale-110 hover:text-indigo-700
			dark:text-gray-100 dark:hover:text-indigo-400"
					class:font-semibold={isActive('/massage/reviews')}
					aria-current={isActive('/massage/reviews') ? 'page' : undefined}
				>
					Reviews
				</a>

				<a
					href="/massage/book-appointment"
					class="rounded-xl px-4 py-2 text-sm font-medium text-gray-800
			transition
			hover:scale-110 hover:text-indigo-700
			dark:text-gray-100 dark:hover:text-indigo-400"
					class:font-semibold={isActive('/massage/book-appointment')}
					aria-current={isActive('/massage/book-appointment') ? 'page' : undefined}
				>
					Book Appointment
				</a>

				{#if user?.role === 'admin'}
					<a
						href="/massage/manange"
						class="rounded-xl px-4 py-2 text-sm font-medium text-gray-800
				transition
				hover:scale-110 hover:text-indigo-700
				dark:text-gray-100 dark:hover:text-indigo-400"
						class:font-semibold={isActive('/massage/manange')}
						aria-current={isActive('/massage/manange') ? 'page' : undefined}
					>
						Manage
					</a>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				{#if user}
					<button
						type="button"
						class="rounded-xl px-4 py-2 text-sm font-medium text-gray-800
		transition
		hover:scale-110 hover:text-indigo-700
		dark:text-gray-100 dark:hover:text-indigo-400"
						onclick={logout}
					>
						Log out
					</button>
				{:else}
					<a
						href="/massage/login"
						class="rounded-xl px-4 py-2 text-sm font-medium text-gray-800
		transition
		hover:scale-110 hover:text-indigo-700
		dark:text-gray-100 dark:hover:text-indigo-400"
					>
						Log in
					</a>
				{/if}

				<button
					type="button"
					aria-label="Toggle theme"
					title="Toggle theme"
					class="grid h-10 w-10 place-items-center rounded-full
		text-lg leading-none
		transition
		hover:scale-110"
					onclick={toggleTheme}
				>
					{#if theme === 'light'}
						<span aria-hidden="true">🌙</span>
					{:else}
						<span aria-hidden="true">☀️</span>
					{/if}
				</button>
			</div>
		</div>
	</div>

	{#if mobileOpen}
		<div class="border-t border-gray-200 md:hidden dark:border-gray-700">
			<ul class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
				<li>
					<a
						href="/massage/about"
						class="rounded-lg px-2 py-1.5 text-gray-700 transition
	hover:scale-110 hover:text-indigo-700
	dark:text-gray-300 dark:hover:text-indigo-400"
						onclick={() => (mobileOpen = false)}>About</a
					>
				</li>
				<li>
					<a
						href="/massage/reviews"
						class="rounded-lg px-2 py-1.5 text-gray-700 transition
	hover:scale-110 hover:text-indigo-700
	dark:text-gray-300 dark:hover:text-indigo-400"
						onclick={() => (mobileOpen = false)}>Reviews</a
					>
				</li>
				<li>
					<a
						href="/massage/book-appointment"
						class="rounded-lg px-2 py-1.5 text-gray-700 transition
	hover:scale-110 hover:text-indigo-700
	dark:text-gray-300 dark:hover:text-indigo-400"
						onclick={() => (mobileOpen = false)}>Book Appointment</a
					>
				</li>

				{#if user?.role === 'admin'}
					<li>
						<a
							href="/massage/manange"
							class="rounded-lg px-2 py-1.5 text-gray-700 transition
	hover:scale-110 hover:text-indigo-700
	dark:text-gray-300 dark:hover:text-indigo-400"
							onclick={() => (mobileOpen = false)}>Manage</a
						>
					</li>
				{/if}

				<li class="mt-1 flex items-center justify-between">
					{#if user}
						<button
							type="button"
							class="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-gray-800
	transition
	hover:scale-110 hover:text-indigo-700
	dark:text-gray-100 dark:hover:text-indigo-400"
							onclick={async () => {
								await logout();
								mobileOpen = false;
							}}
						>
							Log out
						</button>
					{:else}
						<a
							href="/massage/login"
							class="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-gray-800
	transition
	hover:scale-110 hover:text-indigo-700
	dark:text-gray-100 dark:hover:text-indigo-400"
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
