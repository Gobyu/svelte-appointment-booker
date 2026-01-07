<!-- src/routes/+page.svelte -->
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
				src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1400&q=80"
				alt="Massage and wellness"
				class="h-[320px] w-full object-cover md:h-[420px]"
				loading="eager"
			/>
		</div>

		<!-- Text right -->
		<div>
			<p
				class="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200"
			>
				Relax • Recover • Reset
			</p>
			<h1 class="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
				Feel better in your body — starting today.
			</h1>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				Personalized massage therapy designed for stress relief, muscle recovery, and long-term
				wellness. Book in minutes and walk out lighter.
			</p>

			<div class="mt-6 flex flex-wrap gap-3">
				<button
					class="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
					onclick={() => go('/massage/book-appointment')}
				>
					Get started
				</button>
				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('services')}
				>
					Our services
				</button>
			</div>

			<div class="mt-6 grid gap-3 sm:grid-cols-3">
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Licensed therapists</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">Experienced, client-first care.</p>
				</div>
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Tailored sessions</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">Pressure and focus areas you choose.</p>
				</div>
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Easy booking</p>
					<p class="mt-1 text-gray-600 dark:text-gray-300">Fast scheduling, clear pricing.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- FOUNDERS -->
	<div class="mt-14 grid items-center gap-8 md:grid-cols-2">
		<!-- Text left (alternate) -->
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Get to know us!</h2>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				We started this studio with one simple goal: help people move through life with less pain
				and more ease. Our approach blends evidence-informed techniques with a calm, welcoming space
				— so you can truly exhale.
			</p>

			<ul class="mt-5 grid gap-3">
				<li class="flex gap-3">
					<span
						class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white"
						>✓</span
					>
					<p class="text-gray-700 dark:text-gray-200">
						<strong>Client-led sessions:</strong> you tell us what you need, we tailor the plan.
					</p>
				</li>
				<li class="flex gap-3">
					<span
						class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white"
						>✓</span
					>
					<p class="text-gray-700 dark:text-gray-200">
						<strong>Comfortable environment:</strong> warm lighting, quiet rooms, no rush.
					</p>
				</li>
				<li class="flex gap-3">
					<span
						class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white"
						>✓</span
					>
					<p class="text-gray-700 dark:text-gray-200">
						<strong>Results you can feel:</strong> focus on relief, mobility, and recovery.
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
			<h2 class="text-3xl font-bold tracking-tight">Our services</h2>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				Choose a session length, then we’ll customize pressure and technique based on your goals.
			</p>

			<div class="mt-5 grid gap-3 sm:grid-cols-2">
				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Relaxation Massage</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Calm the nervous system, reduce stress, and unwind.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">30 / 60 / 90 min</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Deep Tissue</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Target tight muscles with deeper pressure and precision.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">45 / 60 / 90 min</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Sports & Recovery</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Support training, recovery, and mobility.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">45 / 60 min</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="font-semibold">Neck & Shoulder Focus</p>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
						Perfect for desk work tension and headaches.
					</p>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-200">30 / 45 min</p>
				</div>
			</div>

			<div class="mt-6 flex flex-wrap gap-3">
				<button
					class="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
					onclick={() => go('/massage/book-appointment')}
				>
					Book an appointment
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
		<!-- Text left (alternate) -->
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Contact</h2>
			<p class="mt-3 max-w-prose text-gray-600 dark:text-gray-300">
				Questions about availability, services, or accessibility? Reach out anytime — we’ll get back
				quickly.
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
					<p class="mt-1 text-sm text-gray-700 dark:text-gray-200">hello@example.com</p>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				>
					<p class="text-sm font-semibold">Address</p>
					<p class="mt-1 text-sm text-gray-700 dark:text-gray-200">123 Wellness Ave, Toronto, ON</p>
				</div>
			</div>

			<div class="mt-6 flex flex-wrap gap-3">
				<button
					class="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
					onclick={() => go('/massage/book-appointment')}
				>
					Get started
				</button>
				<button
					class="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => scrollToId('services')}
				>
					View services
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

	<!-- Footer strip -->
	<div
		class="mt-14 rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
	>
		<p class="text-lg font-semibold">Ready when you are.</p>
		<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
			Book your session in under a minute.
		</p>
		<div class="mt-4 flex justify-center">
			<button
				class="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
				onclick={() => go('massage/book-appointment')}
			>
				Book now
			</button>
		</div>
	</div>
</section>
