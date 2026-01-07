<!-- src/routes/farm/contact/+page.svelte -->
<script lang="ts">
	const scrollToId = (id: string) => {
		if (typeof document === 'undefined') return;
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};
</script>

<section class="mx-auto max-w-6xl px-4 py-10">
	<!-- HEADER -->
	<div class="grid items-center gap-8 md:grid-cols-2">
		<!-- Image left -->
		<div
			class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<img
				src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1400&q=80"
				alt="Farm fields and produce"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="eager"
			/>
		</div>

		<!-- Text right -->
		<div>
			<p
				class="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200"
			>
				Contact • Pickup • Orders
			</p>
			<h1 class="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Contact us</h1>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				Questions about availability, pickup times, CSA boxes, or special orders? Reach out anytime
				— we’ll get back quickly.
			</p>

			<div class="mt-6 flex flex-wrap gap-3">
				<button
					class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
					onclick={() => scrollToId('message')}
				>
					Send a message
				</button>
				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('details')}
				>
					Contact details
				</button>
			</div>

			<div class="mt-6 grid gap-3 sm:grid-cols-3" id="details">
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Phone</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">(555) 123-4567</p>
				</div>
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Email</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">farm@example.com</p>
				</div>
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Pickup address</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">123 Country Rd, Toronto, ON</p>
				</div>
			</div>
		</div>
	</div>

	<!-- MESSAGE + HOURS -->
	<div id="message" class="mt-14 grid scroll-mt-24 items-start gap-8 md:grid-cols-2">
		<!-- Form -->
		<div
			class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<h2 class="text-2xl font-bold tracking-tight">Send a message</h2>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
				Include what you’re looking for and your preferred pickup day/time.
			</p>

			<form class="mt-6 grid gap-4" onsubmit={(e) => e.preventDefault()}>
				<div class="grid gap-2">
					<label class="text-sm font-semibold" for="name">Name</label>
					<input
						id="name"
						name="name"
						type="text"
						autocomplete="name"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60 dark:border-zinc-700 dark:bg-zinc-950"
						placeholder="Your name"
					/>
				</div>

				<div class="grid gap-2 sm:grid-cols-2">
					<div class="grid gap-2">
						<label class="text-sm font-semibold" for="email">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60 dark:border-zinc-700 dark:bg-zinc-950"
							placeholder="you@example.com"
						/>
					</div>

					<div class="grid gap-2">
						<label class="text-sm font-semibold" for="phone">Phone (optional)</label>
						<input
							id="phone"
							name="phone"
							type="tel"
							autocomplete="tel"
							class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60 dark:border-zinc-700 dark:bg-zinc-950"
							placeholder="(555) 123-4567"
						/>
					</div>
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold" for="topic">What is this about?</label>
					<select
						id="topic"
						name="topic"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60 dark:border-zinc-700 dark:bg-zinc-950"
					>
						<option>Availability / what’s in season</option>
						<option>CSA / bundles</option>
						<option>Bulk / special order</option>
						<option>Pickup times</option>
						<option>Other</option>
					</select>
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold" for="messageText">Message</label>
					<textarea
						id="messageText"
						name="message"
						rows="5"
						class="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60 dark:border-zinc-700 dark:bg-zinc-950"
						placeholder="Tell us what you’re looking for (items, quantity, pickup preference)..."
					></textarea>
				</div>

				<div class="flex flex-wrap gap-3 pt-2">
					<button
						type="submit"
						class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
					>
						Send (wire up later)
					</button>
					<a
						href="/farm/products_services"
						class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					>
						View products/services
					</a>
				</div>

				<p class="text-xs text-gray-500 dark:text-gray-400">
					This form is UI-only (no backend yet). When you’re ready, connect it to an endpoint or
					email service.
				</p>
			</form>
		</div>

		<!-- Hours + pickup info -->
		<div class="grid gap-3">
			<div
				class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
			>
				<h2 class="text-2xl font-bold tracking-tight">Pickup hours</h2>
				<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
					Confirm times before coming — weather and harvest can shift the schedule.
				</p>

				<div class="mt-5 grid gap-3">
					<div
						class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
					>
						<p class="font-semibold">Weekdays</p>
						<p class="mt-1 text-gray-600 dark:text-gray-300">4:00 PM – 7:00 PM</p>
					</div>
					<div
						class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
					>
						<p class="font-semibold">Weekends</p>
						<p class="mt-1 text-gray-600 dark:text-gray-300">10:00 AM – 2:00 PM</p>
					</div>
					<div
						class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
					>
						<p class="font-semibold">Note</p>
						<p class="mt-1 text-gray-600 dark:text-gray-300">
							Some items sell out quickly — message us to reserve.
						</p>
					</div>
				</div>
			</div>

			<div
				class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
			>
				<img
					src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=80"
					alt="Farm stand"
					class="h-[240px] w-full object-cover md:h-[320px]"
					loading="lazy"
				/>
			</div>
		</div>
	</div>

	<!-- Footer strip -->
	<div
		class="mt-14 rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
	>
		<p class="text-lg font-semibold">We’ll help you find what’s fresh.</p>
		<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
			Send a quick note and we’ll share today’s availability and pickup options.
		</p>
		<div class="mt-4 flex justify-center">
			<button
				class="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
				onclick={() => scrollToId('message')}
			>
				Send a message
			</button>
		</div>
	</div>
</section>
