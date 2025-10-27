<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';
	const { children } = $props();
	export const load = async ({ locals }: { locals: App.Locals }) => {
		return { user: locals.user ?? null };
	};
	import { page } from '$app/state';
	const data = $derived(page.data);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Navbar orgName="Acme Health" user={data.user} />
<div class="min-h-dvh bg-white text-gray-900 dark:bg-zinc-950 dark:text-gray-100">
	{@render children?.()}
</div>
