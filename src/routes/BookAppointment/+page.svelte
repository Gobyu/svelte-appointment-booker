<script lang="ts">
	type Step = 'date' | 'time' | 'details';
	type DayCell = {
		date: Date | null;
		iso: string | null;
		disabled: boolean;
		isToday: boolean;
		isSelected: boolean;
	};
	type AvailabilityResponse = {
		times?: string[];
		holidayLabel?: string | null;
		holidayComment?: string | null;
		isOpenOverride?: boolean | null;
		holiday_name?: string | null;
		comment?: string | null;
		is_open?: boolean | null;
		holiday?: { name?: string | null; comment?: string | null; is_open?: boolean | null } | null;
	};
	type FormDataT = {
		name: string;
		phoneNumber: string;
		email: string;
		date: string;
		time: string;
		duration: string;
		type: string;
		comments: string;
	};

	const DEFAULT_SLOT_MINUTES = 30;
	const STEPS: Step[] = ['date', 'time', 'details'];
	const stepIdx = (s: Step) => STEPS.indexOf(s);
	const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	const onlyDigits = (s: string) => s.replace(/\D/g, '');
	const isValidNANP = (raw: string) => {
		const d = onlyDigits(raw);
		return d.length === 10 || (d.length === 11 && d.startsWith('1'));
	};
	const formatPrettyNANP = (rawOrE164: string) => {
		const digits = onlyDigits(rawOrE164).replace(/^1(?=\d{10}$)/, '');
		if (digits.length !== 10) return rawOrE164;
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
	};

	function todayLocalISO(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}
	const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
	const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
	const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
	function toISODate(d: Date) {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}
	function isPastDateISO(iso: string) {
		const t = new Date(iso + 'T00:00');
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return t < today;
	}
	function humanTimeLabel(valueHHmm: string) {
		const [hh, mm] = valueHHmm.split(':').map(Number);
		const displayHour = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
		return `${displayHour}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
	}
	function groupHalfHours(times: string[]) {
		type Row = { hour: number; zero: string | null; thirty: string | null };
		const map = new Map<number, Row>();
		for (const t of [...times].sort()) {
			const [hh, mm] = t.split(':').map(Number);
			if (!map.has(hh)) map.set(hh, { hour: hh, zero: null, thirty: null });
			const row = map.get(hh)!;
			if (mm === 0) row.zero = t;
			if (mm === 30) row.thirty = t;
		}
		return [...map.values()].filter((r) => r.zero || r.thirty);
	}

	let inFlightMonths = $state<Record<string, boolean>>({});
	let step = $state<Step>('date');
	let viewMonth = $state<Date>(startOfMonth(new Date()));

	let formData = $state<FormDataT>({
		name: '',
		phoneNumber: '',
		email: '',
		date: '',
		time: '',
		duration: '',
		type: '',
		comments: ''
	});

	let availableTimes = $state<string[]>([]);
	let loadingTimes = $state(false);
	let timesError = $state<string | null>(null);
	let holidayInfo = $state<{
		label: string | null;
		comment: string | null;
		isOpenOverride: boolean | null;
	} | null>(null);

	let monthAvail = $state<Record<string, boolean | undefined>>({});
	let monthCache = $state<Record<string, Record<string, boolean | undefined>>>({});
	let loadedMonths = $state<Record<string, boolean>>({});
	let availAbort: AbortController | null = null;

	const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

	function buildWeeks(
		month: Date,
		selectedISO: string,
		avail: Record<string, boolean | undefined>
	): DayCell[][] {
		const first = startOfMonth(month);
		const last = endOfMonth(month);
		const startWeekday = first.getDay();
		const daysInMonth = last.getDate();
		const cells: DayCell[] = [];

		for (let i = 0; i < startWeekday; i++)
			cells.push({ date: null, iso: null, disabled: true, isToday: false, isSelected: false });

		for (let day = 1; day <= daysInMonth; day++) {
			const cellDate = new Date(first.getFullYear(), first.getMonth(), day);
			const iso = toISODate(cellDate);
			const past = isPastDateISO(iso);
			const isTodayISO = iso === todayLocalISO();
			const hasSlots = avail[iso];
			const disabled = past || (!isTodayISO && hasSlots === false);

			cells.push({
				date: cellDate,
				iso,
				disabled,
				isToday: isTodayISO,
				isSelected: !!selectedISO && iso === selectedISO
			});
		}

		while (cells.length % 7 !== 0)
			cells.push({ date: null, iso: null, disabled: true, isToday: false, isSelected: false });

		const out: DayCell[][] = [];
		for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
		return out;
	}
	const weeks = $derived(buildWeeks(viewMonth, formData.date, monthAvail));

	function normalizeAvailability(data: AvailabilityResponse) {
		const holidayLabel =
			data.holidayLabel ??
			data.holiday_name ??
			data.holiday?.name ??
			(typeof (data as any).holiday === 'string' ? (data as any).holiday : null) ??
			null;
		const holidayComment = data.holidayComment ?? data.comment ?? data.holiday?.comment ?? null;
		const isOpenOverride = data.isOpenOverride ?? data.is_open ?? data.holiday?.is_open ?? null;
		const times = data.times ?? (data as any).available ?? (data as any).slots ?? [];
		return { times, holidayLabel, holidayComment, isOpenOverride };
	}

	async function fetchAvailability(
		dateISO: string,
		slotMinutes = DEFAULT_SLOT_MINUTES,
		signal?: AbortSignal
	) {
		const qs1 = new URLSearchParams({ date: dateISO, slotMinutes: String(slotMinutes) });
		let res = await fetch(`/api/availability?${qs1}`, { signal });
		if (!res.ok) {
			const qs2 = new URLSearchParams({ date: dateISO, slot_minutes: String(slotMinutes) });
			res = await fetch(`/api/availability?${qs2}`, { signal });
			if (!res.ok) {
				const resPost = await fetch(`/api/availability`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					signal,
					body: JSON.stringify({ date: dateISO, slotMinutes, slot_minutes: slotMinutes })
				});
				if (!resPost.ok) throw new Error(`Availability HTTP ${resPost.status}`);
				return normalizeAvailability(await resPost.json());
			}
		}
		return normalizeAvailability(await res.json());
	}

	async function loadMonth(month: Date, key: string) {
		if (loadedMonths[key] || inFlightMonths[key]) {
			const cached = monthCache[key];
			if (cached) {
				const needsMerge = Object.keys(cached).some((iso) => monthAvail[iso] === undefined);
				if (needsMerge) monthAvail = { ...monthAvail, ...cached };
			}
			return;
		}

		inFlightMonths = { ...inFlightMonths, [key]: true };

		try {
			availAbort?.abort();
			const ac = new AbortController();
			availAbort = ac;

			const year = month.getFullYear();
			const monthIndex = month.getMonth();
			const daysInMonth = endOfMonth(month).getDate();

			const allIsos = Array.from({ length: daysInMonth }, (_, i) =>
				toISODate(new Date(year, monthIndex, i + 1))
			);
			const fetchedForMonth: Record<string, boolean | undefined> = {};

			for (const iso of allIsos) if (isPastDateISO(iso)) fetchedForMonth[iso] = false;

			const toFetch = allIsos.filter((iso) => !isPastDateISO(iso));
			const CONCURRENCY = 6;
			const queue = [...toFetch];

			await Promise.all(
				Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
					while (queue.length && !ac.signal.aborted) {
						const iso = queue.shift()!;
						try {
							const data = await fetchAvailability(iso, DEFAULT_SLOT_MINUTES, ac.signal);
							fetchedForMonth[iso] = (data.times?.length ?? 0) > 0;
						} catch {
							if (ac.signal.aborted) return;
							fetchedForMonth[iso] = undefined;
						}
					}
				})
			);

			monthCache = { ...monthCache, [key]: fetchedForMonth };
			const needsPublish = Object.keys(fetchedForMonth).some(
				(iso) => monthAvail[iso] !== fetchedForMonth[iso]
			);
			if (needsPublish) monthAvail = { ...monthAvail, ...fetchedForMonth };
			loadedMonths = { ...loadedMonths, [key]: true };
		} finally {
			inFlightMonths = { ...inFlightMonths, [key]: false };
		}
	}

	$effect(() => {
		const vm = viewMonth;
		const key = monthKey(vm);
		if (!loadedMonths[key] && !inFlightMonths[key]) void loadMonth(vm, key);
	});

	$effect(() => {
		if (!formData.date || step !== 'time') return;
		const ac = new AbortController();
		loadingTimes = true;
		timesError = null;

		void (async () => {
			try {
				const data = await fetchAvailability(formData.date, DEFAULT_SLOT_MINUTES, ac.signal);
				availableTimes = data.times || [];
				holidayInfo = {
					label: data.holidayLabel ?? null,
					comment: data.holidayComment ?? null,
					isOpenOverride: data.isOpenOverride ?? null
				};
			} catch (err: any) {
				if (err?.name !== 'AbortError') {
					console.error('Error loading availability:', err);
					timesError = "Couldn't load available times. Try again.";
				}
			} finally {
				loadingTimes = false;
			}
		})();

		return () => ac.abort();
	});

	function handlePickDate(iso: string | null) {
		if (!iso) return;
		const isTodayISO = iso === todayLocalISO();
		const knownNoSlots = monthAvail[iso] === false;
		if (isPastDateISO(iso) || (!isTodayISO && knownNoSlots)) return;

		formData = { ...formData, date: iso, time: '' };
		availableTimes = [];
		holidayInfo = null;
		step = 'time';
	}
	function handlePickTime(valueHHmm: string) {
		formData = { ...formData, time: valueHHmm };
		step = 'details';
	}

	async function submitForm(e: SubmitEvent) {
		e.preventDefault();
		if (!formData.date || !formData.time) return alert('Please choose a date and time.');
		if (!formData.duration) return alert('Please choose a duration.');
		if (formData.phoneNumber && !isValidNANP(formData.phoneNumber))
			return alert('Invalid phone number. Enter 10 digits, or 11 starting with 1.');
		if (!formData.type) return alert('Please choose a type of appointment.');

		const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
		if (selectedDateTime < new Date())
			return alert('Appointment date and time cannot be in the past.');

		try {
			const response = await fetch('/api/BookAppointment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				alert(`Appointment scheduled on ${formData.date} at ${formData.time}`);
				formData = {
					name: '',
					phoneNumber: '',
					email: '',
					date: '',
					time: '',
					duration: '',
					type: '',
					comments: ''
				};
				availableTimes = [];
				holidayInfo = null;
				step = 'date';
			} else {
				const payload = await response.json().catch(async () => ({
					message: await response.text().catch(() => 'Unknown error')
				}));
				if (response.status === 409)
					alert(payload?.message || 'Time conflict with another appointment');
				else if (response.status === 400)
					alert(payload?.message || 'Invalid input. Please check your entries.');
				else alert(payload?.message || 'Failed to schedule appointment.');
			}
		} catch (error) {
			console.error('Error submitting appointment:', error);
			alert('Error submitting appointment');
		}
	}
</script>

<div class="mx-auto max-w-6xl px-4 pb-16">
	<h1 class="mb-6 text-center text-3xl font-bold">Book Your Appointment</h1>

	<!-- Steps -->
	<div class="mb-6 flex items-center justify-center gap-2 text-sm">
		{#each STEPS as s, i}
			{@const active = step === s}
			{@const completed = stepIdx(step) > i}
			{@const clickable = completed}
			<div class="flex items-center">
				{#if clickable}
					<button
						type="button"
						onclick={() => (step = s)}
						aria-label={`Go back to ${s} step`}
						class={`rounded-full border px-3 py-1 transition ${
							active
								? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
								: completed
									? 'border-emerald-600 bg-emerald-600 text-white'
									: 'border-gray-300 bg-zinc-100 text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100'
						} hover:ring-2 hover:ring-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none`}
					>
						{i + 1}. {s.toUpperCase()}
					</button>
				{:else}
					<div
						class={`rounded-full border px-3 py-1 ${
							active
								? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
								: 'border-gray-300 bg-zinc-100 text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100'
						}`}
						aria-current={active ? 'step' : undefined}
					>
						{i + 1}. {s.toUpperCase()}
					</div>
				{/if}
				{#if i < STEPS.length - 1}<span class="mx-2 text-gray-500 dark:text-gray-400">—</span>{/if}
			</div>
		{/each}
	</div>

	{#if step === 'date'}
		<section
			class="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
		>
			{@render CalendarBody()}
		</section>
	{:else}
		<div class="grid items-start gap-6 md:grid-cols-2">
			<section
				class="rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
			>
				{@render CalendarBody()}
			</section>
			{#if step === 'time'}
				<section
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
				>
					<div class="mb-3 flex items-center justify-between">
						<h2 class="text-xl font-semibold">
							{new Date(formData.date + 'T00:00').toLocaleDateString(undefined, {
								weekday: 'long',
								month: 'long',
								day: 'numeric',
								year: 'numeric'
							})}
						</h2>
					</div>

					{#if loadingTimes}
						<p class="text-gray-700 dark:text-gray-200">Loading available times…</p>
					{:else if timesError}
						<div class="text-red-600 dark:text-red-400">{timesError}</div>
					{:else if availableTimes.length === 0}
						{#if holidayInfo?.label && holidayInfo?.isOpenOverride === false}
							<div class="space-y-1">
								<p>We are closed for <span class="font-semibold">{holidayInfo.label}</span>.</p>
								{#if holidayInfo.comment}<p class="text-sm text-gray-600 dark:text-gray-300">
										{holidayInfo.comment}
									</p>{/if}
							</div>
						{:else}
							<p class="text-gray-700 dark:text-gray-200">
								No times available for this date. Please pick another date.
							</p>
						{/if}
					{:else}
						<div class="space-y-2">
							{#each groupHalfHours(availableTimes) as row}
								<div class="grid grid-cols-2 gap-2">
									{#if row.zero}
										<button
											type="button"
											onclick={() => handlePickTime(row.zero!)}
											class="w-full rounded-xl border border-gray-300 bg-zinc-100 px-3 py-2 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
										>
											{humanTimeLabel(row.zero!)}
										</button>
									{:else}
										<div
											aria-hidden="true"
											class="invisible w-full rounded-xl border border-gray-300 bg-zinc-100 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
										></div>
									{/if}
									{#if row.thirty}
										<button
											type="button"
											onclick={() => handlePickTime(row.thirty!)}
											class="w-full rounded-xl border border-gray-300 bg-zinc-100 px-3 py-2 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
										>
											{humanTimeLabel(row.thirty!)}
										</button>
									{:else}
										<div
											aria-hidden="true"
											class="invisible w-full rounded-xl border border-gray-300 bg-zinc-100 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
										></div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					<div class="mt-4 text-sm text-gray-600 dark:text-gray-300">
						* Availability assumes a {DEFAULT_SLOT_MINUTES}-minute slot. You’ll confirm duration
						next.
					</div>
				</section>
			{/if}

			{#if step === 'details'}
				<section>
					<div
						class="mb-4 rounded-2xl border border-gray-200 bg-white p-3 shadow dark:border-zinc-700 dark:bg-zinc-900"
					>
						<div class="flex items-center justify-between gap-3">
							<div class="text-sm">
								<div class="leading-tight text-gray-600 dark:text-gray-300">Selected</div>
								<div class="font-semibold">
									{new Date(formData.date + 'T00:00').toLocaleDateString(undefined, {
										weekday: 'long',
										month: 'long',
										day: 'numeric',
										year: 'numeric'
									})} · {humanTimeLabel(formData.time)}
								</div>
							</div>
							<div class="flex gap-2">
								<button
									type="button"
									onclick={() => (step = 'time')}
									class="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-zinc-700 dark:hover:bg-zinc-800"
								>
									Change time
								</button>
							</div>
						</div>
					</div>

					<form
						onsubmit={submitForm}
						class="rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
					>
						<label class="mb-4 block text-left font-bold">
							Name* :
							<input
								type="text"
								name="name"
								bind:value={formData.name}
								required
								class="mt-1 box-border w-full rounded border border-gray-300 p-2.5 text-base focus:ring-2 focus:ring-gray-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
							/>
						</label>

						<label class="mb-4 block text-left font-bold">
							Phone Number* :
							<input
								type="tel"
								name="phoneNumber"
								bind:value={formData.phoneNumber}
								placeholder="(555) 123-4567"
								required
								class="mt-1 box-border w-full rounded border border-gray-300 p-2.5 text-base focus:ring-2 focus:ring-gray-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
							/>
							{#if formData.phoneNumber}
								<div class="mt-1 text-xs text-gray-600 dark:text-gray-300">
									Formatted: {formatPrettyNANP(formData.phoneNumber)}
								</div>
							{/if}
						</label>

						<label class="mb-4 block text-left font-bold">
							Email :
							<input
								type="email"
								name="email"
								bind:value={formData.email}
								class="mt-1 box-border w-full rounded border border-gray-300 p-2.5 text-base focus:ring-2 focus:ring-gray-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
							/>
						</label>

						<label class="mb-4 block text-left font-bold">
							Duration* :
							<select
								name="duration"
								bind:value={formData.duration}
								required
								class="mt-1 box-border w-full rounded border border-gray-300 bg-white p-2.5 text-base text-gray-900 focus:ring-2 focus:ring-gray-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
							>
								<option value="">Select duration</option>
								<option value="30">30 minutes</option>
								<option value="60">1 hour</option>
							</select>
						</label>

						<label class="mb-4 block text-left font-bold">
							Type of Appointment* :
							<select
								name="type"
								bind:value={formData.type}
								required
								class="mt-1 box-border w-full rounded border border-gray-300 bg-white p-2.5 text-base text-gray-900 focus:ring-2 focus:ring-gray-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
							>
								<option value="">Select</option>
								<option value="consultation">consultation</option>
								<option value="checkup">checkup</option>
								<option value="other">other</option>
							</select>
						</label>

						<label class="mb-4 block text-left font-bold">
							Additional Information:
							<textarea
								name="comments"
								bind:value={formData.comments}
								class="mt-1 box-border w-full rounded border border-gray-300 p-2.5 text-base focus:ring-2 focus:ring-gray-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
							></textarea>
						</label>

						<button
							type="submit"
							class="mt-2 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-black"
						>
							Place Appointment
						</button>
					</form>
				</section>
			{/if}
		</div>
	{/if}
</div>

{#snippet CalendarBody()}
	<header class="mb-2 flex items-center justify-between">
		<button
			type="button"
			onclick={() => (viewMonth = addMonths(viewMonth, -1))}
			class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-zinc-700 dark:hover:bg-zinc-800"
			aria-label="Previous month">◀</button
		>
		<h2 class="text-lg font-semibold">
			{viewMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
		</h2>
		<button
			type="button"
			onclick={() => (viewMonth = addMonths(viewMonth, +1))}
			class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-zinc-700 dark:hover:bg-zinc-800"
			aria-label="Next month">▶</button
		>
	</header>

	<div class="mb-2 grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400">
		{#each WEEKDAYS as d}<div class="py-2">{d}</div>{/each}
	</div>

	<div class="grid grid-cols-7 gap-1" role="grid">
		{#each weeks as row}
			{#each row as cell}
				{#if !cell.date}
					<div class="aspect-square rounded-xl border border-transparent"></div>
				{:else}
					{@const base = 'aspect-square rounded-xl flex items-center justify-center select-none'}
					{@const style = cell.disabled
						? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600'
						: 'cursor-pointer border border-gray-300 bg-zinc-100 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700'}
					{@const todayRing = cell.isToday ? ' ring-1 ring-black/30 dark:ring-white/40' : ''}
					{@const selectedStyle = cell.isSelected
						? ' !bg-black !text-white border-black dark:!bg-white dark:!text-black dark:border-white'
						: ''}

					<button
						type="button"
						onclick={() => handlePickDate(cell.iso)}
						disabled={cell.disabled}
						class={`${base} ${style}${todayRing}${selectedStyle}`}
						aria-label={cell.iso!}
						aria-pressed={cell.isSelected}
					>
						{cell.date.getDate()}
					</button>
				{/if}
			{/each}
		{/each}
	</div>
{/snippet}
