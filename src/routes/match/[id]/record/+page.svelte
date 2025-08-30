<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Card } from 'flowbite-svelte';
	import CupTriangle from '$lib/components/CupTriangle.svelte';

	export let params;
	let match: any = null;
	let loading = true;
	let selectedCup: number | null = null;

	let shots: { player: string; cup: number; hit: boolean; team: 'A' | 'B' }[] = [];

	const cups = [[1], [2, 3], [4, 5, 6], [7, 8, 9, 10]];

	onMount(async () => {
		const res = await fetch(`/api/match/${params.id}`);
		match = await res.json();
		loading = false;
	});

	async function recordShot(playerId: number, hit: boolean, team: 'A' | 'B') {
		await fetch('/api/shot', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ matchId: match.id, playerId, hit, cup: hit ? selectedCup : null })
		});

		const playerName =
			match.teamAmineSide.find((p: { playerId: number }) => p.playerId === playerId)?.player.name ||
			match.teamRobinSide.find((p: { playerId: number }) => p.playerId === playerId)?.player.name;

		if (hit && selectedCup !== null) {
			shots = [...shots, { player: playerName, cup: selectedCup, hit, team }];
		} else {
			shots = [...shots, { player: playerName, cup: 0, hit, team }];
		}

		selectedCup = null;
	}

	function cupsRemaining(team: 'A' | 'B') {
		const teamShots = shots.filter((s) => s.team === team && s.hit && s.cup);
		return 10 - new Set(teamShots.map((s) => s.cup)).size;
	}

	function cupHit(cup: number, team: 'A' | 'B') {
		return shots.some((s) => s.cup === cup && s.team === team && s.hit);
	}
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	{#if loading}
		<p>Loading...</p>
	{:else}
		<h1 class="text-xl font-bold">🎯 Record Match #{match.id}</h1>

		<div class="grid w-full max-w-4xl grid-cols-2 gap-6">
			<Card class="p-4">
				<h2 class="font-semibold text-blue-600">Team Amine</h2>
				<p class="mb-2 text-sm">Cups remaining: {cupsRemaining('A')}</p>

				<CupTriangle
					{cups}
					bind:selectedCup
					onSelectCup={(cup) => (selectedCup = cup)}
					isHit={(cup) => cupHit(cup, 'A')}
				/>

				<div class="mt-2">
					{#each match.teamAmineSide as entry}
						<div class="my-2 flex items-center justify-between">
							<span class="mr-2">{entry.player.name}</span>
							<div class="space-x-2">
								<Button size="xs" class="mb-2" onclick={() => recordShot(entry.playerId, true, 'A')}
									>✅ Hit</Button
								>
								<Button size="xs" color="red" onclick={() => recordShot(entry.playerId, false, 'A')}
									>❌ Miss</Button
								>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<Card class="p-4">
				<h2 class="font-semibold text-red-600">Team Robin</h2>
				<p class="mb-2 text-sm">Cups remaining: {cupsRemaining('B')}</p>

				<CupTriangle
					{cups}
					bind:selectedCup
					onSelectCup={(cup) => (selectedCup = cup)}
					isHit={(cup) => cupHit(cup, 'B')}
				/>
				<div class="mt-2">
					{#each match.teamRobinSide as entry}
						<div class="my-2 flex items-center justify-between">
							<span class="mr-2">{entry.player.name}</span>
							<div class="space-x-2">
								<Button size="xs" class="mb-2" onclick={() => recordShot(entry.playerId, true, 'B')}
									>✅ Hit</Button
								>
								<Button size="xs" color="red" onclick={() => recordShot(entry.playerId, false, 'B')}
									>❌ Miss</Button
								>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>

		<!-- Live shot history -->
		<Card class="mt-6 w-full max-w-2xl p-4">
			<h2 class="mb-2 font-semibold">📊 Shot History</h2>
			<table class="w-full border-collapse text-left text-sm">
				<thead>
					<tr class="border-b">
						<th class="p-2">Player</th>
						<th class="p-2">Cup</th>
						<th class="p-2">Result</th>
						<th class="p-2">Team</th>
					</tr>
				</thead>
				<tbody>
					{#each shots as shot}
						<tr class="border-b">
							<td class="p-2">{shot.player}</td>
							<td class="p-2">{shot.cup ?? '-'}</td>
							<td class="p-2">{shot.hit ? '✅ Hit' : '❌ Miss'}</td>
							<td class="p-2">{shot.team === 'A' ? 'Team Amine' : 'Team Robin'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</Card>
	{/if}
</main>
