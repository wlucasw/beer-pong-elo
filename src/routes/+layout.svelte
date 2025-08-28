<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<!-- Header (always visible) -->
<header class="flex items-center justify-between bg-gray-900 p-4 text-white shadow">
	<a href="/" class="flex items-center gap-2 text-2xl font-bold"> 🍺 Beer Pong Tracker </a>
	<nav class="space-x-4">
		<a href="/leaderboard" class="hover:underline">Leaderboard</a>
		<a href="/history" class="hover:underline">History</a>
	</nav>
</header>

<!-- Page-specific content goes here -->
<main class="p-6">
	{@render children?.()}
</main>
