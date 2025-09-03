<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Card } from 'flowbite-svelte';
	import CupTriangle from '$lib/components/CupTriangle.svelte';
	import GameRecap from '$lib/components/GameRecap.svelte';
	import { goto } from '$app/navigation';

	export let params;
	let match: any = null;
	let loading = true;
	let selectedCup: number | null = null;

	let shots: { player: string; cup: number; hit: boolean; team: 'A' | 'B'; sequence: number }[] =
		[];

	const cups = [[1], [2, 3], [4, 5, 6], [7, 8, 9, 10]];

	$: isGameOverPlausible =
		shots.filter((s) => s.team === 'A' && s.hit && s.cup).length === 10 ||
		shots.filter((s) => s.team === 'B' && s.hit && s.cup).length === 10;

	$: showWinnerModal = false;

	$: isHitA = (cup: number) => shots.some((s) => s.cup === cup && s.team === 'A' && s.hit);
	$: isHitB = (cup: number) => shots.some((s) => s.cup === cup && s.team === 'B' && s.hit);

	onMount(async () => {
		const res = await fetch(`/api/match/${params.id}`);
		match = await res.json();
		const recapRes = await fetch(`/api/match/${params.id}/recap`);
		const recapData: {
			player: string;
			cup: number;
			hit: boolean;
			team: 'A' | 'B';
			sequence: number;
		}[] = await recapRes.json();
		shots = recapData || [];
		loading = false;
	});

	async function recordShot(playerId: number, hit: boolean, team: 'A' | 'B') {
		const lastShot = shots
			.filter((s) => s.team === team)
			.sort((a, b) => b.sequence - a.sequence)[0];

		const nextSequence = lastShot ? lastShot.sequence + 1 : 1;

		await fetch('/api/shot', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				matchId: match.id,
				playerId,
				hit,
				cup: hit ? selectedCup : null,
				team,
				sequence: nextSequence
			})
		});

		// Add to local shots for live view
		const playerName =
			match.teamAmineSide.find((p: { playerId: number }) => p.playerId === playerId)?.player.name ||
			match.teamRobinSide.find((p: { playerId: number }) => p.playerId === playerId)?.player.name;

		shots = [
			...shots,
			{ player: playerName, cup: selectedCup ?? 0, hit, team, sequence: nextSequence }
		];

		selectedCup = null;
	}

	function cupsRemaining(team: 'A' | 'B') {
		const teamShots = shots.filter((s) => s.team === team && s.hit && s.cup);
		return 10 - new Set(teamShots.map((s) => s.cup)).size;
	}

	function isLastStandingCup(cup: number, team: 'A' | 'B') {
		const teamShots = shots.filter((s) => s.team === team && s.hit && s.cup);
		const uniqueCups = Array.from(new Set(teamShots.map((s) => s.cup)));
		if (uniqueCups.length < 10) return false;
		const lastHit = teamShots.sort((a, b) => b.sequence - a.sequence)[0];
		return lastHit && lastHit.cup === cup;
	}
	async function endGame(winner: 'A' | 'B') {
		await fetch(`/api/match/${match.id}/end`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ winner })
		});

		goto(`/match/${match.id}/recap`);
	}
	async function undoLastShot() {
		if (shots.length === 0) return;

		// Get last shot
		const lastShot = shots[shots.length - 1];

		// Optimistically remove locally
		shots = shots.slice(0, -1);

		try {
			// If your backend supports deleting last shot:
			await fetch(`/api/match/${match.id}/undo`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sequence: lastShot.sequence, team: lastShot.team })
			});

			// Re-fetch recap from backend to sync state
			const recapRes = await fetch(`/api/match/${match.id}/recap`);
			const recapData = await recapRes.json();
			shots = recapData || [];
		} catch (err) {
			console.error('Undo failed:', err);
			// Rollback in case of failure
			shots = [...shots, lastShot];
		}
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
					isHit={isHitA}
				/>

				<div class="mt-2">
					{#each match.teamAmineSide as entry}
						<div class="my-2 flex items-center justify-between">
							<span class="mr-2">{entry.player.name}</span>
							<div class="space-x-2">
								<Button
									size="xs"
									class="mb-2"
									onclick={() => recordShot(entry.playerId, true, 'A')}
									disabled={selectedCup === null}>✅ Hit</Button
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
					isHit={isHitB}
				/>
				<div class="mt-2">
					{#each match.teamRobinSide as entry}
						<div class="my-2 flex items-center justify-between">
							<span class="mr-2">{entry.player.name}</span>
							<div class="space-x-2">
								<Button
									size="xs"
									class="mb-2"
									onclick={() => recordShot(entry.playerId, true, 'B')}
									disabled={selectedCup === null}>✅ Hit</Button
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
		<div class="mt-6">
			<div class="mt-6 flex gap-4">
				<Button color="gray" size="md" onclick={undoLastShot} disabled={shots.length === 0}
					>↩️ Undo Last</Button
				>

				<Button
					color="red"
					size="md"
					onclick={() => (showWinnerModal = true)}
					disabled={!isGameOverPlausible}>🏁 Fin de partie</Button
				>
			</div>
			{#if showWinnerModal}
				<div class="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
					<div class="min-w-[300px] rounded-lg bg-white p-6 shadow-lg">
						<h3 class="mb-4 text-lg font-semibold">Sélectionnez l'équipe gagnante</h3>
						<div class="flex flex-col gap-3">
							<Button color="blue" onclick={() => endGame('A')}>
								🏆 {match.teamAmineSide[0]?.teamName || 'Team Amine'}
							</Button>
							<div class="mb-2 ml-2 text-xs text-gray-500">
								{#each match.teamAmineSide as entry, i}
									{entry.player.name}{i < match.teamAmineSide.length - 1 ? ', ' : ''}
								{/each}
							</div>
							<Button color="red" onclick={() => endGame('B')}>
								🏆 {match.teamRobinSide[0]?.teamName || 'Team Robin'}
							</Button>
							<div class="mb-2 ml-2 text-xs text-gray-500">
								{#each match.teamRobinSide as entry, i}
									{entry.player.name}{i < match.teamRobinSide.length - 1 ? ', ' : ''}
								{/each}
							</div>
						</div>
						<Button class="mt-4" color="gray" onclick={() => (showWinnerModal = false)}
							>Annuler</Button
						>
					</div>
				</div>
			{/if}
		</div>

		<!-- Live shot history -->
		{#if shots.length}
			<div class="overflow-x-auto" style="max-width: 90vw;">
				<div class="min-w-max">
					<GameRecap {shots} />
				</div>
			</div>
		{/if}
	{/if}
</main>
