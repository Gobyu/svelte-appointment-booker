<script lang="ts">
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import DefaultNavbar from '$lib/components/default-navbar.svelte';
	import { page } from '$app/state';
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


<DefaultNavbar orgName="Happy Family" />


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
