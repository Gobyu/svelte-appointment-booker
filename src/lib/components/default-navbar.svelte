<script lang="ts">
	import { page } from '$app/state';

	const props = $props<{ orgName?: string }>();
	const orgName = $derived(props.orgName ?? 'YourOrg');

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
</script>

<nav
	class="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-700 dark:bg-gray-900/90"
>
	<div class="mx-auto max-w-6xl px-4">
		<div class="flex h-14 items-center justify-between">
			<a
				href="/"
				class="text-xl font-bold tracking-tight text-gray-900 transition hover:scale-110 hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400"
			>
				{orgName}
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
					href="/about"
					class="rounded-xl px-4 py-2 text-sm font-medium text-gray-800 transition hover:scale-110 hover:text-indigo-700 dark:text-gray-100 dark:hover:text-indigo-400"
					class:font-semibold={isActive('/about')}
					aria-current={isActive('/about') ? 'page' : undefined}
				>
					About
				</a>
			</div>

			<button
				type="button"
				aria-label="Toggle theme"
				title="Toggle theme"
				class="grid h-10 w-10 place-items-center rounded-full text-lg leading-none transition hover:scale-110"
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

	{#if mobileOpen}
		<div class="border-t border-gray-200 md:hidden dark:border-gray-700">
			<ul class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
				<li>
					<a
						href="/about"
						class="rounded-lg px-2 py-1.5 text-gray-700 transition hover:scale-110 hover:text-indigo-700 dark:text-gray-300 dark:hover:text-indigo-400"
						onclick={() => (mobileOpen = false)}
					>
						About
					</a>
				</li>
			</ul>
		</div>
	{/if}
</nav>
