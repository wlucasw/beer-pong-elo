<script lang="ts">
	import { onMount } from 'svelte';
	import GameRecap from '$lib/components/GameRecap.svelte';
	import TeamRecapCard from '$lib/components/TeamRecapCard.svelte';
	import RecalculateRoundsButton from '$lib/components/RecalculateRoundsButton.svelte';
	import type { Shot, MatchFull } from '$lib/types';

	export let params: { id?: string } = {};
	let match: MatchFull | null = null;
	let shots: Shot[] = [];
	let loading = true;

	const routeId = () => params?.id ?? (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : undefined);

	onMount(async () => {
		const id = routeId();
		const [matchRes, shotsRes] = await Promise.all([
			fetch(`/api/match/${id}`),
			fetch(`/api/match/${id}/recap`)
		]);
		match = await matchRes.json();
		shots = await shotsRes.json();
		loading = false;
	});
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	{#if loading}
		<p>Loading...</p>
	{:else if match}
		<h1 class="text-2xl font-bold">📊 Match Recap #{match.id}</h1>

		<div class="grid w-full max-w-4xl grid-cols-2 gap-6">
			<TeamRecapCard teamName="Team Amine" players={match.teamAmineSide} {shots} team="A" isWinner={match.winnerA} />
			<TeamRecapCard teamName="Team Robin" players={match.teamRobinSide} {shots} team="B" isWinner={match.winnerB} />
		</div>

		<div class="overflow-x-auto" style="max-width: 90vw;">
			<div class="min-w-max">
				<GameRecap {shots} />
			</div>
		</div>

		<RecalculateRoundsButton
			matchId={match.id}
			initialShotsByMatch={match.numberOfShotByMatch > 0 ? match.numberOfShotByMatch : 2}
			on:done={({ detail }) => { match = detail.match; shots = detail.shots; }}
		/>
	{/if}
</main>
