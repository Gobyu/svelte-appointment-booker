<!-- src/routes/farm/home/+page.svelte -->
<script lang="ts">
	const go = (path: string) => {
		if (typeof window !== 'undefined') window.location.href = path;
	};

	const scrollToId = (id: string) => {
		if (typeof document === 'undefined') return;
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};
</script>

<section class="mx-auto max-w-6xl px-4 py-10">
	<!-- HERO / INTRO -->
	<div class="grid items-center gap-8 md:grid-cols-2">
		<!-- Image left -->
		<div
			class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<img
				src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80"
				alt="Green farm fields"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="eager"
			/>
		</div>

		<!-- Text right -->
		<div>
			<p
				class="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200"
			>
				Fresh • Local • Seasonal
			</p>
			<h1 class="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
				From our fields to your table — grown with care.
			</h1>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				Discover what’s in season, explore farm-fresh products, and get updates on pickups and
				availability. Simple, local, and family-run.
			</p>

			<div class="mt-6 flex flex-wrap gap-3">
				<button
					class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
					onclick={() => go('/farm/products_services')}
				>
					Shop & services
				</button>
				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('seasonal')}
				>
					What’s in season
				</button>
			</div>

			<div class="mt-6 grid gap-3 sm:grid-cols-3">
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Local & fresh</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">Harvested close to home.</p>
				</div>
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Seasonal picks</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">Rotating crops, always changing.</p>
				</div>
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Easy pickup</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">Clear hours and updates.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- STORY / ABOUT -->
	<div class="mt-14 grid items-center gap-8 md:grid-cols-2">
		<!-- Text left -->
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Meet the farm</h2>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				We’re a family-run farm focused on quality and community. From planting to harvest, we keep
				it simple: grow good food, take care of the land, and share seasonal abundance with our
				neighbors.
			</p>

			<ul class="mt-5 grid gap-3">
				<li class="flex gap-3">
					<span
						class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
						>✓</span
					>
					<p class="text-gray-700 dark:text-gray-200">
						<strong>Small-batch growing:</strong> quality-first harvests, not mass production.
					</p>
				</li>
				<li class="flex gap-3">
					<span
						class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
						>✓</span
					>
					<p class="text-gray-700 dark:text-gray-200">
						<strong>Season-led:</strong> we grow what thrives naturally each season.
					</p>
				</li>
				<li class="flex gap-3">
					<span
						class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
						>✓</span
					>
					<p class="text-gray-700 dark:text-gray-200">
						<strong>Community-friendly:</strong> clear pickup options and local availability.
					</p>
				</li>
			</ul>

			<div class="mt-6 flex flex-wrap gap-3">
				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => go('/farm/about')}
				>
					Learn more
				</button>
				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('contact')}
				>
					Contact us
				</button>
			</div>
		</div>

		<!-- Image right -->
		<div
			class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<img
				src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1400&q=80"
				alt="Farmer holding fresh produce"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="lazy"
			/>
		</div>
	</div>

	<!-- SEASONAL -->
	<div id="seasonal" class="mt-14 grid scroll-mt-24 items-center gap-8 md:grid-cols-2">
		<!-- Image left -->
		<div
			class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<img
				src="https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?auto=format&fit=crop&w=1400&q=80"
				alt="Seasonal vegetables"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="lazy"
			/>
		</div>

		<!-- Text right -->
		<div>
			<h2 class="text-3xl font-bold tracking-tight">What’s in season</h2>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				Availability changes weekly. Here’s a typical seasonal lineup — check products for current
				stock and pickup options.
			</p>

			<div class="mt-5 grid gap-3 sm:grid-cols-2">
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Fresh produce</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Greens, roots, and seasonal favorites.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">Weekly rotation</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Farm eggs</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Small-batch, local pickup only.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">Limited quantities</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Honey & preserves</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Seasonal jars and pantry staples.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">While supplies last</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">CSA / bundles</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Weekly boxes with seasonal variety.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">Pickup schedule</p>
				</div>
			</div>

			<div class="mt-6 flex flex-wrap gap-3">
				<button
					class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
					onclick={() => go('/farm/products_services')}
				>
					View products/services
				</button>
				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('contact')}
				>
					Contact
				</button>
			</div>
		</div>
	</div>

	<!-- CONTACT -->
	<div id="contact" class="mt-14 grid scroll-mt-24 items-center gap-8 md:grid-cols-2">
		<!-- Text left -->
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Contact</h2>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				Questions about availability, pickup times, special orders, or accessibility? Reach out —
				we’ll respond quickly.
			</p>

			<div class="mt-5 grid gap-3">
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="text-sm font-semibold">Phone</p>
					<p class="mt-1 text-sm text-gray-700 dark:text-gray-200">(555) 123-4567</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="text-sm font-semibold">Email</p>
					<p class="mt-1 text-sm text-gray-700 dark:text-gray-200">farm@example.com</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="text-sm font-semibold">Pickup address</p>
					<p class="mt-1 text-sm text-gray-700 dark:text-gray-200">123 Country Rd, Toronto, ON</p>
				</div>
			</div>

			<div class="mt-6 flex flex-wrap gap-3">
				<button
					class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
					onclick={() => go('/farm/contact')}
				>
					Message us
				</button>
				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('seasonal')}
				>
					View seasonal list
				</button>
			</div>
		</div>

		<!-- Image right -->
		<div
			class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<img
				src="https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1400&q=80"
				alt="Farm stand with produce"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="lazy"
			/>
		</div>
	</div>

	<!-- Footer strip -->
	<div
		class="mt-14 rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
	>
		<p class="text-lg font-semibold">Fresh updates, simple pickup.</p>
		<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
			Check availability and browse products/services in seconds.
		</p>
		<div class="mt-4 flex justify-center">
			<button
				class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
				onclick={() => go('/farm/products_services')}
			>
				Shop now
			</button>
		</div>
	</div>
</section>
