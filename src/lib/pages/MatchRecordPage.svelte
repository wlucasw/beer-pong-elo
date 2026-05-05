<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from 'flowbite-svelte';
	import TeamRecordCard from '$lib/components/TeamRecordCard.svelte';
	import GameRecap from '$lib/components/GameRecap.svelte';
	import EndGameModal from '$lib/components/EndGameModal.svelte';
	import QuickEndModal from '$lib/components/QuickEndModal.svelte';
	import { navigate } from '$lib/router';
	import type { Shot, ShotPost } from '$lib/types';

	export let params: { id?: string } = {};
	let isTeamAmineFirst: boolean | undefined;
	let match: any = null;
	let loading = true;
	let selectedCups: number[] = [];

	let shots: Shot[] = [];

	const cups = [[1], [3, 2], [6, 5, 4], [10, 9, 8, 7]];
	const routeId = () =>
		params?.id ??
		(typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : undefined);

	let currentRound = 0;
	let areAllShotsInRoundHits = true;
	let numberOfShotsInCurrentRound = 0;
	let isFirstShot = true;
	let showWinnerModal = false;
	let showQuickEndModal = false;
	let isCounter = false;
	let numberToCounter = 0;
	let numberToBeCountered = 0;
	let isToBeCounter = false;

	$: isHitA = (cup: number) =>
		shots.some((s) => (s.cup === cup || s.bounceCup === cup) && s.team === 'A' && s.hit);
	$: isHitB = (cup: number) =>
		shots.some((s) => (s.cup === cup || s.bounceCup === cup) && s.team === 'B' && s.hit);
	$: isTeamRobinTurn =
		isTeamAmineFirst !== undefined && isTeamAmineFirst === true
			? currentRound % 2 === 1
			: currentRound % 2 === 0;

	function computeCounterState(loadedShots: Shot[], matchData: any) {
		let _isCounter = false;
		let _numberToCounter = 0;
		let _isToBeCounter = false;
		let _numberToBeCountered = 0;
		let _areAllShotsInRoundHits = true;
		let _numberOfShotsInCurrentRound = 0;

		for (let i = 0; i < loadedShots.length; i++) {
			const shot = loadedShots[i];
			_areAllShotsInRoundHits = shot.hit && _areAllShotsInRoundHits;
			_numberOfShotsInCurrentRound += 1;

			const numberOfHitsForTeam = loadedShots
				.slice(0, i + 1)
				.filter((s) => s.team === shot.team)
				.reduce<number>((count, s) => (s.bounceCup ? count + 2 : s.hit ? count + 1 : count), 0);

			if (shot.hit && _numberToCounter > 0) {
				_numberToCounter -= 1;
				if (_numberToCounter === 0) _isCounter = false;
			}
			if (shot.hit && numberOfHitsForTeam >= 10) {
				_isToBeCounter = true;
				_numberToBeCountered += 1;
			}

			if (
				(_isToBeCounter && _numberToBeCountered >= matchData.numberOfShotByMatch) ||
				(!_areAllShotsInRoundHits &&
					_numberOfShotsInCurrentRound >= matchData.numberOfShotByMatch) ||
				matchData.numberOfShotByMatch === 1
			) {
				_isCounter = _isToBeCounter;
				_isToBeCounter = false;
				_numberToCounter = _numberToBeCountered;
				_numberToBeCountered = 0;
				_areAllShotsInRoundHits = true;
				_numberOfShotsInCurrentRound = 0;
			}
		}

		return {
			isCounter: _isCounter,
			numberToCounter: _numberToCounter,
			isToBeCounter: _isToBeCounter,
			numberToBeCountered: _numberToBeCountered
		};
	}

	function advanceRoundIfNeeded() {
		if (
			(isToBeCounter && numberToBeCountered >= match.numberOfShotByMatch) ||
			(!areAllShotsInRoundHits && numberOfShotsInCurrentRound >= match.numberOfShotByMatch) ||
			match.numberOfShotByMatch === 1
		) {
			if (numberToCounter > 0) {
				showWinnerModal = true;
			}
			currentRound += 1;
			areAllShotsInRoundHits = true;
			numberOfShotsInCurrentRound = 0;
			isCounter = isToBeCounter;
			isToBeCounter = false;
			numberToCounter = numberToBeCountered;
			numberToBeCountered = 0;
		}
	}

	onMount(async () => {
		const id = routeId();
		const res = await fetch(`/api/match/${id}`);
		match = await res.json();
		const recapRes = await fetch(`/api/match/${id}/recap`);
		const recapData: Shot[] = await recapRes.json();
		shots = recapData || [];
		currentRound = shots.length ? Math.max(...shots.map((s) => s.round)) : 0;
		isTeamAmineFirst = shots.length ? shots[0].team === 'A' : undefined;
		isFirstShot = shots.length === 0;
		numberOfShotsInCurrentRound = shots.filter((s) => s.round === currentRound).length;
		areAllShotsInRoundHits = shots.filter((s) => s.round === currentRound).every((s) => s.hit);
		if (shots.length > 0) advanceRoundIfNeeded();
		({ isCounter, numberToCounter, isToBeCounter, numberToBeCountered } = computeCounterState(
			shots,
			match
		));
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

		areAllShotsInRoundHits = hit && areAllShotsInRoundHits;
		numberOfShotsInCurrentRound += 1;

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
				isCounter,
				sequence: nextSequence
			} as ShotPost)
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
				round: currentRound,
				isCounter
			}
		];
		selectedCups = [];
		const numberOfHitsForTeam = shots
			.filter((s) => s.team === team)
			.reduce(
				(count, s) => (s.team === team && s.bounceCup ? count + 2 : s.hit ? count + 1 : count),
				0
			);

		if (hit && numberToCounter > 0) {
			numberToCounter -= 1;
			if (numberToCounter === 0) {
				isCounter = false;
			}
		}
		if (hit && numberOfHitsForTeam >= 10) {
			isToBeCounter = true;
			numberToBeCountered += 1;
		}
		advanceRoundIfNeeded();
	}

	function isLastStandingCup(cup: number, team: 'A' | 'B') {
		const teamShots = shots.reduce<number[]>((acc, s) => {
			if (s.bounceCup && s.team === team) acc.push(s.bounceCup);
			return s.team === team && s.hit ? [...acc, s.cup ?? -1] : acc;
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
			numberOfShotsInCurrentRound = shots.filter((s) => s.round === currentRound).length;
			areAllShotsInRoundHits = shots.filter((s) => s.round === currentRound).every((s) => s.hit);
			if (shots.length > 0) advanceRoundIfNeeded();
			({ isCounter, numberToCounter, isToBeCounter, numberToBeCountered } = computeCounterState(
				shots,
				match
			));
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
				sequence: nextSequence,
				isCounter
			}
		];
		selectedCups = [];
	}
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	{#if loading}
		<p>Chargement...</p>
	{:else}
		<h1 class="text-xl font-bold">🎯 Partie #{match.id}</h1>

		<div class="grid grid-cols-{isFirstShot ? 2 : 1} max-w-4xl gap-6">
			{#if isFirstShot}
				<TeamRecordCard
					teamName="Team Amine"
					team="A"
					players={match.teamAmineSide}
					{cups}
					bind:selectedCups
					isHit={(cup) => isHitA(cup) && !isLastStandingCup(cup, 'A')}
					isMyTurn={true}
					onRecordShot={recordShot}
					onRecordBounce={recordBounce}
				/>
				<TeamRecordCard
					teamName="Robin Side"
					team="B"
					players={match.teamRobinSide}
					{cups}
					bind:selectedCups
					isHit={(cup) => isHitB(cup) && !isLastStandingCup(cup, 'B')}
					isMyTurn={true}
					onRecordShot={recordShot}
					onRecordBounce={recordBounce}
				/>
			{:else if !isTeamRobinTurn}
				<TeamRecordCard
					teamName="Team Amine"
					team="A"
					players={match.teamAmineSide}
					{cups}
					bind:selectedCups
					isHit={(cup) => isHitA(cup) && !isLastStandingCup(cup, 'A')}
					isMyTurn={true}
					onRecordShot={recordShot}
					onRecordBounce={recordBounce}
				/>
			{:else}
				<TeamRecordCard
					teamName="Robin Side"
					team="B"
					players={match.teamRobinSide}
					{cups}
					bind:selectedCups
					isHit={(cup) => isHitB(cup) && !isLastStandingCup(cup, 'B')}
					isMyTurn={true}
					onRecordShot={recordShot}
					onRecordBounce={recordBounce}
				/>
			{/if}
		</div>

		<div class="mt-6 flex gap-4">
			<Button color="gray" size="md" onclick={undoLastShot} disabled={shots.length === 0}>
				↩️ Défaire
			</Button>
			<Button color="red" size="md" onclick={() => (showWinnerModal = true)}>
				🏁 Fin de partie
			</Button>
			<Button color="pink" size="md" onclick={() => (showQuickEndModal = true)}>
				⚡ Fin rapide
			</Button>
		</div>

		{#if showWinnerModal}
			<EndGameModal {match} onConfirm={endGame} onClose={() => (showWinnerModal = false)} />
		{/if}

		{#if showQuickEndModal}
			<QuickEndModal {match} onConfirm={endGame} onClose={() => (showQuickEndModal = false)} />
		{/if}

		{#if shots.length}
			<div class="overflow-x-auto" style="max-width: 90vw; direction: rtl;">
				<div class="min-w-max" style="direction: ltr;">
					<GameRecap {shots} />
				</div>
			</div>
		{/if}
	{/if}
</main>
