<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Card } from 'flowbite-svelte';
	import CupTriangle from '$lib/components/CupTriangle.svelte';
	import GameRecap from '$lib/components/GameRecap.svelte';
	import { goto } from '$app/navigation';

	export let params;
	let match: any = null;
	let loading = true;
	let selectedCups: number[] = [];

	let shots: {
		player: string;
		cup: number;
		bounceCup?: number;
		hit: boolean;
		team: 'A' | 'B';
		sequence: number;
	}[] = [];

	const cups = [[1], [2, 3], [4, 5, 6], [7, 8, 9, 10]];

	$: scoreAmine = '';
	$: scoreRobin = '';

	$: showWinnerModal = false;

	$: showQuickEndButton = false;

	$: isHitA = (cup: number) =>
		shots.some((s) => (s.cup === cup || s.bounceCup === cup) && s.team === 'A' && s.hit);
	$: isHitB = (cup: number) =>
		shots.some((s) => (s.cup === cup || s.bounceCup === cup) && s.team === 'B' && s.hit);

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
				cup: hit ? selectedCups[0] : null,
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
			{ player: playerName, cup: selectedCups[0] ?? 0, hit, team, sequence: nextSequence }
		];

		selectedCups = [];
	}

	function isLastStandingCup(cup: number, team: 'A' | 'B') {
		const teamShots = shots.reduce<number[]>((acc, s) => {
			if (s.bounceCup && s.team === team) {
				acc.push(s.bounceCup);
			}
			return s.team === team && s.hit ? [...acc, s.cup] : acc;
		}, []);
		if (teamShots.length < 10) return false;
		const lastHit = shots
			.filter((s) => s.team === team && s.hit)
			.sort((a, b) => b.sequence - a.sequence)[0];
		return lastHit && lastHit.cup === cup;
	}

	async function endGame(
		winner: 'A' | 'B',
		teamARemainingCups?: number,
		teamBRemainingCups?: number
	) {
		await fetch(`/api/match/${match.id}/end`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ winner, teamARemainingCups, teamBRemainingCups })
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

	async function recordBounce(playerId: number, team: 'A' | 'B') {
		const lastShot = shots
			.filter((s) => s.team === team)
			.sort((a, b) => b.sequence - a.sequence)[0];
		const nextSequence = lastShot ? lastShot.sequence + 1 : 1;

		await fetch('/api/shot/bounce', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				matchId: match.id,
				playerId,
				cups: selectedCups, // two cups
				team,
				sequence: nextSequence
			})
		});

		const playerName =
			match.teamAmineSide.find((p: { playerId: number }) => p.playerId === playerId)?.player.name ||
			match.teamRobinSide.find((p: { playerId: number }) => p.playerId === playerId)?.player.name;

		shots = [
			...shots,
			{
				player: playerName,
				cup: selectedCups[0],
				bounceCup: selectedCups[1],
				hit: true,
				team,
				sequence: nextSequence
			}
		];

		selectedCups = [];
	}
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	{#if loading}
		<p>Loading...</p>
	{:else}
		<h1 class="text-xl font-bold">🎯 Record Match #{match.id}</h1>

		<div class="grid w-full max-w-4xl grid-cols-2 gap-6">
			<Card class="p-4">
				<h2 class="mb-2 font-semibold text-blue-600">Team Amine</h2>

				<CupTriangle
					{cups}
					bind:selectedCups
					onSelectCup={(cup) => {
						if (selectedCups.includes(cup)) {
							selectedCups = selectedCups.filter((c) => c !== cup);
						} else {
							selectedCups = [...selectedCups, cup];
						}
					}}
					isHit={(cup) => isHitA(cup) && !isLastStandingCup(cup, 'A')}
				/>

				<div class="mt-2">
					{#each match.teamAmineSide as entry}
						<div class="my-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
							<span class="mr-2">{entry.player.name}</span>
							<div class="space-x-2">
								<Button
									size="xs"
									class="mb-2"
									onclick={() => recordShot(entry.playerId, true, 'A')}
									disabled={selectedCups.length !== 1}>✅ Touché</Button
								>
								<Button
									size="xs"
									color="red"
									class="mb-2"
									onclick={() => recordShot(entry.playerId, false, 'A')}>❌ Raté</Button
								>
								<Button
									size="xs"
									color="yellow"
									onclick={() => recordBounce(entry.playerId, 'A')}
									disabled={selectedCups.length !== 2}
								>
									🏓 Rebond
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<Card class="p-4">
				<h2 class="mb-2 font-semibold text-red-600">Robin Side</h2>

				<CupTriangle
					{cups}
					bind:selectedCups
					onSelectCup={(cup) => {
						if (selectedCups.includes(cup)) {
							selectedCups = selectedCups.filter((c) => c !== cup);
						} else {
							selectedCups = [...selectedCups, cup];
						}
					}}
					isHit={(cup) => isHitB(cup) && !isLastStandingCup(cup, 'B')}
				/>
				<div class="mt-2">
					{#each match.teamRobinSide as entry}
						<div class="my-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
							<span class="mr-2">{entry.player.name}</span>
							<div class="space-x-2">
								<Button
									size="xs"
									class="mb-2"
									onclick={() => recordShot(entry.playerId, true, 'B')}
									disabled={selectedCups.length !== 1}>✅ Touché</Button
								>
								<Button
									size="xs"
									color="red"
									class="mb-2"
									onclick={() => recordShot(entry.playerId, false, 'B')}>❌ Raté</Button
								>
								<Button
									size="xs"
									color="yellow"
									onclick={() => recordBounce(entry.playerId, 'B')}
									disabled={selectedCups.length !== 2}
								>
									🏓 Rebond
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>
		<div class="mt-6">
			<div class="mt-6 flex gap-4">
				<Button color="gray" size="md" onclick={undoLastShot} disabled={shots.length === 0}
					>↩️ Undo</Button
				>

				<Button color="red" size="md" onclick={() => (showWinnerModal = true)}
					>🏁 Fin de partie</Button
				>
				<Button color="pink" size="md" onclick={() => (showQuickEndButton = true)}
					>⚡ Fin rapide</Button
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
								🏆 {match.teamRobinSide[0]?.teamName || 'Robin Side'}
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

			{#if showQuickEndButton}
				<div class="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
					<div class="min-w-[300px] rounded-lg bg-white p-6 shadow-lg">
						<h3 class="mb-4 text-lg font-semibold">Sélectionnez l'équipe gagnante</h3>
						<div class="flex flex-col gap-3">
							<div class="flex items-center gap-4">
								<label class="text-sm">Ecocups restante </label>
								<div class="flex flex-col">
									<input
										type="number"
										min="0"
										class="mt-1 w-28 rounded border px-2 py-1"
										bind:value={scoreAmine}
										placeholder="Amine Side"
									/>
								</div>

								<div class="flex flex-col">
									<input
										type="number"
										min="0"
										class="mt-1 w-28 rounded border px-2 py-1"
										bind:value={scoreRobin}
										placeholder="Robin Side"
									/>
								</div>
							</div>

							<Button
								color="blue"
								onclick={() => endGame('A', Number(scoreAmine), Number(scoreRobin))}
								disabled={scoreAmine === '' || scoreAmine === undefined || scoreAmine === null}
							>
								🏆 {match.teamAmineSide[0]?.teamName || 'Amine Side'}
							</Button>
							<div class="mb-2 ml-2 text-xs text-gray-500">
								{#each match.teamAmineSide as entry, i}
									{entry.player.name}{i < match.teamAmineSide.length - 1 ? ', ' : ''}
								{/each}
							</div>

							<Button
								color="red"
								onclick={() => endGame('B', Number(scoreAmine), Number(scoreRobin))}
								disabled={scoreRobin === '' || scoreRobin === undefined || scoreRobin === null}
							>
								🏆 {match.teamRobinSide[0]?.teamName || 'Robin Side'}
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
