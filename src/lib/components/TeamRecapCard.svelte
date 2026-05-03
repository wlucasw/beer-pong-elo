<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import type { Shot } from '$lib/types';

	export let teamName: string;
	export let players: { player: { name: string } }[];
	export let shots: Shot[];
	export let team: 'A' | 'B';

	function teamStats() {
		const tShots = shots.filter((s) => s.team === team);
		const hits = tShots.filter((s) => s.hit).length;
		const rate = tShots.length > 0 ? Math.round((hits / tShots.length) * 100) : 0;
		return { shots: tShots.length, hits, rate };
	}

	function playerStats(player: string) {
		const pShots = shots.filter((s) => s.player === player);
		const hits = pShots.filter((s) => s.hit).length;
		const misses = pShots.filter((s) => !s.hit).length;
		const rate = pShots.length > 0 ? Math.round((hits / pShots.length) * 100) : 0;
		return { shots: pShots.length, hits, misses, rate };
	}

	$: stats = teamStats();
	$: colorClass = team === 'A' ? 'text-blue-600' : 'text-red-600';
</script>

<Card class="p-4">
	<h2 class="mb-2 font-semibold {colorClass}">{teamName}</h2>
	<p>Nombre de tirs: {stats.shots}</p>
	<p>Verre mis: {stats.hits}</p>
	<p>Précision: {stats.rate}%</p>
	<h3 class="mt-4 font-semibold">Players</h3>
	<ul>
		{#each players as entry}
			<li>
				{entry.player.name} — {playerStats(entry.player.name).hits}/
				{playerStats(entry.player.name).shots} ({playerStats(entry.player.name).rate}%)
			</li>
		{/each}
	</ul>
</Card>
