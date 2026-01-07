import { paraglideVitePlugin } from '@inlang/paraglide-js';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'cookie', 'localStorage', 'baseLocale'],
			urlPatterns: [
				{
					pattern: '/',
					localized: [
						['fr', '/fr'],
						['zh-Hans', '/zh-Hans'],
						['zh-Hant', '/zh-Hant'],
						['en', '/']
					]
				},

				{
					pattern: '/:path(.*)?',
					localized: [
						['fr', '/fr/:path(.*)?'],
						['zh-Hans', '/zh-Hans/:path(.*)?'],
						['zh-Hant', '/zh-Hant/:path(.*)?'],

						['en', '/:path(.*)?']
					]
				}
			]
		})
	]
});
