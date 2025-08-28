<script lang="ts">
	import { Button, Input, Card } from 'flowbite-svelte';

	let teamAmine = '';
	let teamRobin = '';
	let ballNumber: number | '' = '';

	function handleSubmit() {
		// Handle form submission logic here
	}
</script>

<main class="flex justify-center p-6">
	<Card class="w-full max-w-none space-y-4 p-6">
		<h2 class="text-center text-xl font-bold">🎯 Match Setup</h2>
		<form class="space-y-4" on:submit|preventDefault={handleSubmit}>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Input placeholder="Team Amine side" bind:value={teamAmine} />
				<Input placeholder="Team Robin side" bind:value={teamRobin} />
			</div>
			<Input
				type="number"
				min="1"
				placeholder="Nombre de balles"
				bind:value={ballNumber}
				class="w-full"
			/>
			<Button type="submit" class="w-full">Valider</Button>
		</form>
	</Card>
</main>
