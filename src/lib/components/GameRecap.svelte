<script lang="ts">
	import {
		Table,
		TableHead,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		TableHeadCell
	} from 'flowbite-svelte';

	export let shots: {
		player: string;
		hit: boolean;
		cup: number;
		sequence: number;
	}[] = [];

	console.log('Shots in GameRecap:', shots);
	// Get unique players
	$: players = Array.from(new Set(shots.map((s) => s.player)));

	// Find max sequence to know how many columns we need
	$: maxSequence = shots.length ? Math.max(...shots.map((s) => s.sequence)) : 0;

	// Build a 2D array: rows = players, columns = shot sequence
	$: grid = players.map((player) => {
		return Array.from({ length: maxSequence }, (_, i) => {
			const shot = shots.find((s) => s.player === player && s.sequence === i + 1);
			console.log('Shot for player', player, 'sequence', i + 1, ':', shot);
			return shot ? { hit: shot.hit, cup: shot.cup } : null;
		});
	});
</script>

<!-- Import Flowbite Svelte Table components -->

<Table>
	<TableHead>
		<TableHeadCell>Player</TableHeadCell>
		{#each Array(maxSequence) as _, idx}
			<TableHeadCell>{idx + 1}</TableHeadCell>
		{/each}
	</TableHead>
	<TableBody>
		{#each players as player, rowIdx}
			<TableBodyRow>
				<TableBodyCell class="font-semibold">{player}</TableBodyCell>
				{#each grid[rowIdx] as cell}
					<TableBodyCell
						class="h-6 w-6 p-1 text-center"
						style="background-color: {cell === null ? '#fff' : cell.hit ? '#4ade80' : '#f87171'}"
					>
						{cell === null ? '' : cell.hit ? cell.cup : ''}
					</TableBodyCell>
				{/each}
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
