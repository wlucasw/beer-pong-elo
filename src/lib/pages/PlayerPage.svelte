<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Badge,
		Table,
		TableHead,
		TableHeadCell,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		Toggle,
		Card
	} from 'flowbite-svelte';
	import type { CupAccuracyPoint, Player, PlayerDetail, PlayerStats, PlayerWithStats } from '$lib/types';
	import EloVariationChart from '$lib/components/EloVariationChart.svelte';
	import CupAccuracyChart from '$lib/components/CupAccuracyChart.svelte';
	import PlayerMatchup from '$lib/components/PlayerMatchup.svelte';
	import PartnerMatchup from '$lib/components/PartnerMatchup.svelte';
	import CollapsibleCard from '$lib/components/CollapsibleCard.svelte';
	import { navigate } from '$lib/router';

	export let params: { id?: string } = {};
	let player: PlayerWithStats | null = null;
	$: loading = true;
	let byDate = false;
	let xMode: 'index' | 'date' = 'index';
	$: xMode = byDate ? 'date' : 'index';
	let cupAccuracyData: CupAccuracyPoint[] = [];

	function clutchRate(data: CupAccuracyPoint[]): number {
		const clutch = data.filter((d) => d.cupsRemaining <= 3);
		const hits = clutch.reduce((s, d) => s + d.hits, 0);
		const total = clutch.reduce((s, d) => s + d.total, 0);
		return total === 0 ? 0 : (hits / total) * 100;
	}

	const routeId = () => params?.id ?? (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : undefined);

	onMount(async () => {
		const id = routeId();
		if (!id) return;
		const [playerRes, statsRes, cupAccRes] = await Promise.all([
			fetch(`/api/player/${id}`),
			fetch(`/api/player/${id}/statistics`),
			fetch(`/api/player/${id}/cup-accuracy`)
		]);
		const base: PlayerDetail = await playerRes.json();
		const stats: PlayerStats = await statsRes.json();
		cupAccuracyData = await cupAccRes.json();
		player = {
			...base,
			matchesPlayed: stats.matchesPlayed,
			wins: stats.wins,
			losses: stats.losses,
			winPercent: stats.winPercent,
			accuracy: stats.accuracy,
			bounceShotsPerGame: Math.round(stats.bounceShots / stats.matchesPlayed * 100) / 100,
			opponentsAccuracyDiff: stats.opponentsAccuracyDiff,
			counterAccuracy: stats.counterAccuracy,
		};
		loading = false;
	});
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	{#if loading}
		<p>Chargement...</p>
	{:else if player}
		<h1 class="text-2xl font-bold">
			{player.name === 'Robin' ? 'Chef de projet : ' : ''}{player.name}
			{player.name === 'Amine' ? '👑' : ''}
		</h1>

		<!-- Player info -->
		<Card class="w-full max-w-lg text-center p-2">
			<p class="text-lg font-semibold">
				Elo:
				<Badge color="blue" class="ml-2">{player.elo}</Badge>
			</p>
			<div class="mt-3 grid grid-cols-3 items-center justify-items-center gap-2 text-sm">
				<p class="text-gray-600">
					Joués : <span class="font-semibold">{player.matchesPlayed}</span>
				</p>
				<p class="text-green-600">Victoire: <span class="font-semibold">{player.wins}</span></p>
				<p class="text-red-600">Défaites: <span class="font-semibold">{player.losses}</span></p>
				<p class="text-gray-600" style="color: hsl({(120 * player.winPercent) / 100}, 70%, 45%)">
					Winrate: <span class="font-semibold">{player.winPercent.toFixed(1)}%</span>
				</p>
				<p class="text-gray-600" style="color: hsl({(120 * player.accuracy) / 100}, 70%, 45%)">
					Précision:
					<span class="font-semibold">
						{player.accuracy.toFixed(1)}%
					</span>
				</p>
				<p style="color: {player.opponentsAccuracyDiff < 0 ? 'hsl(120, 70%, 40%)' : player.opponentsAccuracyDiff > 0 ? 'hsl(0, 75%, 50%)' : 'inherit'}">
					Score de défense:
					<span
						class="font-semibold"
					>
						{player.opponentsAccuracyDiff.toFixed(2)}%
					</span>
				</p>
				<p class="text-gray-600">Rebonds par game: <span class="font-semibold">{player.bounceShotsPerGame}</span></p>
				<p style="color: hsl({(120 * player.counterAccuracy) / 100}, 70%, 45%)">
					Précision de contre:
					<span class="font-semibold">
						{player.counterAccuracy.toFixed(2)}%
					</span>
				</p>
				{#if cupAccuracyData.length > 0}
				{@const clutch = clutchRate(cupAccuracyData)}
				<p style="color: hsl({(120 * clutch) / 100}, 70%, 45%)">
					Clutch (≤3 verres):
					<span class="font-semibold">{clutch.toFixed(1)}%</span>
				</p>
				{/if}
			</div>
		</Card>

		<!-- Elo variation chart -->
		<CollapsibleCard title="📈 Elo au fil du temps" className="w-full max-w-3xl p-4">
			<div slot="actions" class="flex items-center gap-3">
				<p class="text-sm text-gray-600">Afficher les parties par date</p>
				<Toggle color="blue" bind:checked={byDate} />
			</div>
			{#if player.recentMatches.length > 0}
				<EloVariationChart matches={player.recentMatches} {xMode} />
			{:else}
				<p class="text-sm text-gray-500">Aucune donnée à afficher.</p>
			{/if}
		</CollapsibleCard>

		<CollapsibleCard title="🎯 Précision par verres restantes" className="w-full max-w-3xl p-4">
			{#if cupAccuracyData.some((d) => d.total > 0)}
				<CupAccuracyChart data={cupAccuracyData} />
			{:else}
				<p class="text-sm text-gray-500">Aucune donnée à afficher.</p>
			{/if}
		</CollapsibleCard>

		<div class="w-full max-w-3xl">
			<PlayerMatchup playerId={Number(routeId())} />
		</div>

		<div class="w-full max-w-3xl">
			<PartnerMatchup playerId={Number(routeId())} />
		</div>

		<!-- Recent matches -->
		<CollapsibleCard title="🕹️ Parties récentes" className="mx-auto w-full max-w-3xl p-4">
			{#if player.recentMatches.length === 0}
				<p class="text-sm text-gray-500">Aucune partie trouvée.</p>
			{:else}
				<Table>
					<TableHead>
						<TableHeadCell>Date de la partie</TableHeadCell>
						<TableHeadCell>Adversaire(s)</TableHeadCell>
						<TableHeadCell>Résultat</TableHeadCell>
						<TableHeadCell>Variation d'Elo</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each player.recentMatches as match}
							<TableBodyRow onclick={() => {
								navigate(`/match/${match.id}/recap`);
							}} style="cursor:pointer;">
								<TableBodyCell>
									{new Date(match.createdAt).toLocaleDateString()}
								</TableBodyCell>
								<TableBodyCell>
									{match.opponents.map((o: Player) => o.name).join(', ')}
								</TableBodyCell>
								<TableBodyCell>
									{#if match.won}
										<Badge color="green">Victoire</Badge>
									{:else}
										<Badge color="red">Défaite</Badge>
									{/if}
								</TableBodyCell>
								<TableBodyCell>
									{(match.eloVariation ?? 0) > 0 ? `+${match.eloVariation}` : match.eloVariation}
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</CollapsibleCard>
	{/if}
</main>


