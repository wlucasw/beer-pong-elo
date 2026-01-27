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
	import type { Player } from '$../../../domain/Player';
	import EloVariationChart from '$lib/components/EloVariationChart.svelte';
	import PlayerMatchup from '$lib/components/PlayerMatchup.svelte';
	import PartnerMatchup from '$lib/components/PartnerMatchup.svelte';
	import CollapsibleCard from '$lib/components/CollapsibleCard.svelte';
	import { navigate } from '$lib/router';

	export let params: { id?: string } = {};
	let player: (Player & {
		matchesPlayed: number;
		wins: number;
		losses: number;
		winPercent: number;
		accuracy: number;
		bounceShotsPerGame: number;
		opponentsAccuracyDiff: number;
		recentMatches: Array<{
			id: number;
			createdAt: string;
			opponents: Player[];
			won: boolean;
			eloVariation: number;
		}>;
	}) | null = null;
	$: loading = true;
	let byDate = false;
	let xMode: 'index' | 'date' = 'index';
	$: xMode = byDate ? 'date' : 'index';

	const routeId = () => params?.id ?? (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : undefined);

	onMount(async () => {
		const id = routeId();
		if (!id) return;
		const [playerRes, statsRes] = await Promise.all([
			fetch(`/api/player/${id}`),
			fetch(`/api/player/${id}/statistics`)
		]);
		const base = await playerRes.json();
		const stats = await statsRes.json();
		player = {
			...base,
			matchesPlayed: stats.matchesPlayed,
			wins: stats.wins,
			losses: stats.losses,
			winPercent: stats.winPercent,
			accuracy: stats.accuracy,
			bounceShotsPerGame: Math.round(stats.bounceShots / stats.matchesPlayed * 100) / 100,
			opponentsAccuracyDiff: stats.opponentsAccuracyDiff
		};
		loading = false;
	});
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	{#if loading}
		<p>Loading...</p>
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
					Played: <span class="font-semibold">{player.matchesPlayed}</span>
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
			</div>
		</Card>

		<!-- Elo variation chart -->
		<CollapsibleCard title="📈 Elo over time" className="w-full max-w-3xl p-4">
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
									{match.eloVariation > 0 ? `+${match.eloVariation}` : match.eloVariation}
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</CollapsibleCard>
	{/if}
</main>


