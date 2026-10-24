<!-- src/routes/+page.svelte -->
<script lang="ts">
	import * as message from '$lib/paraglide/messages';
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
				src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1400&q=80"
				alt="Massage and wellness"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="eager"
			/>
		</div>

		<!-- Text right -->
		<div>
			<h1 class="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
				{message.farmHomeSectionOneHeader()}
			</h1>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				{message.farmHomeSectionOneDesc()}
			</p>

			<div class="mt-6 flex flex-wrap gap-3">
				<button
					class="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
					onclick={() => go('/massage/book-appointment')}
				>
					{message.getStartedAsPlainText()}
				</button>
				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('services')}
				>
					{message.servicesAsPlainText()}
				</button>
			</div>

			<div class="mt-6 grid gap-3 sm:grid-cols-3">
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">{message.farmHomeSectionOneBubbleOneTitle()}</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">
						{message.farmHomeSectionOneBubbleOneDesc()}
					</p>
				</div>
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">{message.farmHomeSectionOneBubbleTwoTitle()}</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">
						{message.farmHomeSectionOneBubbleTwoDesc()}
					</p>
				</div>
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">{message.farmHomeSectionOneBubbleThreeTitle()}</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">
						{message.farmHomeSectionOneBubbleThreeDesc()}
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- FOUNDERS -->
	<div class="mt-14 grid items-center gap-8 md:grid-cols-2">
		<!-- Text left (alternate) -->
		<div>
			<h2 class="text-3xl font-bold tracking-tight">{message.farmHomeSectionTwoHeader()}</h2>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				{message.farmHomeSectionTwoDesc()}
			</p>

			<ul class="mt-5 grid gap-3">
				<li class="flex gap-3">
					<span
						class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white"
						>✓</span
					>
					<p class="text-gray-700 dark:text-gray-200">
						<strong>{message.farmHomeSectionTwoListItemOne()}</strong
						>{message.farmHomeSectionTwoListItemOneDesc()}
					</p>
				</li>

				<li class="flex gap-3">
					<span
						class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white"
						>✓</span
					>
					<p class="text-gray-700 dark:text-gray-200">
						<strong>{message.farmHomeSectionTwoListItemTwo()}</strong
						>{message.farmHomeSectionTwoListItemTwoDesc()}
					</p>
				</li>

				<li class="flex gap-3">
					<span
						class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white"
						>✓</span
					>
					<p class="text-gray-700 dark:text-gray-200">
						<strong>{message.farmHomeSectionTwoListItemThree()}</strong
						>{message.farmHomeSectionTwoListItemThreeDesc()}
					</p>
				</li>
			</ul>
		</div>

		<!-- Image right -->
		<div
			class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<img
				src="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1400&q=80"
				alt="Massage studio"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="lazy"
			/>
		</div>
	</div>

	<!-- SERVICES -->
	<div id="services" class="mt-14 grid scroll-mt-24 items-center gap-8 md:grid-cols-2">
		<!-- Image left -->
		<div
			class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<img
				src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=80"
				alt="Massage therapy session"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="lazy"
			/>
		</div>

		<!-- Text right -->
		<div>
			<h2 class="text-3xl font-bold tracking-tight">{message.servicesAsPlainText()}</h2>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				{message.farmHomeSectionThreeDesc()}
			</p>

			<div class="mt-5 grid gap-3 sm:grid-cols-2">
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">{message.farmHomeSectionThreeBubbleOneTitle()}</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						{message.farmHomeSectionThreeBubbleOneDesc()}
					</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">{message.farmHomeSectionThreeBubbleTwoTitle()}</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						{message.farmHomeSectionThreeBubbleTwoDesc()}
					</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">{message.farmHomeSectionThreeBubbleThreeTitle()}</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						{message.farmHomeSectionThreeBubbleThreeDesc()}
					</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">{message.farmHomeSectionThreeBubbleFourTitle()}</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						{message.farmHomeSectionThreeBubbleFourDesc()}
					</p>
				</div>
			</div>

			<div class="mt-6 flex flex-wrap gap-3">
				<button
					class="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
					onclick={() => go('/massage/book-appointment')}
				>
					{message.bookAppointmentAsPlainText()}
				</button>

				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('contact')}
				>
					{message.contactAsPlainText()}
				</button>
			</div>
		</div>
	</div>

	<!-- CONTACT -->
	<div id="contact" class="mt-14 grid scroll-mt-24 items-center gap-8 md:grid-cols-2">
		<!-- Text left (alternate) -->
		<div>
			<h2 class="text-3xl font-bold tracking-tight">{message.contactAsPlainText()}</h2>

			<!-- You don't have a key for this paragraph in your list, so it stays hardcoded for now -->
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				Questions about availability, services, or accessibility? Reach out anytime — we’ll get back
				quickly.
			</p>

			<div class="mt-5 grid gap-3">
				<p class="mt-1 text-sm text-gray-700 dark:text-gray-200">
					{message.farmHomeSectionFourPhoneNumber()}
				</p>

				<p class="mt-1 text-sm text-gray-700 dark:text-gray-200">
					{message.farmHomeSectionFourEmail()}
				</p>

				<p class="mt-1 text-sm text-gray-700 dark:text-gray-200">
					{message.farmHomeSectionFourAddress()}
				</p>
			</div>

			<div class="mt-6 flex flex-wrap gap-3">
				<button
					class="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
					onclick={() => go('/massage/book-appointment')}
				>
					{message.getStartedAsPlainText()}
				</button>

				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('services')}
				>
					{message.servicesAsPlainText()}
				</button>
			</div>
		</div>

		<!-- Image right -->
		<div
			class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		>
			<img
				src="https://images.unsplash.com/photo-1525097487452-6278ff080c31?auto=format&fit=crop&w=1400&q=80"
				alt="Calm spa setting"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="lazy"
			/>
		</div>
	</div>
</section>
