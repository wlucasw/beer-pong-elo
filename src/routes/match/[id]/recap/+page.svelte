<script lang="ts">
	import { onMount } from 'svelte';
	import { Card } from 'flowbite-svelte';
	import GameRecap from '$lib/components/GameRecap.svelte';

	export let params;
	let match: any = null;
	let shots: {
		player: string;
		cup: number;
		hit: boolean;
		team: 'A' | 'B';
		sequence: number;
	}[] = [];
	let loading = true;

	onMount(async () => {
		const res = await fetch(`/api/match/${params.id}`);
		match = await res.json();

		const recapRes = await fetch(`/api/match/${params.id}/recap`);
		shots = await recapRes.json();

		loading = false;
	});

	// Stats helpers
	function playerStats(player: string) {
		const pShots = shots.filter((s) => s.player === player);
		const hits = pShots.filter((s) => s.hit).length;
		const misses = pShots.filter((s) => !s.hit).length;
		const rate = pShots.length > 0 ? Math.round((hits / pShots.length) * 100) : 0;

		return { shots: pShots.length, hits, misses, rate };
	}

	function teamStats(team: 'A' | 'B') {
		const tShots = shots.filter((s) => s.team === team);
		const hits = tShots.filter((s) => s.hit).length;
		const rate = tShots.length > 0 ? Math.round((hits / tShots.length) * 100) : 0;
		return { shots: tShots.length, hits, rate };
	}
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	{#if loading}
		<p>Loading...</p>
	{:else}
		<h1 class="text-2xl font-bold">📊 Match Recap #{match.id}</h1>

		<!-- Team statistics -->
		<div class="grid w-full max-w-4xl grid-cols-2 gap-6">
			<Card class="p-4">
				<h2 class="mb-2 font-semibold text-blue-600">Team Amine</h2>
				<p>Nombre de tirs: {teamStats('A').shots}</p>
				<p>Verre mis: {teamStats('A').hits}</p>
				<p>Précision: {teamStats('A').rate}%</p>

				<h3 class="mt-4 font-semibold">Players</h3>
				<ul>
					{#each match.teamAmineSide as entry}
						<li>
							{entry.player.name} — {playerStats(entry.player.name).hits}/
							{playerStats(entry.player.name).shots} ({playerStats(entry.player.name).rate}%)
						</li>
					{/each}
				</ul>
			</Card>

			<Card class="p-4">
				<h2 class="mb-2 font-semibold text-red-600">Team Robin</h2>
				<p>Nombre de tirs: {teamStats('B').shots}</p>
				<p>Verre mis: {teamStats('B').hits}</p>
				<p>Précision: {teamStats('B').rate}%</p>

				<h3 class="mt-4 font-semibold">Players</h3>
				<ul>
					{#each match.teamRobinSide as entry}
						<li>
							{entry.player.name} — {playerStats(entry.player.name).hits}/
							{playerStats(entry.player.name).shots} ({playerStats(entry.player.name).rate}%)
						</li>
					{/each}
				</ul>
			</Card>
		</div>

		<!-- Shot recap table -->
		<div class="overflow-x-auto" style="max-width: 90vw;">
			<div class="min-w-max">
				<GameRecap {shots} />
			</div>
		</div>
	{/if}
</main>
