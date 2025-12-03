<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Card,
		Badge,
		Table,
		TableHead,
		TableHeadCell,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		Toggle
	} from 'flowbite-svelte';
	import type { Player } from '../../../domain/Player';
	import EloVariationChart from '$lib/components/EloVariationChart.svelte';
	type PlayerWithStats = Player & {
		matchesPlayed: number;
		wins: number;
		losses: number;
		winPercent: number;
		accuracy: number;
		recentMatches: Array<{
			id: number;
			createdAt: string;
			opponents: Player[];
			won: boolean;
			eloVariation: number;
		}>;
	};

	export let params;
	let player: PlayerWithStats | null = null;
	$: loading = true;
	let byDate = false;
	let xMode: 'index' | 'date' = 'index';
	$: xMode = byDate ? 'date' : 'index';

	onMount(async () => {
		// Fetch player info
		const res = await fetch(`/api/player/${params.id}`);
		player = await res.json();

		console.log(player);
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
		<Card class="w-full max-w-lg text-center">
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
			</div>
		</Card>

		<!-- Elo variation chart -->
		<Card class="w-full max-w-3xl p-4">
			<h2 class="mb-3 text-lg font-semibold">📈 Elo over time</h2>
			<div class="mb-2 flex items-center gap-3">
				<p class="text-sm text-gray-600">Afficher les parties par date</p>
				<Toggle color="blue" bind:checked={byDate} />
			</div>
			{#if player.recentMatches.length > 0}
				<EloVariationChart matches={player.recentMatches} {xMode} />
			{:else}
				<p class="text-sm text-gray-500">No data to display yet.</p>
			{/if}
		</Card>

		<!-- Recent matches -->
		<Card class="w-full max-w-3xl">
			<h2 class="mb-3 text-lg font-semibold">🕹️ Recent Matches</h2>
			{#if player.recentMatches.length === 0}
				<p class="text-sm text-gray-500">No matches yet.</p>
			{:else}
				<Table>
					<TableHead>
						<TableHeadCell>Date</TableHeadCell>
						<TableHeadCell>Opponent(s)</TableHeadCell>
						<TableHeadCell>Result</TableHeadCell>
						<TableHeadCell>Elo Change</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each player.recentMatches as match}
							<TableBodyRow>
								<TableBodyCell>
									{new Date(match.createdAt).toLocaleDateString()}
								</TableBodyCell>
								<TableBodyCell>
									{match.opponents.map((o: Player) => o.name).join(', ')}
								</TableBodyCell>
								<TableBodyCell>
									{#if match.won}
										<Badge color="green">Win</Badge>
									{:else}
										<Badge color="red">Loss</Badge>
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
		</Card>
	{/if}
</main>
