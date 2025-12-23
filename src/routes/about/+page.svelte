<!-- src/routes/about/+page.svelte -->
<script lang="ts">
	// No logic needed (Svelte 5 runes-safe)
</script>

<section class="mx-auto max-w-4xl px-4 py-10">
	<div class="mb-8">
		<h1 class="text-4xl font-bold tracking-tight">Our story</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-300">
			Why we built this studio, what we believe in, and how we care for people.
		</p>
	</div>

	<div
		class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
	>
		<img
			src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80"
			alt="Massage therapy setting"
			class="h-[260px] w-full object-cover md:h-[360px]"
			loading="eager"
		/>
	</div>

	<article class="prose mt-8 max-w-none prose-zinc dark:prose-invert">
		<p>
			Our studio began the same way many healing journeys start: with someone trying to feel better,
			and realizing that “better” is rarely just one thing. It’s not only about loosening a tight
			shoulder or calming a sore lower back—though those matter. It’s about being able to breathe
			deeper, sleep more peacefully, move with less hesitation, and return to your day feeling like
			you’re back in your body.
		</p>

		<p>
			Before we opened our doors, we spent years working in busy clinics where schedules were tight,
			rooms turned over quickly, and people often felt like they had to “fit” into a preset
			treatment style. We saw how common it was for clients to arrive carrying more than physical
			tension: long workdays, chronic stress, injuries that never quite resolved, and the quiet
			worry that their pain was becoming normal. We also saw what happened when care slowed down
			enough to be personal—when someone listened closely, adjusted thoughtfully, and treated the
			person rather than the appointment slot.
		</p>

		<h2>What we wanted to change</h2>
		<p>
			We didn’t want massage to feel like a transaction. We wanted it to feel like a reset—clear,
			grounded, and tailored to you. That meant building a space where you’re not rushed, where the
			plan is explained, and where your comfort is non-negotiable. It also meant focusing on a few
			key principles that guide every session:
		</p>

		<ul>
			<li>
				<strong>Listen first:</strong> Every visit starts with a quick check-in about what you’re feeling
				and what you need today.
			</li>
			<li>
				<strong>Customize always:</strong> Pressure, pace, and techniques adapt to your body, your preferences,
				and your goals.
			</li>
			<li>
				<strong>Make progress realistic:</strong> Relief can be immediate, but we also care about long-term
				mobility and sustainable change.
			</li>
			<li>
				<strong>Keep it calm:</strong> A soothing environment supports the nervous system—quiet rooms,
				warm lighting, and a pace that lets you truly unwind.
			</li>
		</ul>

		<h2>How our approach works</h2>
		<p>
			We think of each appointment as a collaboration. Some people come in wanting a deeply relaxing
			session that quiets their mind and helps them sleep. Others need focused work around neck and
			shoulder tension from desk posture. Some are recovering from workouts or long periods of
			stress that have built up in the hips, calves, and back.
		</p>

		<p>
			Whatever the reason, we start with your priorities and build from there. That might mean a
			gentle, steady rhythm to help your body settle. It might mean slower, targeted work to address
			stubborn tightness. It might mean balancing both—relaxation to calm the system, then specific
			work where you need it most. We aim to leave you feeling noticeably better in the short term,
			while also supporting a longer arc of recovery and resilience.
		</p>

		<h2>Who we built this for</h2>
		<p>
			This studio is for people who take care of everyone else and finally want a space to take care
			of themselves. It’s for athletes, office workers, caregivers, students, and anyone whose body
			is asking for a little more support. It’s for clients who are new to massage and want a clear,
			comfortable first experience. And it’s for those who’ve tried everything and are looking for
			consistent, thoughtful care that meets them where they are.
		</p>

		<h2>Our promise</h2>
		<p>
			We can’t promise that one session will solve everything. But we can promise this: you will be
			heard, your comfort will be respected, and your care will be intentional. Our goal is
			simple—to help you leave feeling better than when you arrived, and to make it easy to keep
			that feeling going.
		</p>

		<p>
			Thank you for trusting us with your time and your body. We’re grateful you’re here, and we’re
			excited to be part of your wellness routine.
		</p>
	</article>

	<div
		class="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
	>
		<h3 class="text-xl font-semibold">Ready to book?</h3>
		<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
			Choose a time that works for you — we’ll take care of the rest.
		</p>
		<div class="mt-4">
			<a
				href="/BookAppointment"
				class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
			>
				Get started
			</a>
		</div>
	</div>
</section>
