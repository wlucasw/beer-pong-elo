<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	function navigateTo(path: string) {
		window.history.pushState({}, '', path);
		window.dispatchEvent(new PopStateEvent('popstate'));
	}
</script>

<!-- Header (always visible) -->
<header class="flex items-center justify-between bg-gray-900 p-4 text-white shadow">
	<a
		href="/"
		class="flex items-center gap-2 text-2xl font-bold"
		onclick={(e) => { e.preventDefault(); navigateTo('/'); }}
	>
		🍺 Beer Pong Tracker
	</a>
	<nav class="space-x-4">
		<a href="/players" class="hover:underline" onclick={(e) => { e.preventDefault(); navigateTo('/players'); }}
			>Leaderboard</a
		>
		<a href="/history" class="hover:underline" onclick={(e) => { e.preventDefault(); navigateTo('/history'); }}
			>History</a
		>
	</nav>
</header>

<!-- Page-specific content goes here -->
<main class="p-6">
	{@render children?.()}
</main>
