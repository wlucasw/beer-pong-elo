<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from 'flowbite-svelte';
	import TeamRecordCard from '$lib/components/TeamRecordCard.svelte';
	import GameRecap from '$lib/components/GameRecap.svelte';
	import { navigate } from '$lib/router';

	export let params: { id?: string } = {};
	let isTeamAmineFirst: boolean | undefined;
	let match: any = null;
	let loading = true;
	let selectedCups: number[] = [];

	let shots: {
		player: string;
		cup: number;
		bounceCup?: number;
		hit: boolean;
		round: number;
		team: 'A' | 'B';
		sequence: number;
	}[] = [];

	const cups = [[1], [3, 2], [6, 5, 4], [10, 9, 8, 7]];
	const routeId = () =>
		params?.id ??
		(typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : undefined);

	$: scoreAmine = '';
	$: scoreRobin = '';

	$: showWinnerModal = false;
	$: showQuickEndButton = false;

	$: isHitA = (cup: number) =>
		shots.some((s) => (s.cup === cup || s.bounceCup === cup) && s.team === 'A' && s.hit);
	$: isHitB = (cup: number) =>
		shots.some((s) => (s.cup === cup || s.bounceCup === cup) && s.team === 'B' && s.hit);

	$: currentRound = 0;
	$: areAllshotsInRoundHits = true;
	$: numberOfShotInCurrentRound = 0;
	$: isTeamAmineFirst = undefined;
	$: isTeamRobinTurn = isTeamAmineFirst ? currentRound % 2 === 1 : currentRound % 2 !== 0;
	$: isFirstShot = true;

	onMount(async () => {
		const id = routeId();
		const res = await fetch(`/api/match/${id}`);
		match = await res.json();
		const recapRes = await fetch(`/api/match/${id}/recap`);
		const recapData: {
			player: string;
			cup: number;
			hit: boolean;
			team: 'A' | 'B';
			round: number;
			sequence: number;
		}[] = await recapRes.json();
		shots = recapData || [];
		currentRound = shots.length ? Math.max(...shots.map((s) => s.round)) : 0;
		isTeamAmineFirst = shots.length ? shots[0].team === 'A' : undefined;
		isFirstShot = shots.length === 0;
		numberOfShotInCurrentRound = shots.filter((s) => s.round === currentRound).length;
		areAllshotsInRoundHits = shots.filter((s) => s.round === currentRound).every((s) => s.hit);
		if (
			(!areAllshotsInRoundHits && numberOfShotInCurrentRound >= match.numberOfShotByMatch) ||
			match.numberOfShotByMatch === 1
		) {
			currentRound += 1;
			areAllshotsInRoundHits = true;
			numberOfShotInCurrentRound = 0;
		}
		loading = false;
	});

	async function recordShot(playerId: number, hit: boolean, team: 'A' | 'B') {
		if (isFirstShot) {
			isTeamAmineFirst = team === 'A';
			isFirstShot = false;
		}
		const lastShot = shots
			.filter((s) => s.team === team)
			.sort((a, b) => b.sequence - a.sequence)[0];
		const nextSequence = lastShot ? lastShot.sequence + 1 : 1;

		areAllshotsInRoundHits = hit && areAllshotsInRoundHits;

		numberOfShotInCurrentRound += 1;

		await fetch('/api/shot', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				matchId: match.id,
				playerId,
				hit,
				cup: hit ? selectedCups[0] : null,
				team,
				round: currentRound,
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
				cup: selectedCups[0] ?? 0,
				hit,
				team,
				sequence: nextSequence,
				round: currentRound
			}
		];
		selectedCups = [];

		if (
			(!areAllshotsInRoundHits && numberOfShotInCurrentRound >= match.numberOfShotByMatch) ||
			match.numberOfShotByMatch === 1
		) {
			currentRound += 1;
			areAllshotsInRoundHits = true;
			numberOfShotInCurrentRound = 0;
		}
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
		navigate(`/match/${match.id}/recap`);
	}

	async function undoLastShot() {
		if (shots.length === 0) return;
		const lastShot = shots[shots.length - 1];
		shots = shots.slice(0, -1);
		try {
			await fetch(`/api/match/${match.id}/undo`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sequence: lastShot.sequence, team: lastShot.team })
			});
			const recapRes = await fetch(`/api/match/${match.id}/recap`);
			const recapData = await recapRes.json();
			shots = recapData || [];
			currentRound = shots.length ? Math.max(...shots.map((s) => s.round)) : 0;
			numberOfShotInCurrentRound = shots.filter((s) => s.round === currentRound).length;
			areAllshotsInRoundHits = shots.filter((s) => s.round === currentRound).every((s) => s.hit);
			if (
				(!areAllshotsInRoundHits && numberOfShotInCurrentRound >= match.numberOfShotByMatch) ||
				match.numberOfShotByMatch === 1
			) {
				currentRound += 1;
				areAllshotsInRoundHits = true;
				numberOfShotInCurrentRound = 0;
			}
			if (shots.length === 0) {
				isTeamAmineFirst = undefined;
				isFirstShot = true;
			}
		} catch (err) {
			console.error('Undo failed:', err);
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
				cups: selectedCups,
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
				round: currentRound,
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

		<div class="grid grid-cols-{isFirstShot ? 2 : 1} gap-6 max-w-4xl">
			{#if !isTeamRobinTurn}
				<TeamRecordCard
					teamName="Team Amine"
					team="A"
					players={match.teamAmineSide}
					{cups}
					bind:selectedCups
					isHit={(cup) => isHitA(cup) && !isLastStandingCup(cup, 'A')}
					isMyTurn={!isTeamRobinTurn || isFirstShot}
					onRecordShot={recordShot}
					onRecordBounce={recordBounce}
				/>
				{#if isFirstShot}
					<TeamRecordCard
						teamName="Robin Side"
						team="B"
						players={match.teamRobinSide}
						{cups}
						bind:selectedCups
						isHit={(cup) => isHitB(cup) && !isLastStandingCup(cup, 'B')}
						isMyTurn={isTeamRobinTurn || isFirstShot}
						onRecordShot={recordShot}
						onRecordBounce={recordBounce}
					/>
				{/if}
			{:else}
				<TeamRecordCard
					teamName="Robin Side"
					team="B"
					players={match.teamRobinSide}
					{cups}
					bind:selectedCups
					isHit={(cup) => isHitB(cup) && !isLastStandingCup(cup, 'B')}
					isMyTurn={isTeamRobinTurn || isFirstShot}
					onRecordShot={recordShot}
					onRecordBounce={recordBounce}
				/>
			{/if}
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
								<label class="text-sm" for="scoreAmine">Ecocups restante</label>
								<div class="flex flex-col">
									<input
										type="number"
										min="0"
										class="mt-1 w-28 rounded border px-2 py-1"
										id="scoreAmine"
										bind:value={scoreAmine}
										placeholder="Amine Side"
									/>
								</div>
								<div class="flex flex-col">
									<input
										type="number"
										min="0"
										class="mt-1 w-28 rounded border px-2 py-1"
										id="scoreRobin"
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

		{#if shots.length}
			<div class="overflow-x-auto" style="max-width: 90vw; direction: rtl;">
				<div class="min-w-max" style="direction: ltr;">
					<GameRecap {shots} />
				</div>
			</div>
		{/if}
	{/if}
</main>
