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
	import type { Player } from '$../../../domain/Player';

	let players: Player[] = [];
	let newPlayerName = '';
	$: showAllPlayers = false;
	let whiteListedPlayers: string[] = [];

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
		if (idx === 0) return 'bg-yellow-200 font-bold';
		if (idx === 1) return 'bg-gray-200 font-semibold';
		if (idx === 2) return 'bg-amber-700/30 font-medium';
		return '';
	}
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	<h1 class="text-2xl font-bold">🏆 Leaderboard</h1>
    <div class="space-y-3 flex row items-center">
        <label for="show-all-players" class="m-0 text-sm font-medium text-gray-700">Afficher tous les joueurs</label>
        <Toggle id="show-all-players" color="blue" class="ml-2 center-self" bind:checked={showAllPlayers} />
    </div>

	<Card class="w-full max-w-2xl">
		<Table>
			<TableHead>
				<TableHeadCell class="w-16 text-center">#</TableHeadCell>
				<TableHeadCell>Player</TableHeadCell>
				<TableHeadCell class="text-right">ELO</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each players as player, idx}
				{#if showAllPlayers || whiteListedPlayers.includes(player.name)}
					<TableBodyRow
						class={rowClass(idx)}
						onclick={() => {
							window.history.pushState({}, '', `/player/${player.id}`);
							window.dispatchEvent(new PopStateEvent('popstate'));
						}}
						style="cursor:pointer;"
					>
						<TableBodyCell class="text-center font-semibold">{idx + 1}</TableBodyCell>
						<TableBodyCell>{player.name}</TableBodyCell>
						<TableBodyCell class="text-right">{player.elo}</TableBodyCell>
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
			placeholder="Enter player name"
			bind:value={newPlayerName}
			onkeydown={(e) => e.key === 'Enter' && addPlayer()}
		/>
		<Button onclick={addPlayer} class="whitespace-nowrap">+ Add Player</Button>
	</div>
	</main>


