<script lang="ts">
	import {
		Table,
		TableHead,
		TableBody,
		TableHeadCell,
		TableBodyCell,
		TableBodyRow
	} from 'flowbite-svelte';
	import { Button, Input, Card } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { Player } from '../../domain/Player';

	let players: Player[] = [];
	let newPlayerName = '';

	onMount(async () => {
		const res = await fetch('/api/player');
		players = await res.json();
		sortPlayers();
	});

	function sortPlayers() {
		players = [...players].sort((a, b) => b.elo - a.elo);
	}

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

	function rowClass(idx: number) {
		if (idx === 0) return 'bg-yellow-200 font-bold'; // Gold
		if (idx === 1) return 'bg-gray-200 font-semibold'; // Silver
		if (idx === 2) return 'bg-amber-700/30 font-medium'; // Bronze
		return '';
	}
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	<h1 class="text-2xl font-bold">🏆 Leaderboard</h1>

	<Card class="w-full max-w-2xl">
		<Table>
			<TableHead>
				<TableHeadCell class="w-16 text-center">#</TableHeadCell>
				<TableHeadCell>Player</TableHeadCell>
				<TableHeadCell class="text-right">ELO</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each players as player, idx}
					<TableBodyRow
						class={rowClass(idx)}
						onclick={() => (window.location.href = `/player/${player.id}`)}
						style="cursor:pointer;"
					>
						<TableBodyCell class="text-center font-semibold">{idx + 1}</TableBodyCell>
						<TableBodyCell>{player.name}</TableBodyCell>
						<TableBodyCell class="text-right">{player.elo}</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</Card>

	<!-- Add Player Form -->
	<div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
		<Input
			type="text"
			placeholder="Enter player name"
			bind:value={newPlayerName}
			onkeydown={(e) => e.key === 'Enter' && addPlayer()}
		/>
		<Button onclick={addPlayer} class="whitespace-nowrap">+ Add Player</Button>
	</div>
</main>
