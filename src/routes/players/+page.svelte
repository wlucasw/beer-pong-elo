<script lang="ts">
	import { Button, Input } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { Player } from '../../domain/Player';

	let players: Player[] = [];
	let newPlayerName = '';

	// Simulate fetching players from an API or local storage
	onMount(async () => {
		const res = await fetch('/api/player');
		players = await res.json();
	});

	async function addPlayer() {
		if (newPlayerName.trim() === '') return;
		players = [...players, { id: -1, name: newPlayerName, elo: 1000 }];
		localStorage.setItem('players', JSON.stringify(players));
		const res = await fetch('/api/player', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newPlayerName })
		});

		newPlayerName = '';
		const result = await res.json();
		console.log('Server response:', result);
	}
</script>

<h1>Players</h1>

<ul>
	{#each players as player}
		<li>{player.name}</li>
	{/each}
</ul>

<div class="mt-4 flex items-center justify-end gap-2">
	<Input
		type="text"
		placeholder="Enter player name"
		bind:value={newPlayerName}
		onkeydown={(e) => e.key === 'Enter' && addPlayer()}
		class="w-64"
	/>
	<Button onclick={addPlayer} class="whitespace-nowrap">Ajouter un joueur</Button>
</div>
