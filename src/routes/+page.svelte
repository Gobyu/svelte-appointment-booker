<script lang="ts">
	import { onMount } from 'svelte';
	import * as message from '$lib/paraglide/messages';
	import { locales, getLocale } from '$lib/paraglide/runtime';

	console.log('locales:', locales);
	console.log('locale now:', getLocale());

	type CardKey = 'massage' | 'farm' | null;

	let openCard: CardKey = null;
	let isTouchLike = false;

	onMount(() => {
		const mq = window.matchMedia('(hover: none), (pointer: coarse)');
		const sync = () => (isTouchLike = mq.matches);
		sync();
		mq.addEventListener?.('change', sync);
		return () => mq.removeEventListener?.('change', sync);
	});

	function handleCardClick(e: MouseEvent, key: Exclude<CardKey, null>) {
		if (!isTouchLike) return;
		if (openCard !== key) {
			e.preventDefault();
			openCard = key;
		}
	}
</script>

<svelte:head>
	<title>{message.orgName()}</title>
	<meta name="description" content="Choose a destination: Massage or Farm." />
</svelte:head>

<main class="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
	<!-- Background glows -->
	<div class="pointer-events-none fixed inset-0 -z-10">
		<div
			class="absolute -top-24 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20"
		></div>
		<div
			class="absolute right-[-10rem] bottom-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15"
		></div>
		<div
			class="absolute bottom-24 left-[-8rem] h-72 w-72 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/10"
		></div>
	</div>

	<div class="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10 sm:px-6">
		<header class="flex items-center gap-4">
			<div
				class="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-slate-50 font-extrabold tracking-wide text-slate-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
				aria-hidden="true"
			>
				{message.orgAbbreviation()}
			</div>

			<div>
				<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{message.orgName()}</h1>
			</div>
		</header>

		<section class="mt-8 grid items-start gap-4 sm:grid-cols-2" aria-label="Destinations">
			<!-- Massage Card -->
			<a
				href="/massage/home"
				style="background-image: url('/images/massage_card_bg.jpg');"
				class="group/massage relative overflow-hidden rounded-3xl bg-cover bg-center p-6 shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
				aria-expanded={openCard === 'massage'}
				aria-controls="massage-details"
				onclick={(e) => handleCardClick(e, 'massage')}
			>
				<!-- Overlay (uses group hover, not hover: on itself) -->
				<div
					class="pointer-events-none absolute -inset-px bg-black/50 transition group-hover/massage:bg-black/30"
				></div>

				<!-- Indigo glow -->
				<div class="absolute inset-0 opacity-0 transition group-hover/massage:opacity-100">
					<div
						class="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20"
					></div>
				</div>

				<div class="relative text-white">
					<h2 class="mt-4 text-xl font-semibold">{message.homeMassageCardTitle()}</h2>
					<p class="mt-2 text-sm leading-relaxed">{message.homeMassageCardShortDesc()}</p>

					<!-- Expanding details -->
					<div
						id="massage-details"
						class="mt-3 max-h-0 overflow-hidden opacity-0 transition-all duration-300 ease-out
							group-focus-within/massage:max-h-28 group-focus-within/massage:opacity-100
							group-hover/massage:max-h-28 group-hover/massage:opacity-100
							{openCard === 'massage' ? 'max-h-28 opacity-100' : ''}"
					>
						<p class="text-sm leading-relaxed">{message.homeMassageCardLongDesc()}</p>
					</div>

					<div class="mt-6 flex items-center justify-between border-t border-white/50 pt-4">
						<span class="text-sm font-medium">{message.homeMassageCardGoToText()}</span>
						<span class="text-lg transition group-hover/massage:translate-x-0.5">→</span>
					</div>
				</div>
			</a>

			<!-- Farm Card -->
			<a
				href="/farm/home"
				style="background-image: url('/images/farm_card_bg_2.jpg');"
				class="group/farm relative overflow-hidden rounded-3xl bg-cover bg-center p-6 shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
				aria-expanded={openCard === 'farm'}
				aria-controls="farm-details"
				onclick={(e) => handleCardClick(e, 'farm')}
			>
				<!-- Overlay -->
				<div class="pointer-events-none absolute -inset-px bg-black/30"></div>

				<!-- Emerald glow -->
				<div class="absolute inset-0 opacity-0 transition group-hover/farm:opacity-100">
					<div
						class="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/20"
					></div>
				</div>

				<div class="relative text-white">
					<h2 class="mt-4 text-xl font-semibold">{message.homeFarmCardTitle()}</h2>
					<p class="mt-2 text-sm leading-relaxed">
						{message.homeFarmCardShortDesc()}
					</p>

					<!-- Expanding details -->
					<div
						id="farm-details"
						class="mt-3 max-h-0 overflow-hidden opacity-0 transition-all duration-300 ease-out
							group-focus-within/farm:max-h-28 group-focus-within/farm:opacity-100
							group-hover/farm:max-h-28 group-hover/farm:opacity-100
							{openCard === 'farm' ? 'max-h-28 opacity-100' : ''}"
					>
						<p class="text-sm leading-relaxed">
							{message.homeFarmCardLongDesc()}
						</p>
					</div>

					<div class="mt-6 flex items-center justify-between border-t border-white/50 pt-4">
						<span class="text-sm font-medium">{message.homeFarmCardGoToText()}</span>
						<span class="text-lg transition group-hover/farm:translate-x-0.5">→</span>
					</div>
				</div>
			</a>
		</section>

		<footer class="mt-auto pt-10 text-xs text-slate-500 dark:text-slate-400">
			© {new Date().getFullYear()} Happy Family
		</footer>
	</div>
</main>
