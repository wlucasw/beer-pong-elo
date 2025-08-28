<script lang="ts">
	import { Button, Input, Card } from 'flowbite-svelte';
	import { CheckCircle, XCircle, Beer } from 'lucide-svelte';

	let player1 = '';
	let player2 = '';
	let currentShooter = 1;
	let shots = [];

	function recordShot(hit) {
		const shooter = currentShooter === 1 ? player1 : player2;
		shots = [{ shooter, hit, time: new Date().toLocaleTimeString() }, ...shots];
		currentShooter = currentShooter === 1 ? 2 : 1;
	}

	let cups1 = Array(10).fill(true);
	let cups2 = Array(10).fill(true);

	function toggleCup(side, index) {
		if (side === 1) cups1[index] = !cups1[index];
		if (side === 2) cups2[index] = !cups2[index];
	}
</script>

<main class="space-y-10 p-6">
	<!-- Setup -->
	<Card class="space-y-4 p-6">
		<h2 class="text-xl font-bold">🎯 Match Setup</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Input placeholder="Player 1 name" bind:value={player1} />
			<Input placeholder="Player 2 name" bind:value={player2} />
		</div>
	</Card>

	<!-- Cup Grids -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<Card class="flex flex-col items-center p-4">
			<h3 class="mb-3 font-semibold">{player1 || 'Player 1'}'s Cups</h3>
			<div class="grid grid-cols-4 gap-2">
				{#each cups1 as active, i}
					<Button
						color={active ? 'green' : 'gray'}
						class="flex h-12 w-12 items-center justify-center rounded-full"
						on:click={() => toggleCup(1, i)}
					>
						<Beer class="h-5 w-5" />
					</Button>
				{/each}
			</div>
		</Card>

		<Card class="flex flex-col items-center p-4">
			<h3 class="mb-3 font-semibold">{player2 || 'Player 2'}'s Cups</h3>
			<div class="grid grid-cols-4 gap-2">
				{#each cups2 as active, i}
					<Button
						color={active ? 'green' : 'gray'}
						class="flex h-12 w-12 items-center justify-center rounded-full"
						on:click={() => toggleCup(2, i)}
					>
						<Beer class="h-5 w-5" />
					</Button>
				{/each}
			</div>
		</Card>
	</div>

	<!-- Shot Controls -->
	<Card class="space-y-4 p-6 text-center">
		<h2 class="text-lg font-bold">
			{currentShooter === 1 ? player1 || 'Player 1' : player2 || 'Player 2'}'s Turn
		</h2>
		<div class="flex justify-center gap-6">
			<Button color="green" class="flex items-center gap-2" on:click={() => recordShot(true)}>
				<CheckCircle class="h-5 w-5" /> Hit
			</Button>
			<Button color="red" class="flex items-center gap-2" on:click={() => recordShot(false)}>
				<XCircle class="h-5 w-5" /> Miss
			</Button>
		</div>
	</Card>

	<!-- Shot Log -->
	<Card class="p-6">
		<h2 class="mb-3 text-xl font-bold">📜 Shot Log</h2>
		<ul class="max-h-64 space-y-2 overflow-y-auto">
			{#each shots as shot}
				<li class="flex justify-between rounded bg-gray-50 p-2 text-sm">
					<span>{shot.time} - {shot.shooter}</span>
					<span class={shot.hit ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
						{shot.hit ? 'Hit' : 'Miss'}
					</span>
				</li>
			{/each}
		</ul>
	</Card>

	<!-- Finish Match -->
	<div class="flex justify-center">
		<Button color="purple" class="rounded-full px-8 py-2">Finish Match</Button>
	</div>
</main>
