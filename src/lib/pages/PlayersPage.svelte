<script lang="ts">
	import {
		Table,
		TableHead,
		TableBody,
		TableHeadCell,
		TableBodyCell,
		TableBodyRow,
		Toggle
	} from 'flowbite-svelte';
	import { Button, Input, Card } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { PlayerLeaderboard } from '$lib/types';

	let players: PlayerLeaderboard[] = [];
	let newPlayerName = '';
	$: showAllPlayers = false;
	let whiteListedPlayers: string[] = [];

	type SortKey = 'elo' | 'matchesPlayed' | 'winPercent' | 'accuracy';
	let sortKey: SortKey = 'elo';
	let sortAsc = false;

	onMount(async () => {
		const [playersRes, whitelistRes] = await Promise.all([
			fetch('/api/player'),
			fetch('/api/player/whitelist')
		]);
		players = await playersRes.json();
		whiteListedPlayers = (await whitelistRes.json()) ?? [];
		sortPlayers();
	});

	function sortPlayers() {
		players = [...players].sort((a, b) => {
			const diff = a[sortKey] - b[sortKey];
			return sortAsc ? diff : -diff;
		});
	}

	function setSort(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = false;
		}
		sortPlayers();
	}

	$: indicators = {
		elo: sortKey === 'elo' ? (sortAsc ? ' ▲' : ' ▼') : '',
		matchesPlayed: sortKey === 'matchesPlayed' ? (sortAsc ? ' ▲' : ' ▼') : '',
		winPercent: sortKey === 'winPercent' ? (sortAsc ? ' ▲' : ' ▼') : '',
		accuracy: sortKey === 'accuracy' ? (sortAsc ? ' ▲' : ' ▼') : ''
	};

	async function addPlayer() {
		if (newPlayerName.trim() === '') return;

		const res = await fetch('/api/player', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newPlayerName })
		});

		const created = await res.json();
		players = [...players, created];
		sortPlayers();

		newPlayerName = '';
	}

	$: eloRanks = new Map(
		[...players].sort((a, b) => b.elo - a.elo).map((p, i) => [p.id, i])
	);

	function rowClass(playerId: number) {
		const rank = eloRanks.get(playerId) ?? Infinity;
		if (rank === 0) return 'bg-yellow-200 font-bold';
		if (rank === 1) return 'bg-gray-200 font-semibold';
		if (rank === 2) return 'bg-amber-700/30 font-medium';
		return '';
	}
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	<h1 class="text-2xl font-bold">🏆 Classement</h1>
	<div class="space-y-3 flex row items-center">
		<label for="show-all-players" class="m-0 text-sm font-medium text-gray-700"
			>Afficher tous les joueurs</label
		>
		<Toggle id="show-all-players" color="blue" class="ml-2 center-self" bind:checked={showAllPlayers} />
	</div>

	<Card class="w-full max-w-3xl">
		<Table>
			<TableHead>
				<TableHeadCell class="w-16 text-center">#</TableHeadCell>
				<TableHeadCell>Joueur</TableHeadCell>
				<TableHeadCell
					class="text-right cursor-pointer select-none hover:bg-gray-100"
					onclick={() => setSort('elo')}
				>
					ELO{indicators.elo}
				</TableHeadCell>
				<TableHeadCell
					class="text-right cursor-pointer select-none hover:bg-gray-100"
					onclick={() => setSort('matchesPlayed')}
				>
					Parties{indicators.matchesPlayed}
				</TableHeadCell>
				<TableHeadCell
					class="text-right cursor-pointer select-none hover:bg-gray-100"
					onclick={() => setSort('winPercent')}
				>
					Winrate{indicators.winPercent}
				</TableHeadCell>
				<TableHeadCell
					class="text-right cursor-pointer select-none hover:bg-gray-100"
					onclick={() => setSort('accuracy')}
				>
					Précision{indicators.accuracy}
				</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each players as player, idx}
					{#if showAllPlayers || whiteListedPlayers.includes(player.name)}
						<TableBodyRow
							class={rowClass(player.id)}
							onclick={() => {
								window.history.pushState({}, '', `/player/${player.id}`);
								window.dispatchEvent(new PopStateEvent('popstate'));
							}}
							style="cursor:pointer;"
						>
							<TableBodyCell class="text-center font-semibold">{idx + 1}</TableBodyCell>
							<TableBodyCell>{player.name}</TableBodyCell>
							<TableBodyCell class="text-right">{player.elo}</TableBodyCell>
							<TableBodyCell class="text-right">{player.matchesPlayed}</TableBodyCell>
							<TableBodyCell class="text-right">{player.winPercent.toFixed(2)}%</TableBodyCell>
							<TableBodyCell class="text-right">{player.accuracy.toFixed(2)}%</TableBodyCell>
						</TableBodyRow>
					{/if}
				{/each}
			</TableBody>
		</Table>
	</Card>

	<!-- Add Player Form -->
	<div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
		<Input
			type="text"
			placeholder="Nom du joueur"
			bind:value={newPlayerName}
			onkeydown={(e) => e.key === 'Enter' && addPlayer()}
		/>
		<Button onclick={addPlayer} class="whitespace-nowrap">+ Ajouter</Button>
	</div>
</main>
