<!-- src/routes/farm/about/+page.svelte -->
<script lang="ts">
	const scrollToId = (id: string) => {
		if (typeof document === 'undefined') return;
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};
</script>

<svelte:head>
	<title>About | Happy Family Farm</title>
	<meta
		name="description"
		content="Learn about Happy Family Farm—our story, values, and what we offer throughout the seasons."
	/>
</svelte:head>

<main class="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
	<section class="mx-auto max-w-6xl px-4 py-10">
		<!-- HERO -->
		<div class="grid items-center gap-8 md:grid-cols-2">
			<!-- Image -->
			<div
				class="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm dark:border-white/10 dark:bg-white/5"
			>
				<img
					src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1600&q=80"
					alt="Rows of crops in warm sunlight"
					class="h-[320px] w-full object-cover md:h-[440px]"
					loading="eager"
				/>
			</div>

			<!-- Text -->
			<div>
				<p
					class="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
				>
					Local • Seasonal • Family-run
				</p>

				<h1 class="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Happy Family Farm</h1>

				<p class="mt-3 max-w-prose text-slate-600 dark:text-slate-300">
					We’re a small family farm focused on fresh, seasonal food and simple, honest service.
					Whether you’re stopping by for produce, ordering a bundle, or booking a farm service, we
					keep it warm, straightforward, and local.
				</p>

				<div class="mt-6 flex flex-wrap gap-3">
					<a
						href="/farm/products_services"
						class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
					>
						Explore products & services
					</a>
					<button
						class="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
						onclick={() => scrollToId('values')}
					>
						Our values
					</button>
				</div>

				<div class="mt-6 grid gap-3 sm:grid-cols-3">
					<div
						class="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-white/10 dark:bg-white/5"
					>
						<p class="font-semibold">Season-first</p>
						<p class="mt-1 text-slate-600 dark:text-slate-300">
							We focus on what’s best right now.
						</p>
					</div>
					<div
						class="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-white/10 dark:bg-white/5"
					>
						<p class="font-semibold">Community-minded</p>
						<p class="mt-1 text-slate-600 dark:text-slate-300">
							Local customers, local relationships.
						</p>
					</div>
					<div
						class="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-white/10 dark:bg-white/5"
					>
						<p class="font-semibold">Simple & transparent</p>
						<p class="mt-1 text-slate-600 dark:text-slate-300">
							Clear info, fair pricing, no fuss.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- STORY -->
		<div class="mt-14 grid items-center gap-8 md:grid-cols-2">
			<!-- Text -->
			<div>
				<h2 class="text-3xl font-bold tracking-tight">Our story</h2>
				<p class="mt-3 max-w-prose text-slate-600 dark:text-slate-300">
					Happy Family Farm started with a simple goal: grow good food and make it easy for families
					to get it. We built our farm around consistency, kindness, and quality—so you can feel
					good about what you’re bringing home.
				</p>

				<ul class="mt-5 grid gap-3">
					<li class="flex gap-3">
						<span
							class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
							>✓</span
						>
						<p class="text-slate-700 dark:text-slate-200">
							<strong>Family-run:</strong> hands-on care in everything we do.
						</p>
					</li>
					<li class="flex gap-3">
						<span
							class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
							>✓</span
						>
						<p class="text-slate-700 dark:text-slate-200">
							<strong>Quality first:</strong> we’d only sell what we’d buy ourselves.
						</p>
					</li>
					<li class="flex gap-3">
						<span
							class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
							>✓</span
						>
						<p class="text-slate-700 dark:text-slate-200">
							<strong>Customer-friendly:</strong> clear availability, easy pickup, helpful updates.
						</p>
					</li>
				</ul>
			</div>

			<!-- Image -->
			<div
				class="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm dark:border-white/10 dark:bg-white/5"
			>
				<img
					src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80"
					alt="Hands holding fresh vegetables"
					class="h-[320px] w-full object-cover md:h-[440px]"
					loading="lazy"
				/>
			</div>
		</div>

		<!-- VALUES -->
		<div id="values" class="mt-14 scroll-mt-24">
			<h2 class="text-3xl font-bold tracking-tight">What we care about</h2>
			<p class="mt-3 max-w-prose text-slate-600 dark:text-slate-300">
				We keep our focus tight: great seasonal offerings, reliable info, and a smooth experience.
			</p>

			<div class="mt-6 grid gap-4 md:grid-cols-3">
				<div
					class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
				>
					<p class="text-lg font-semibold">Freshness</p>
					<p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
						We prioritize quality and harvest timing so products show up at their best.
					</p>
				</div>

				<div
					class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
				>
					<p class="text-lg font-semibold">Seasonality</p>
					<p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
						Our availability changes with the season—so you always know what’s real and ready.
					</p>
				</div>

				<div
					class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
				>
					<p class="text-lg font-semibold">Community</p>
					<p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
						We love serving local families and building long-term relationships.
					</p>
				</div>
			</div>
		</div>

		<!-- CTA -->
		<div
			class="mt-14 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/5"
		>
			<p class="text-lg font-semibold">Want to see what’s available right now?</p>
			<p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
				Browse current offerings, seasonal updates, and services.
			</p>
			<div class="mt-4 flex justify-center gap-3">
				<a
					href="/farm/products_services"
					class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
				>
					View products & services
				</a>
				<a
					href="/farm/contact"
					class="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
				>
					Contact us
				</a>
			</div>
		</div>
	</section>
</main>
