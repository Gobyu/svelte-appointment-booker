<script lang="ts">
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import MassageNavbar from '$lib/components/massage-navbar.svelte';
	import FarmNavbar from '$lib/components/farm-navbar.svelte';
	import DefaultNavbar from '$lib/components/default-navbar.svelte';
	import { page } from '$app/state';

	const data = $derived(page.data);

	// hostname like: massage.example.com, farm.example.com, example.com
	const hostname = $derived(page.url.hostname);

	// optional fallback for localhost or when you route via /massage/* instead of subdomains
	const pathname = $derived(page.url.pathname);

	const isMassage = $derived(hostname.startsWith('massage.') || pathname.startsWith('/massage'));
	const isFarm = $derived(hostname.startsWith('farm.') || pathname.startsWith('/farm'));
	const { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link
		rel="stylesheet"
		href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
		integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
		crossorigin=""
	/>
</svelte:head>

{#if isMassage}
	<MassageNavbar orgName="Happy Family Massages" user={data.user} />
{:else if isFarm}
	<FarmNavbar orgName="Happy Family Farm" user={data.user} />
{:else}
	<DefaultNavbar orgName="Happy Family" />
{/if}

<div class="min-h-dvh bg-white text-gray-900 dark:bg-zinc-950 dark:text-gray-100">
	{@render children?.()}
</div>
<div style="display:none">
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })}>
			{locale}
		</a>
	{/each}
</div>
