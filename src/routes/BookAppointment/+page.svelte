<script lang="ts">
	import { onMount, tick } from 'svelte';
	import 'leaflet/dist/leaflet.css';

	import type * as LeafletNS from 'leaflet';

	import { getServicesCached } from '$lib/servicesCache';
	import { getLocationsCached } from '$lib/locationsCache';
	import {
		getDayAvailabilityCached,
		getMonthAvailabilityMapCached,
		invalidateAvailabilityForDate
	} from '$lib/availabilityCache';

	// -----------------------------
	// Types
	// -----------------------------
	type Step = 'location' | 'datetime' | 'details';

	type DayCell = {
		date: Date | null;
		iso: string | null;
		disabled: boolean;
		isToday: boolean;
		isSelected: boolean;
	};

	type FormDataT = {
		name: string;
		phoneNumber: string;
		email: string;
		location: number | null;
		date: string;
		time: string;
		duration: string;
		type: string;
		comments: string;
	};

	type ServiceT = {
		id: number;
		name: string;
		description: string | null;
		price: number;
	};

	type LocationT = {
		id: number;
		name: string;
		address: string;
		postal: string;
		city: string;
		province: string;
		lat: number;
		lng: number;
	};

	type LocationWithDistance = LocationT & { distanceMeters: number | null };

	type LeafletModule = typeof import('leaflet');

	// -----------------------------
	// Constants
	// -----------------------------
	const DEFAULT_SLOT_MINUTES = 30;
	const STEPS: Step[] = ['location', 'datetime', 'details'];
	const STEP_LABEL: Record<Step, string> = {
		location: 'LOCATION',
		datetime: 'DATE & TIME',
		details: 'DETAILS'
	};
	const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// -----------------------------
	// State: booking
	// -----------------------------
	const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
	const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
	const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
	let step = $state<Step>('location');
	let viewMonth = $state<Date>(startOfMonth(new Date()));

	let formData = $state<FormDataT>({
		name: '',
		phoneNumber: '',
		email: '',
		location: null,
		date: '',
		time: '',
		duration: '',
		type: '',
		comments: ''
	});

	let monthAvail = $state<Record<string, boolean | undefined>>({});

	let availableTimes = $state<string[]>([]);
	let loadingTimes = $state(false);
	let timesError = $state<string | null>(null);
	let holidayInfo = $state<{
		label: string | null;
		comment: string | null;
		isOpenOverride: boolean | null;
	} | null>(null);

	// -----------------------------
	// State: services
	// -----------------------------
	let services = $state<ServiceT[]>([]);
	let servicesLoading = $state(false);
	let servicesError = $state<string | null>(null);
	let showServiceModal = $state(false);

	// -----------------------------
	// State: locations + search
	// -----------------------------
	let locations = $state<LocationT[]>([]);
	let locationsLoading = $state(false);
	let locationsError = $state<string | null>(null);

	let searchQuery = $state('');
	let searchCenter = $state<{ lat: number; lng: number } | null>(null);
	let searchLabel = $state<string | null>(null);
	let searching = $state(false);
	let searchError = $state<string | null>(null);

	// -----------------------------
	// State: Leaflet
	// -----------------------------
	let leaflet = $state<LeafletModule | null>(null);
	let leafletIcon = $state<LeafletNS.Icon | null>(null);

	let mapEl = $state<HTMLDivElement | null>(null);
	let map: LeafletNS.Map | null = null;
	let markersLayer: LeafletNS.LayerGroup | null = null;
	let searchMarker: LeafletNS.Marker | null = null;

	// -----------------------------
	// Derived
	// -----------------------------
	const stepIdx = (s: Step) => STEPS.indexOf(s);
	const hasPickedDate = $derived(!!formData.date);

	const selectedLocation = $derived.by<LocationT | null>(() => {
		return locations.find((l) => l.id === formData.location) ?? null;
	});

	const locationsSorted = $derived.by<LocationWithDistance[]>(() => {
		const center = searchCenter;

		const base: LocationWithDistance[] = locations.map((l) => ({
			...l,
			distanceMeters: center ? haversineMeters(center, { lat: l.lat, lng: l.lng }) : null
		}));

		if (!center) return base;

		return base.toSorted((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
	});

	const weeks = $derived(buildWeeks(viewMonth, formData.date, monthAvail));

	// -----------------------------
	// Helpers (misc)
	// -----------------------------
	function formatMoney(n: number) {
		try {
			return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
		} catch {
			return `$${n.toFixed(2)}`;
		}
	}

	function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
		const R = 6371000;
		const toRadians = (x: number) => (x * Math.PI) / 180;
		const deltaLat = toRadians(b.lat - a.lat);
		const deltaLng = toRadians(b.lng - a.lng);
		const latitude1 = toRadians(a.lat);
		const latitude2 = toRadians(b.lat);
		const s =
			Math.sin(deltaLat / 2) ** 2 +
			Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLng / 2) ** 2;
		return 2 * R * Math.asin(Math.sqrt(s));
	}

	function formatDistance(meters: number) {
		if (!Number.isFinite(meters)) return '';
		if (meters < 1000) return `${Math.round(meters)} m`;
		return `${(meters / 1000).toFixed(1)} km`;
	}

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

	// -----------------------------
	// Helpers (dates/calendar)
	// -----------------------------
	function todayLocalISO(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
			d.getDate()
		).padStart(2, '0')}`;
	}

	function toISODate(d: Date) {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
			d.getDate()
		).padStart(2, '0')}`;
	}

	function isPastDateISO(iso: string) {
		const t = new Date(iso + 'T00:00');
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return t < today;
	}

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

		for (let i = 0; i < startWeekday; i++) {
			cells.push({ date: null, iso: null, disabled: true, isToday: false, isSelected: false });
		}

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

		while (cells.length % 7 !== 0) {
			cells.push({ date: null, iso: null, disabled: true, isToday: false, isSelected: false });
		}

		const out: DayCell[][] = [];
		for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
		return out;
	}

	// -----------------------------
	// Loaders
	// -----------------------------
	async function loadServices() {
		servicesLoading = true;
		servicesError = null;
		try {
			services = await getServicesCached(fetch);
		} catch (e: any) {
			servicesError = e?.message ?? 'Failed to load services';
			services = [];
		} finally {
			servicesLoading = false;
		}
	}

	async function loadLocations() {
		locationsLoading = true;
		locationsError = null;
		try {
			locations = await getLocationsCached(fetch);
		} catch (e: any) {
			locationsError = e?.message ?? 'Failed to load locations';
			locations = [];
		} finally {
			locationsLoading = false;
		}
	}

	// -----------------------------
	// Services actions
	// -----------------------------
	function pickService(s: ServiceT) {
		formData = { ...formData, type: s.name };
		showServiceModal = false;
	}

	// -----------------------------
	// Leaflet: init + lifecycle
	// -----------------------------
	function destroyMap() {
		if (searchMarker) {
			searchMarker.remove();
			searchMarker = null;
		}
		if (map) {
			map.remove();
			map = null;
		}
		markersLayer = null;
	}

	onMount(() => {
		void loadServices();
		void loadLocations();

		let cancelled = false;

		void (async () => {
			const mod = await import('leaflet');
			if (cancelled) return;

			const L = ((mod as any).default ?? mod) as LeafletModule;
			leaflet = L;

			leafletIcon = L.icon({
				iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
				iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
				shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowSize: [41, 41]
			});
		})();

		return () => {
			cancelled = true;
			destroyMap();
			leaflet = null;
			leafletIcon = null;
		};
	});

	$effect(() => {
		// Only keep the map alive while the location step is visible
		if (step !== 'location') {
			destroyMap();
			return;
		}

		if (!leaflet || !leafletIcon || !mapEl) return;

		if (!map) {
			map = leaflet.map(mapEl, { zoomControl: true }).setView([43.6532, -79.3832], 10);

			leaflet
				.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 19,
					attribution: '&copy; OpenStreetMap contributors'
				})
				.addTo(map);

			markersLayer = leaflet.layerGroup().addTo(map);
		}

		void tick().then(() => map?.invalidateSize());
	});

	$effect(() => {
		// Rebuild markers when locations/selection changes
		if (!leaflet || !leafletIcon || !map || !markersLayer) return;

		markersLayer.clearLayers();

		for (const loc of locations) {
			const isSelected = formData.location === loc.id;
			const marker = leaflet.marker([loc.lat, loc.lng], { icon: leafletIcon });

			marker.bindPopup(
				`<div style="min-width: 200px;">
					<div style="font-weight: 600; margin-bottom: 2px;">${loc.name}</div>
					<div style="font-size: 12px; opacity: 0.85;">
						${loc.address}, ${loc.city}, ${loc.province} ${loc.postal}
					</div>
					<div style="margin-top: 8px;">
						<button data-loc="${loc.id}" style="padding: 6px 10px; border-radius: 10px; border: 1px solid #ccc; cursor: pointer;">
							${isSelected ? 'Selected' : 'Select this location'}
						</button>
					</div>
				</div>`
			);

			marker.on('popupopen', (ev: LeafletNS.PopupEvent) => {
				const el = ev.popup.getElement();
				const btn = el?.querySelector(`button[data-loc="${loc.id}"]`) as HTMLButtonElement | null;
				if (btn) btn.onclick = () => selectLocation(loc);
			});

			marker.addTo(markersLayer);
		}
	});

	// -----------------------------
	// Location actions + search
	// -----------------------------
	function selectLocation(loc: LocationT) {
		formData = { ...formData, location: loc.id };

		// zoom/focus map, but DO NOT advance step
		if (map) map.setView([loc.lat, loc.lng], Math.max(map.getZoom(), 13), { animate: true });
	}

	async function geocodeToCenter(q: string) {
		const url = new URL('https://nominatim.openstreetmap.org/search');
		url.searchParams.set('format', 'json');
		url.searchParams.set('limit', '1');
		url.searchParams.set('q', q);

		const r = await fetch(url.toString(), { headers: { 'Accept-Language': 'en' } });
		if (!r.ok) throw new Error('Geocoding failed');

		const data = (await r.json()) as Array<{ lat: string; lon: string; display_name: string }>;
		if (!data.length) return null;

		return {
			lat: Number(data[0].lat),
			lng: Number(data[0].lon),
			label: data[0].display_name
		};
	}

	async function handleSearch(e?: Event) {
		e?.preventDefault();
		searchError = null;

		const q = searchQuery.trim();
		if (!q) {
			searchCenter = null;
			searchLabel = null;

			if (searchMarker && map) {
				searchMarker.remove();
				searchMarker = null;
			}
			return;
		}

		searching = true;
		try {
			const res = await geocodeToCenter(q);
			if (!res) {
				searchError = "Couldn't find that place. Try a different search.";
				return;
			}

			searchCenter = { lat: res.lat, lng: res.lng };
			searchLabel = res.label;

			if (map && leaflet && leafletIcon) {
				map.setView([res.lat, res.lng], 12, { animate: true });
				if (searchMarker) searchMarker.remove();

				searchMarker = leaflet
					.marker([res.lat, res.lng], { icon: leafletIcon })
					.addTo(map)
					.bindPopup(`Search: ${res.label}`)
					.openPopup();
			}
		} catch (err) {
			console.error(err);
			searchError = "Couldn't search right now. Try again.";
		} finally {
			searching = false;
		}
	}

	// -----------------------------
	// Availability effects
	// -----------------------------
	$effect(() => {
		if (formData.location == null) return;

		const vm = viewMonth;
		let cancelled = false;

		void (async () => {
			const map = await getMonthAvailabilityMapCached({
				fetchFn: fetch,
				month: vm,
				slotMinutes: DEFAULT_SLOT_MINUTES,
				concurrency: 6
			});
			if (cancelled) return;
			monthAvail = { ...monthAvail, ...map };
		})();

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (!formData.date || step !== 'datetime') return;
		if (formData.location == null) return;

		let cancelled = false;
		loadingTimes = true;
		timesError = null;

		void (async () => {
			try {
				const data = await getDayAvailabilityCached({
					fetchFn: fetch,
					dateISO: formData.date,
					slotMinutes: DEFAULT_SLOT_MINUTES
				});
				if (cancelled) return;

				availableTimes = data.times || [];
				holidayInfo = {
					label: data.holidayLabel ?? null,
					comment: data.holidayComment ?? null,
					isOpenOverride: data.isOpenOverride ?? null
				};
			} catch (err: any) {
				if (cancelled) return;
				console.error('Error loading availability:', err);
				timesError = "Couldn't load available times. Try again.";
			} finally {
				if (!cancelled) loadingTimes = false;
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	// -----------------------------
	// Booking actions
	// -----------------------------
	function handlePickDate(iso: string | null) {
		if (!iso) return;
		if (formData.location == null) return;

		const isTodayISO = iso === todayLocalISO();
		const knownNoSlots = monthAvail[iso] === false;
		if (isPastDateISO(iso) || (!isTodayISO && knownNoSlots)) return;

		formData = { ...formData, date: iso, time: '' };
		availableTimes = [];
		holidayInfo = null;
	}

	function handlePickTime(valueHHmm: string) {
		formData = { ...formData, time: valueHHmm };
		step = 'details';
	}

	async function submitForm(e: SubmitEvent) {
		e.preventDefault();

		if (formData.location == null) return alert('Please choose a location.');
		if (!formData.date || !formData.time) return alert('Please choose a date and time.');
		if (!formData.duration) return alert('Please choose a duration.');
		if (formData.phoneNumber && !isValidNANP(formData.phoneNumber))
			return alert('Invalid phone number. Enter 10 digits, or 11 starting with 1.');
		if (!formData.type) return alert('Please choose a type of appointment.');

		const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
		if (selectedDateTime < new Date())
			return alert('Appointment date and time cannot be in the past.');

		try {
			const bookedDate = formData.date;
			const response = await fetch('/api/BookAppointment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				invalidateAvailabilityForDate(bookedDate, DEFAULT_SLOT_MINUTES);

				alert(`Appointment scheduled on ${formData.date} at ${formData.time}`);

				formData = {
					name: '',
					phoneNumber: '',
					email: '',
					location: null,
					date: '',
					time: '',
					duration: '',
					type: '',
					comments: ''
				};

				availableTimes = [];
				holidayInfo = null;
				step = 'location';
				return;
			}

			const payload = await response.json().catch(async () => ({
				message: await response.text().catch(() => 'Unknown error')
			}));

			if (response.status === 409)
				alert(payload?.message || 'Time conflict with another appointment');
			else if (response.status === 400)
				alert(payload?.message || 'Invalid input. Please check your entries.');
			else alert(payload?.message || 'Failed to schedule appointment.');
		} catch (error) {
			console.error('Error submitting appointment:', error);
			alert('Error submitting appointment');
		}
	}

	function goToStep(s: Step) {
		if (s === 'datetime' && formData.location == null) return;
		if (s === 'datetime' && (formData.location == null || !formData.date)) return;
		if (s === 'details' && (formData.location == null || !formData.date || !formData.time)) return;
		step = s;
	}
</script>

<div class="mx-auto max-w-6xl px-4 pb-16">
	<h1 class="mb-6 text-center text-3xl font-bold">Book Your Appointment</h1>

	<!-- Steps -->
	<div class="mb-6 flex items-center justify-center gap-2 text-sm">
		{#each STEPS as s, i}
			{@const active = step === s}
			{@const completed = stepIdx(step) > i}

			{@const clickable =
				(completed &&
					(s !== 'datetime' || formData.location != null) &&
					(s !== 'details' || (formData.location != null && formData.date && formData.time))) ||
				(active && s === step)}

			<div class="flex items-center">
				{#if clickable && !active}
					<button
						type="button"
						onclick={() => goToStep(s)}
						aria-label={`Go back to ${s} step`}
						class={`rounded-full border px-3 py-1 transition ${
							active
								? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500 dark:text-white'
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
								? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500 dark:text-white'
								: 'border-gray-300 bg-zinc-100 text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100'
						}`}
						aria-current={active ? 'step' : undefined}
					>
						{i + 1}. {s.toUpperCase()}
					</div>
				{/if}

				{#if i < STEPS.length - 1}
					<span class="mx-2 text-gray-500 dark:text-gray-400">—</span>
				{/if}
			</div>
		{/each}
	</div>

	<!-- STEP: LOCATION -->
	{#if step === 'location'}
		<section
			class="mx-auto max-w-6xl rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
		>
			<div class="mb-3 flex items-center justify-between gap-3">
				<div>
					<h2 class="text-xl font-semibold">Choose a location</h2>
					<p class="text-sm text-gray-600 dark:text-gray-300">
						Search a place/address, then pick the nearest location.
					</p>
				</div>

				{#if selectedLocation}
					<div class="text-right text-sm">
						<div class="text-gray-600 dark:text-gray-300">Selected</div>
						<div class="font-semibold">{selectedLocation.name}</div>
					</div>
				{/if}
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<!-- Map -->
				<div class="rounded-2xl border border-gray-200 p-3 dark:border-zinc-700">
					<form onsubmit={handleSearch} class="mb-3 flex gap-2">
						<input
							class="w-full rounded border border-gray-300 bg-white p-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
							placeholder="Search city, address, postal code…"
							bind:value={searchQuery}
						/>
						<button
							type="submit"
							class="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
							disabled={searching}
						>
							{searching ? 'Searching…' : 'Search'}
						</button>
					</form>

					{#if searchError}
						<div class="mb-2 text-sm text-red-600 dark:text-red-400">{searchError}</div>
					{:else if searchLabel}
						<div class="mb-2 text-xs text-gray-600 dark:text-gray-300">
							Sorting by distance from: <span class="font-medium">{searchLabel}</span>
							<button
								type="button"
								class="ml-2 underline hover:no-underline"
								onclick={() => {
									searchQuery = '';
									searchCenter = null;
									searchLabel = null;
									searchError = null;
									if (searchMarker) {
										searchMarker.remove();
										searchMarker = null;
									}
								}}
							>
								Clear
							</button>
						</div>
					{/if}

					<div bind:this={mapEl} class="h-[420px] w-full rounded-xl"></div>

					<div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
						Tip: click a pin to select a location.
					</div>
				</div>

				<!-- List -->
				<div class="rounded-2xl border border-gray-200 p-3 dark:border-zinc-700">
					<div class="mb-2 flex items-center justify-between">
						<h3 class="font-semibold">Locations</h3>
						{#if locationsLoading}
							<span class="text-xs text-gray-500 dark:text-gray-400">Loading…</span>
						{/if}
					</div>

					{#if locationsError}
						<div
							class="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
						>
							{locationsError}
						</div>
					{:else if locations.length === 0}
						<p class="text-sm text-gray-600 dark:text-gray-300">No locations available.</p>
					{:else}
						<div class="max-h-[460px] space-y-2 overflow-auto pr-1">
							{#each locationsSorted as loc}
								{@const isSelected = formData.location === loc.id}
								<button
									type="button"
									class={`w-full rounded-xl border p-3 text-left transition ${
										isSelected
											? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500 dark:text-white'
											: 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:hover:bg-zinc-800'
									}`}
									onclick={() => selectLocation(loc)}
								>
									<div class="flex items-start justify-between gap-3">
										<div>
											<div class="font-semibold">{loc.name}</div>
											<div
												class={`mt-1 text-xs ${isSelected ? 'opacity-90' : 'text-gray-600 dark:text-gray-300'}`}
											>
												{loc.address}, {loc.city}, {loc.province}
												{loc.postal}
											</div>
										</div>

										{#if loc.distanceMeters != null}
											<div
												class={`text-xs font-medium ${isSelected ? 'opacity-90' : 'text-gray-600 dark:text-gray-300'}`}
											>
												{formatDistance(loc.distanceMeters)}
											</div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			{#if selectedLocation}
				<div class="mt-4 flex justify-end">
					<button
						type="button"
						class="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
						onclick={() => (step = 'datetime')}
					>
						Next →
					</button>
				</div>
			{/if}
		</section>

		<!-- STEP: DATE+TIME (calendar left, times right) -->
	{:else if step === 'datetime'}
		<div class="grid items-start gap-6 md:grid-cols-2">
			<section
				class="rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
			>
				{@render CalendarBody()}
			</section>

			<section
				class="rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
			>
				{#if formData.location == null}
					<p class="text-gray-700 dark:text-gray-200">Choose a location first.</p>
				{:else if !formData.date}
					<p class="text-gray-700 dark:text-gray-200">Pick a date to see available times.</p>
				{:else}
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
								<p>
									We are closed for <span class="font-semibold">{holidayInfo.label}</span>.
								</p>
								{#if holidayInfo.comment}
									<p class="text-sm text-gray-600 dark:text-gray-300">{holidayInfo.comment}</p>
								{/if}
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
											class="invisible w-full rounded-xl border px-3 py-2"
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
											class="invisible w-full rounded-xl border px-3 py-2"
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
				{/if}
			</section>
		</div>

		<!-- STEP: DETAILS (calendar left, details right) -->
	{:else if step === 'details'}
		<div class="grid items-start gap-6 md:grid-cols-2">
			<!-- Keep calendar visible on the left -->
			<section
				class="rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
			>
				{@render CalendarBody()}
			</section>

			<!-- Details replaces time panel on the right -->
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
								})}
								· {humanTimeLabel(formData.time)}
							</div>

							{#if selectedLocation}
								<div class="mt-1 text-xs text-gray-600 dark:text-gray-300">
									Location: <span class="font-medium">{selectedLocation.name}</span>
								</div>
							{/if}
						</div>

						<div class="flex gap-2">
							<button
								type="button"
								onclick={() => (step = 'datetime')}
								class="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-zinc-700 dark:hover:bg-zinc-800"
							>
								Change date/time
							</button>

							<button
								type="button"
								onclick={() => (step = 'location')}
								class="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-zinc-700 dark:hover:bg-zinc-800"
							>
								Change location
							</button>
						</div>
					</div>
				</div>

				<form
					onsubmit={submitForm}
					class="rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-zinc-700 dark:bg-zinc-900"
				>
					<label class="mb-4 block text-left font-bold">
						Name :
						<input
							type="text"
							name="name"
							bind:value={formData.name}
							required
							placeholder="John Appleseed"
							class="mt-1 box-border w-full rounded border border-gray-300 p-2.5 text-base focus:ring-2 focus:ring-gray-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
						/>
					</label>

					<label class="mb-4 block text-left font-bold">
						Phone Number :
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
							placeholder="example@gmail.com"
							class="mt-1 box-border w-full rounded border border-gray-300 p-2.5 text-base focus:ring-2 focus:ring-gray-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
						/>
					</label>

					<div class="mb-4 text-left font-bold">
						<div class="mb-1">Type of Appointment*</div>

						<button
							type="button"
							class="flex w-full items-center justify-between rounded border border-gray-300 bg-white px-3 py-2.5 text-left text-base text-gray-900 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:hover:bg-zinc-800 dark:focus:ring-zinc-600"
							onclick={() => (showServiceModal = true)}
							aria-haspopup="dialog"
							aria-expanded={showServiceModal}
						>
							<span class="truncate">{formData.type ? formData.type : 'Type of Appointment'}</span>
							<span class="ml-3 text-gray-500 dark:text-gray-300">{'>'}</span>
						</button>

						{#if formData.type}
							<div class="mt-1 text-xs font-normal text-gray-600 dark:text-gray-300">
								Selected: {formData.type}
								<button
									type="button"
									class="ml-2 underline hover:no-underline"
									onclick={() => (formData = { ...formData, type: '' })}
								>
									Clear
								</button>
							</div>
						{/if}
					</div>

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
						Additional Information:
						<textarea
							name="comments"
							bind:value={formData.comments}
							class="mt-1 box-border w-full rounded border border-gray-300 p-2.5 text-base focus:ring-2 focus:ring-gray-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 dark:focus:ring-zinc-600"
						></textarea>
					</label>

					<button
						type="submit"
						class="mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
					>
						Place Appointment
					</button>
				</form>
			</section>
		</div>
	{/if}
</div>

{#snippet CalendarBody()}
	{#if formData.location == null}
		<div
			class="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
		>
			Please choose a location first.
			<button
				type="button"
				class="ml-2 underline hover:no-underline"
				onclick={() => (step = 'location')}
			>
				Go to location →
			</button>
		</div>
	{/if}

	<header class="mb-2 flex items-center justify-between">
		<button
			type="button"
			onclick={() => (viewMonth = addMonths(viewMonth, -1))}
			class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-zinc-700 dark:hover:bg-zinc-800"
			aria-label="Previous month"
			disabled={formData.location == null}
		>
			◀
		</button>

		<h2 class="text-lg font-semibold">
			{viewMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
		</h2>

		<button
			type="button"
			onclick={() => (viewMonth = addMonths(viewMonth, +1))}
			class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-zinc-700 dark:hover:bg-zinc-800"
			aria-label="Next month"
			disabled={formData.location == null}
		>
			▶
		</button>
	</header>

	<div class="mb-2 grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400">
		{#each WEEKDAYS as d}<div class="py-2">{d}</div>{/each}
	</div>

	<div class="grid grid-cols-7 gap-1" role="grid" aria-disabled={formData.location == null}>
		{#each weeks as row}
			{#each row as cell}
				{#if !cell.date}
					<div class="aspect-square rounded-xl border border-transparent"></div>
				{:else}
					{@const base = 'aspect-square rounded-xl flex items-center justify-center select-none'}
					{@const todayRing = cell.isToday ? ' ring-2 ring-blue-600/40 dark:ring-blue-400/50' : ''}

					{@const disabledStyle =
						'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600'}

					{@const normalStyle =
						'cursor-pointer border border-gray-300 bg-zinc-100 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700'}

					{@const selectedStyle =
						'cursor-pointer border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500 dark:text-white'}

					{@const style =
						cell.disabled || formData.location == null
							? disabledStyle
							: cell.isSelected
								? selectedStyle
								: normalStyle}

					<button
						type="button"
						onclick={() => handlePickDate(cell.iso)}
						disabled={cell.disabled || formData.location == null}
						class={`${base} ${style}${todayRing}`}
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

{#if showServiceModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Choose a service"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				showServiceModal = false;
			}
		}}
		tabindex="0"
	>
		<button
			type="button"
			class="absolute inset-0 bg-black/40"
			aria-label="Close modal"
			onclick={() => (showServiceModal = false)}
		></button>

		<div
			class="relative z-10 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
		>
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Choose a service</h2>
				<button
					class="rounded border px-2 py-1 text-sm hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
					onclick={() => (showServiceModal = false)}
				>
					Close
				</button>
			</div>

			{#if servicesLoading}
				<p class="text-sm text-gray-600 dark:text-gray-300">Loading services…</p>
			{:else if servicesError}
				<div
					class="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
				>
					{servicesError}
				</div>
			{:else if services.length === 0}
				<p class="text-sm text-gray-600 dark:text-gray-300">No services available.</p>
			{:else}
				<div class="space-y-3">
					{#each services as s}
						<div class="rounded-xl border border-gray-200 p-3 dark:border-zinc-700">
							<div class="flex items-start justify-between gap-3">
								<div>
									<div class="text-base font-semibold">{s.name}</div>
									{#if s.description}
										<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{s.description}</p>
									{/if}
								</div>
								<div class="text-sm font-medium">{formatMoney(s.price)}</div>
							</div>

							<div class="mt-3 flex justify-end">
								<button
									type="button"
									class="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
									onclick={() => pickService(s)}
								>
									Select
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
