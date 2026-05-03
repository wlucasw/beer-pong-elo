<script lang="ts">
	import { onMount } from 'svelte';
	import GameRecap from '$lib/components/GameRecap.svelte';
	import TeamRecapCard from '$lib/components/TeamRecapCard.svelte';
	import type { Shot } from '$lib/types';

	export let params: { id?: string } = {};
	let match: any = null;
	let shots: Shot[] = [];
	let loading = true;

	const routeId = () => params?.id ?? (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : undefined);

	onMount(async () => {
		const id = routeId();
		const res = await fetch(`/api/match/${id}`);
		match = await res.json();
		const recapRes = await fetch(`/api/match/${id}/recap`);
		shots = await recapRes.json();
		loading = false;
	});

</script>

<main class="flex flex-col items-center space-y-6 p-6">
	{#if loading}
		<p>Loading...</p>
	{:else}
		<h1 class="text-2xl font-bold">📊 Match Recap #{match.id}</h1>

		<div class="grid w-full max-w-4xl grid-cols-2 gap-6">
			<TeamRecapCard teamName="Team Amine" players={match.teamAmineSide} {shots} team="A" />
			<TeamRecapCard teamName="Team Robin" players={match.teamRobinSide} {shots} team="B" />
		</div>

		<div class="overflow-x-auto" style="max-width: 90vw;">
			<div class="min-w-max">
				<GameRecap {shots} />
			</div>
		</div>
	{/if}
</main>


