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
		bounceCup?: number;
		sequence: number;
		team?: string;
	}[] = [];

	// Get unique players
	$: players = Array.from(new Set(shots.map((s) => s.player)));

	// Find max sequence to know how many columns we need
	$: maxSequence = shots.length ? Math.max(...shots.map((s) => s.sequence)) : 0;

	// Build a 2D array: rows = players, columns = shot sequence
	$: grid = players.map((player) => {
		return Array.from({ length: maxSequence }, (_, i) => {
			const shot = shots.find((s) => s.player === player && s.sequence === i + 1);
			return shot ? { hit: shot.hit, cup: shot.cup, bounceCup: shot.bounceCup } : null;
		});
	});
</script>

<Table class="text-xs">
	<TableHead>
		<TableHeadCell class="px-2 py-0.5 text-xs">Player</TableHeadCell>
		{#each Array(maxSequence) as _, idx}
			<TableHeadCell class="px-1 py-0.5 text-xs">{idx + 1}</TableHeadCell>
		{/each}
	</TableHead>
	<TableBody>
		{#each Array.from(new Set(shots.map((s) => s.team))) as team}
			<TableBodyRow style="height: 0.75rem;">
				<TableBodyCell
					colspan={maxSequence + 1}
					class="bg-black px-1 py-0.5 text-xs leading-tight font-bold text-white"
					style="height: 0.75rem;"
				>
					{team}
				</TableBodyCell>
			</TableBodyRow>

			{#each players.filter( (player) => shots.find((s) => s.player === player && s.team === team) ) as player}
				<TableBodyRow>
					<TableBodyCell class="px-2 py-0.5 text-xs font-semibold">{player}</TableBodyCell>
					{#each grid[players.indexOf(player)] as cell}
						<TableBodyCell
							class="h-4 w-6 p-0.5 text-center text-xs"
							style="background-color: {cell === null ? '#fff' : cell.hit ? '#4ade80' : '#f87171'}"
						>
							{#if cell === null}{:else if cell.hit}
								{#if cell.bounceCup}
									{cell.bounceCup},
								{/if}
								{#if cell.cup}
									{cell.cup}
								{/if}
							{:else}
								X
							{/if}
						</TableBodyCell>
					{/each}
				</TableBodyRow>
			{/each}
		{/each}
	</TableBody>
</Table>
