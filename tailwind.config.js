/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: ['./src/**/*.{svelte,js,ts,html}'],
	theme: {
		extend: {
			colors: { _probe: '#ff00aa' }
		}
	}
};
