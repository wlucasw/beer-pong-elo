<script lang="ts">
	import { onMount } from 'svelte';
	import HallOfFameCard from '$lib/components/HallOfFameCard.svelte';
	import type { HallOfFameCardEntry, HallOfFameDuoEntry, HallOfFameOpponentEntry, HallOfFameData } from '$lib/types';
	import { MIN_GAMES_FOR_CAREER_STAT, MIN_SHOTS_FOR_SINGLE_GAME_ACCURACY } from '$lib/constants';

	let data: HallOfFameData | null = null;
	let loading = true;

	onMount(async () => {
		const res = await fetch('/api/halloffame');
		if (res.ok) {
			data = await res.json();
		}
		loading = false;
	});

	function navigateToMatch(matchId: number) {
		window.history.pushState({}, '', `/match/${matchId}/recap`);
		window.dispatchEvent(new PopStateEvent('popstate'));
	}

	function navigateToPlayer(playerId: number) {
		window.history.pushState({}, '', `/player/${playerId}`);
		window.dispatchEvent(new PopStateEvent('popstate'));
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString();
	}

	function formatTeams(teamA: string[], teamB: string[]) {
		return `${teamA.join(' & ')} vs ${teamB.join(' & ')}`;
	}

	function opponentToEntry(e: HallOfFameOpponentEntry): HallOfFameCardEntry {
		const sign = e.valuePct >= 0 ? '+' : '';
		return {
			rank: e.rank,
			label: `${e.playerName} face à ${e.opponentName}`,
			subLabel: `${e.games} partie${e.games > 1 ? 's' : ''}`,
			value: `${sign}${e.valuePct}%`,
			onClick: () => navigateToPlayer(e.playerId)
		};
	}

	function duoToEntry(e: HallOfFameDuoEntry): HallOfFameCardEntry {
		const sign = e.valuePct >= 0 ? '+' : '';
		return {
			rank: e.rank,
			label: `${e.player1Name} & ${e.player2Name}`,
			subLabel: `${e.games} partie${e.games > 1 ? 's' : ''} ensemble`,
			value: `${sign}${e.valuePct}%`
		};
	}

	$: categories = data
		? [
				{
					title: '🐢 Parties les plus longues',
					entries: data.longestGames.map((e): HallOfFameCardEntry => ({
						rank: e.rank,
						label: formatTeams(e.teamA, e.teamB),
						subLabel: formatDate(e.createdAt),
						value: `${e.value} tirs`,
						onClick: () => navigateToMatch(e.matchId)
					}))
				},
				{
					title: '⚡ Parties les plus courtes',
					entries: data.shortestGames.map((e): HallOfFameCardEntry => ({
						rank: e.rank,
						label: formatTeams(e.teamA, e.teamB),
						subLabel: formatDate(e.createdAt),
						value: `${e.value} tirs`,
						onClick: () => navigateToMatch(e.matchId)
					}))
				},
				{
					title: '🏀 Plus de rebonds par partie',
					entries: data.mostBouncesPerGame.map((e): HallOfFameCardEntry => ({
						rank: e.rank,
						label: e.playerName,
						value: `${e.value} / partie`,
						onClick: () => navigateToPlayer(e.playerId)
					}))
				},
				{
					title: '🔁 Plus de contres dans une partie',
					entries: data.mostCountersInGame.map((e): HallOfFameCardEntry => ({
						rank: e.rank,
						label: formatTeams(e.teamA, e.teamB),
						subLabel: formatDate(e.createdAt),
						value: `${e.value} contres`,
						onClick: () => navigateToMatch(e.matchId)
					}))
				},
				{
					title: '📈 Plus grand choc Elo',
					entries: data.biggestEloSwings.map((e): HallOfFameCardEntry => ({
						rank: e.rank,
						label: formatTeams(e.teamA, e.teamB),
						subLabel: formatDate(e.createdAt),
						value: `±${e.value} elo`,
						onClick: () => navigateToMatch(e.matchId)
					}))
				},
				{
					title: '🎯 Meilleure précision de contre',
					subtitle: `Carrière — min. ${MIN_GAMES_FOR_CAREER_STAT} parties`,
					entries: data.bestCounterAccuracy.map((e): HallOfFameCardEntry => ({
						rank: e.rank,
						label: e.playerName,
						value: `${e.value}%`,
						onClick: () => navigateToPlayer(e.playerId)
					}))
				},
				{
					title: '💎 Meilleure précision en une partie',
					subtitle: `Min. ${MIN_SHOTS_FOR_SINGLE_GAME_ACCURACY} tirs dans la partie`,
					entries: data.bestSingleGameAccuracy.map((e): HallOfFameCardEntry => ({
						rank: e.rank,
						label: e.playerName,
						subLabel: formatDate(e.createdAt),
						value: `${e.value}%`,
						onClick: () => navigateToMatch(e.matchId)
					}))
				},
				{
					title: '🔥 Plus de contres par un joueur',
					entries: data.mostCountersScoredInGame.map((e): HallOfFameCardEntry => ({
						rank: e.rank,
						label: e.playerName,
						subLabel: formatDate(e.createdAt),
						value: `${e.value} contres`,
						onClick: () => navigateToMatch(e.matchId)
					}))
				},
				{
					title: '🤝 Duo qui boost le plus le winrate',
					subtitle: `Min. ${MIN_GAMES_FOR_CAREER_STAT} parties ensemble`,
					entries: data.bestDuoWinRate.map(duoToEntry)
				},
				{
					title: '💔 Duo qui plombe le plus le winrate',
					subtitle: `Min. ${MIN_GAMES_FOR_CAREER_STAT} parties ensemble`,
					entries: data.worstDuoWinRate.map(duoToEntry)
				},
				{
					title: '✨ Duo qui boost le plus la précision',
					subtitle: `Min. ${MIN_GAMES_FOR_CAREER_STAT} parties ensemble`,
					entries: data.bestDuoAccuracy.map(duoToEntry)
				},
				{
					title: '😬 Duo qui plombe le plus la précision',
					subtitle: `Min. ${MIN_GAMES_FOR_CAREER_STAT} parties ensemble`,
					entries: data.worstDuoAccuracy.map(duoToEntry)
				},
				{
					title: '😤 Meilleur winrate contre un adversaire',
					subtitle: `Min. ${MIN_GAMES_FOR_CAREER_STAT} parties face à face`,
					entries: data.bestOpponentWinRate.map(opponentToEntry)
				},
				{
					title: '😰 Plus grande bête noire',
					subtitle: `Min. ${MIN_GAMES_FOR_CAREER_STAT} parties face à face`,
					entries: data.worstOpponentWinRate.map(opponentToEntry)
				},
				{
					title: '🎯 Plus précis contre un adversaire',
					subtitle: `Min. ${MIN_GAMES_FOR_CAREER_STAT} parties face à face`,
					entries: data.bestOpponentAccuracy.map(opponentToEntry)
				},
				{
					title: '😵 Moins précis contre un adversaire',
					subtitle: `Min. ${MIN_GAMES_FOR_CAREER_STAT} parties face à face`,
					entries: data.worstOpponentAccuracy.map(opponentToEntry)
				}
			]
		: [];
</script>

<div class="flex flex-col items-center space-y-6 p-6">
	<h1 class="text-2xl font-bold">🏆 Hall of Fame</h1>

	{#if loading}
		<p class="text-gray-500">Chargement...</p>
	{:else if !data}
		<p class="text-gray-500">Impossible de charger le Hall of Fame.</p>
	{:else}
		<div class="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
			{#each categories as category (category.title)}
				<HallOfFameCard
					title={category.title}
					subtitle={category.subtitle}
					entries={category.entries}
				/>
			{/each}
		</div>
	{/if}
</div>
