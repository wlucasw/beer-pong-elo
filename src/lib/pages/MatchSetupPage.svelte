<script lang="ts">
	import { Button, Input, Card, MultiSelect, Toggle } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { Player } from '$../../../domain/Player';
	import { navigate } from '$lib/router';

	let teamAmine: string[] = [];
	let teamRobin: string[] = [];
	let ballNumber: number | '' = '';
	let players: Player[] = [];
	let playerOptions: { value: string; name: string }[] = [];
	let showAllPlayers = false;
	let whiteListedPlayers: string[] = [];
	let filteredPlayerOptions: { value: string; name: string }[] = [];

	onMount(async () => {
		const [playersRes, whitelistRes] = await Promise.all([
			fetch('/api/player'),
			fetch('/api/player/whitelist')
		]);
		players = await playersRes.json();
		whiteListedPlayers = (await whitelistRes.json()) ?? [];
		playerOptions = players.map((player) => ({
			value: player.id.toString(),
			name: player.name
		}));
	});

	$: filteredPlayerOptions = showAllPlayers
		? playerOptions
		: playerOptions.filter((opt) => whiteListedPlayers.includes(opt.name));

	async function handleSubmit() {
		const res = await fetch('/api/match', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				teamAmine,
				teamRobin,
				ballNumber
			})
		});

		if (res.ok) {
			const match = await res.json();
			navigate(`/match/${match.id}/record`);
		} else {
			console.error('Failed to save match ❌');
		}
	}
</script>

<main class="flex justify-center p-6">
	<Card class="w-full max-w-none space-y-4 p-6">
		<h2 class="text-center text-xl font-bold">🎯 Match Setup</h2>
		<Toggle color="blue" bind:checked={showAllPlayers} />
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<MultiSelect
				items={filteredPlayerOptions}
				bind:value={teamAmine}
				size="lg"
				placeholder="Team Amine side"
			/>
			<MultiSelect
				items={filteredPlayerOptions}
				bind:value={teamRobin}
				size="lg"
				placeholder="Team Robin side"
			/>
		</div>
		<Input
			type="number"
			min="1"
			placeholder="Nombre de balles"
			bind:value={ballNumber}
			class="w-full"
		/>
		<Button type="submit" class="w-full" onclick={handleSubmit}>Valider</Button>
	</Card>
</main>


