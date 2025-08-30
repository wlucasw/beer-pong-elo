<script lang="ts">
	import { Button, Input, Card, MultiSelect } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { Player } from '../../../domain/Player';

	let teamAmine: string[] = [];
	let teamRobin: string[] = [];
	let ballNumber: number | '' = '';
	let players: Player[] = [];
	let playerOptions: { value: string; name: string }[] = [];

	onMount(async () => {
		const res = await fetch('/api/player');
		players = await res.json();
		playerOptions = players.map((player) => ({
			value: player.id.toString(),
			name: player.name
		}));
	});

	async function handleSubmit() {
		console.log('teamAmine:', teamAmine);
		console.log('teamRobin:', teamRobin);
		console.log('ballNumber:', ballNumber);
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
			console.log('Match saved ✅', match);
			// maybe redirect or reset form
		} else {
			console.error('Failed to save match ❌');
		}
	}
</script>

<main class="flex justify-center p-6">
	<Card class="w-full max-w-none space-y-4 p-6">
		<h2 class="text-center text-xl font-bold">🎯 Match Setup</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<MultiSelect
				items={playerOptions}
				bind:value={teamAmine}
				size="lg"
				placeholder="Team Amine side"
			/>
			<MultiSelect
				items={playerOptions}
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
