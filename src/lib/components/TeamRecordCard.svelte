<script lang="ts">
	import { Button, Card } from 'flowbite-svelte';
	import CupTriangle from '$lib/components/CupTriangle.svelte';

	export let teamName: string;
	export let team: 'A' | 'B';
	export let players: { playerId: number; player: { name: string } }[];
	export let cups: number[][];
	export let selectedCups: number[];
	export let isHit: (cup: number) => boolean;
	export let isMyTurn: boolean;
	export let onRecordShot: (playerId: number, hit: boolean, team: 'A' | 'B') => void;
	export let onRecordBounce: (playerId: number, team: 'A' | 'B') => void;

	$: colorClass = team === 'A' ? 'text-blue-600' : 'text-red-600';

	function onSelectCup(cup: number) {
		if (selectedCups.includes(cup)) {
			selectedCups = selectedCups.filter((c) => c !== cup);
		} else {
			selectedCups = [...selectedCups, cup];
		}
	}
</script>

<Card class="p-4">
	<h2 class="mb-2 font-semibold {colorClass}">{teamName}</h2>
	<CupTriangle {cups} bind:selectedCups {onSelectCup} {isHit} />
	<div class="mt-2">
		{#each players as entry}
			<div class="my-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<span class="mr-2">{entry.player.name}</span>
				<div class="space-x-2">
					<Button
						size="xs"
						class="mb-2"
						onclick={() => onRecordShot(entry.playerId, true, team)}
						disabled={selectedCups.length !== 1 || !isMyTurn}
					>
						✅ Touché
					</Button>
					<Button
						size="xs"
						color="red"
						class="mb-2"
						disabled={!isMyTurn}
						onclick={() => onRecordShot(entry.playerId, false, team)}
					>
						❌ Raté
					</Button>
					<Button
						size="xs"
						color="yellow"
						onclick={() => onRecordBounce(entry.playerId, team)}
						disabled={selectedCups.length !== 2 || !isMyTurn}
					>
						🏓 Rebond
					</Button>
				</div>
			</div>
		{/each}
	</div>
</Card>
