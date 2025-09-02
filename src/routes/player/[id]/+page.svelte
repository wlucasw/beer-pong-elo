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
		TableBodyCell
	} from 'flowbite-svelte';

	export let params;
	let player: any = null;
	$: loading = true;

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
	{:else}
		<h1 class="text-2xl font-bold">{player.name} 🏅</h1>

		<!-- Player info -->
		<Card class="w-full max-w-lg text-center">
			<p class="text-lg font-semibold">
				Elo:
				<Badge color="info" class="ml-2">{player.elo}</Badge>
			</p>
			<div class="mt-3 grid grid-cols-3 gap-2 text-sm">
				<p class="text-gray-600">
					Played: <span class="font-semibold">{player.matchesPlayed}</span>
				</p>
				<p class="text-green-600">Wins: <span class="font-semibold">{player.wins}</span></p>
				<p class="text-red-600">Losses: <span class="font-semibold">{player.losses}</span></p>
			</div>
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
									{match.opponents.map((o) => o.name).join(', ')}
								</TableBodyCell>
								<TableBodyCell>
									{#if match.won}
										<Badge color="green">Win</Badge>
									{:else}
										<Badge color="red">Loss</Badge>
									{/if}
								</TableBodyCell>
								<TableBodyCell>
									{match.eloChange > 0 ? `+${match.eloChange}` : match.eloChange}
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</Card>
	{/if}
</main>
