<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let errorText = $state<string | null>(null);

	const redirectTo = $derived(page.url.searchParams.get('redirect') || '/');

	async function submitLogin(e: SubmitEvent) {
		e.preventDefault();
		if (loading) return;
		errorText = null;
		loading = true;

		try {
			const r = await fetch('/auth/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			if (!r.ok) {
				// try to read structured error from backend
				const msg =
					(await r.json().catch(() => null))?.message ||
					(await r.text().catch(() => '')) ||
					'Login failed';
				throw new Error(msg);
			}

			// cookie is set by backend; just navigate
			await goto(redirectTo, { replaceState: true });
		} catch (err: any) {
			errorText = err?.message ?? 'Unable to log in';
		} finally {
			loading = false;
		}
	}

	function toggleShowPassword() {
		showPassword = !showPassword;
	}
</script>

<div class="mx-auto max-w-md px-4 py-10">
	<h1 class="mb-6 text-center text-3xl font-bold">Log in</h1>

	<!-- error alert -->
	{#if errorText}
		<div
			role="alert"
			class="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
			aria-live="assertive"
		>
			{errorText}
		</div>
	{/if}

	<form
		onsubmit={submitLogin}
		class="rounded-2xl border border-gray-200 bg-white p-5 shadow dark:border-zinc-700 dark:bg-zinc-900"
		novalidate
	>
		<div class="grid gap-4">
			<!-- Email -->
			<div class="grid gap-1">
				<label for="email" class="text-sm font-medium">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
					class="rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
					placeholder="you@example.com"
				/>
			</div>

			<!-- Password with show/hide -->
			<div class="grid gap-1">
				<label for="password" class="text-sm font-medium">Password</label>
				<div class="relative">
					<input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						autocomplete="current-password"
						required
						bind:value={password}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-base outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
						placeholder="••••••••"
					/>
					<button
						type="button"
						class="absolute inset-y-0 right-0 my-1 mr-1 inline-flex items-center justify-center rounded-md border border-gray-300 px-2 text-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-zinc-700 dark:hover:bg-zinc-800"
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						aria-pressed={showPassword}
						onclick={toggleShowPassword}
					>
						{#if showPassword}Hide{:else}Show{/if}
					</button>
				</div>
			</div>

			<!-- Submit -->
			<button
				type="submit"
				class="mt-2 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-60 dark:bg-zinc-100 dark:text-black"
				disabled={loading}
				aria-busy={loading}
			>
				{loading ? 'Signing in…' : 'Sign in'}
			</button>
		</div>
	</form>

	<!-- small helper links -->
	<div class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
		<a href="/register" class="underline hover:no-underline">Create account</a>
		<a href="/forgot" class="underline hover:no-underline">Forgot password?</a>
	</div>
</div>
