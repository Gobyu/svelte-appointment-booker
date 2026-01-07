<!-- src/routes/farm/products_services/+page.svelte -->
<script lang="ts">
	const scrollToId = (id: string) => {
		if (typeof document === 'undefined') return;
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};
</script>

<section class="mx-auto max-w-6xl px-4 py-10">
	<!-- HEADER -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p
				class="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200"
			>
				Products • Services • Seasonal
			</p>
			<h1 class="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Products & Services</h1>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				Browse what we offer and how to get it. Availability changes with the season — contact us
				for current stock and pickup times.
			</p>
		</div>

		<div class="flex flex-wrap gap-3">
			<button
				class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
				onclick={() => scrollToId('products')}
			>
				Products
			</button>
			<button
				class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
				onclick={() => scrollToId('services')}
			>
				Services
			</button>
		</div>
	</div>

	<!-- QUICK INFO CARDS -->
	<div class="mt-8 grid gap-3 sm:grid-cols-3">
		<div
			class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<p class="font-semibold">Pickup options</p>
			<p class="mt-1 text-gray-600 dark:text-gray-300">Farm pickup + seasonal pop-ups.</p>
		</div>
		<div
			class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<p class="font-semibold">Availability</p>
			<p class="mt-1 text-gray-600 dark:text-gray-300">Rotates weekly with harvest.</p>
		</div>
		<div
			class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<p class="font-semibold">Questions?</p>
			<p class="mt-1 text-gray-600 dark:text-gray-300">We’re happy to help with orders.</p>
		</div>
	</div>

	<!-- PRODUCTS -->
	<div id="products" class="mt-14 grid scroll-mt-24 items-center gap-8 md:grid-cols-2">
		<!-- Image left -->
		<div
			class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<img
				src="https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?auto=format&fit=crop&w=1400&q=80"
				alt="Fresh produce"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="eager"
			/>
		</div>

		<!-- Text right -->
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Products</h2>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				Seasonal, local, and harvested with care. Some items are limited — reach out for today’s
				list.
			</p>

			<div class="mt-5 grid gap-3 sm:grid-cols-2">
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Fresh Produce</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Greens, roots, and seasonal staples.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">Weekly harvest</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Eggs</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Local pickup only. Limited runs.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">While available</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Honey & Preserves</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Honey, jams, and seasonal jars.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">Small-batch</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">CSA / Bundles</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Weekly boxes with seasonal variety.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">Pickup schedule</p>
				</div>
			</div>

			<div class="mt-6 flex flex-wrap gap-3">
				<a
					href="/farm/contact"
					class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
				>
					Ask about availability
				</a>
				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('services')}
				>
					See services
				</button>
			</div>
		</div>
	</div>

	<!-- SERVICES -->
	<div id="services" class="mt-14 grid scroll-mt-24 items-center gap-8 md:grid-cols-2">
		<!-- Text left -->
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Services</h2>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				Beyond products, we offer a few helpful ways to make pickup easy and keep you stocked
				through the season.
			</p>

			<div class="mt-5 grid gap-3 sm:grid-cols-2">
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Farm Pickup</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Pre-arranged pickup windows at the farm.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">By schedule</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">CSA Membership</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Weekly box program for seasonal variety.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">Weekly / bi-weekly</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Custom Bundles</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Tell us what you like — we’ll pack it.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">By request</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Bulk Orders</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Great for events, families, and meal prep.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">Lead time may apply</p>
				</div>
			</div>

			<div class="mt-6 flex flex-wrap gap-3">
				<a
					href="/farm/contact"
					class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
				>
					Contact us
				</a>
				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('products')}
				>
					Back to products
				</button>
			</div>
		</div>

		<!-- Image right -->
		<div
			class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<img
				src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1400&q=80"
				alt="Farmer's market produce"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="lazy"
			/>
		</div>
	</div>

	<!-- FOOTER STRIP -->
	<div
		class="mt-14 rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
	>
		<p class="text-lg font-semibold">Want today’s availability?</p>
		<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
			Message us and we’ll share what’s ready for pickup.
		</p>
		<div class="mt-4 flex justify-center">
			<a
				href="/farm/contact"
				class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
			>
				Contact
			</a>
		</div>
	</div>
</section>
