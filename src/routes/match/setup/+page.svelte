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
			value: player.id.toString(), // or another unique identifier
			name: player.name // add the required 'name' property
		}));
	});

	function handleSubmit() {
		// Handle form submission logic here
	}
</script>

<main class="flex justify-center p-6">
	<Card class="w-full max-w-none space-y-4 p-6">
		<h2 class="text-center text-xl font-bold">🎯 Match Setup</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<MultiSelect
				items={playerOptions}
				value={teamAmine}
				size="lg"
				placeholder="Team Amine side"
			/>
			<MultiSelect
				items={playerOptions}
				value={teamRobin}
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
		<Button type="submit" class="w-full">Valider</Button>
	</Card>
</main>
