<script lang="ts">
	import { page } from '$app/state';
	import * as message from '$lib/paraglide/messages';
	import { deLocalizeUrl, setLocale, getLocale, locales } from '$lib/paraglide/runtime';

	const props = $props<{ orgName?: string }>();
	const orgName = $derived(props.orgName ?? 'YourOrg');

	// Use the *de-localized* path for active-link checks (works across /en/... /fr/... etc.)
	const basePath = $derived(deLocalizeUrl(page.url).pathname);
	const isActive = (href: string) => basePath === href;

	// --- Language dropdown ---
	let langOpen = $state(false);
	let langMenuEl = $state<HTMLElement | null>(null);

	// Current locale (Paraglide resolves it based on your strategy)
	const currentLocale = $derived(getLocale());

	// Labels you want
	const localeLabel: Record<string, string> = {
		en: 'EN',
		fr: 'FR',
		'zh-Hans': '简体中文',
		'zh-Hant': '繁体中文'
	};

	// Only show locales that are actually configured in Paraglide (from `locales`)
	const langOptions = $derived(
		locales.map((l) => ({
			locale: l,
			label: localeLabel[l] ?? l.toUpperCase()
		}))
	);

	$effect(() => {
		if (typeof document === 'undefined') return;
		if (!langOpen) return;

		const onClick = (e: MouseEvent) => {
			const t = e.target;
			if (t instanceof Node && langMenuEl && !langMenuEl.contains(t)) langOpen = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') langOpen = false;
		};

		document.addEventListener('mousedown', onClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onClick);
			document.removeEventListener('keydown', onKey);
		};
	});

	// --- your existing state ---
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
				{message.orgName()}
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
					{message.aboutAsPlainText()}
				</a>
			</div>
			<div class="flex items-center gap-2">
				<!-- Language dropdown -->
				<div class="relative" bind:this={langMenuEl}>
					<button
						type="button"
						class="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur transition hover:scale-110 hover:bg-white dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-100"
						aria-label="Change language"
						aria-haspopup="menu"
						aria-expanded={langOpen}
						onclick={() => (langOpen = !langOpen)}
					>
						<span>{localeLabel[currentLocale] ?? currentLocale.toUpperCase()}</span>
						<svg
							class="h-4 w-4 opacity-70"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								fill-rule="evenodd"
								d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>

					{#if langOpen}
						<div
							role="menu"
							class="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
						>
							<div class="py-1">
								{#each langOptions as opt}
									<button
										type="button"
										class="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800"
										onclick={() => {
											langOpen = false;
											setLocale(opt.locale);
										}}
									>
										<span>{opt.label}</span>
										{#if opt.locale === getLocale()}
											<span class="text-xs opacity-70">✓</span>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{/if}
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
