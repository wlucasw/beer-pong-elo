<script lang="ts">
	import {
		Table,
		TableHead,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		TableHeadCell
	} from 'flowbite-svelte';
	import type { Shot } from '$lib/types';

	export let shots: Shot[] = [];

	$: teams = Array.from(new Set(shots.map((s) => s.team)));
	$: players = Array.from(new Set(shots.map((s) => s.player)));

	$: maxPlayerShots = players.length
		? Math.max(...players.map((p) => shots.filter((s) => s.player === p).length))
		: 0;

	function getShotColor(cell: Shot | null): string {
		if (cell === null) return '#fff';
		if (cell.hit) return cell.isCounter ? '#47BDFF' : '#4ade80';
		return cell.isCounter ? '#F8B271' : '#f87171';
	}
</script>

<p class="mb-1 text-xs text-yellow-600">
	⚠ Rounds couldn't be calculated, counter will not count for this game
</p>

<Table class="text-xs">
	<TableHead>
		<TableHeadCell class="px-2 py-0.5 text-xs">Player</TableHeadCell>
		{#each Array(maxPlayerShots) as _, idx}
			<TableHeadCell class="py-0.5 text-xs px-0 text-center w-6">{idx + 1}</TableHeadCell>
		{/each}
	</TableHead>
	<TableBody>
		{#each teams as team}
			<TableBodyRow style="height: 0.75rem;">
				<TableBodyCell
					colspan={maxPlayerShots + 1}
					class="bg-black px-1 py-0.5 text-xs leading-tight font-bold text-white"
					style="height: 0.75rem;"
				>
					{team}
				</TableBodyCell>
			</TableBodyRow>
			{#each players.filter((player) => shots.find((s) => s.player === player && s.team === team)) as player}
				{@const playerShots = shots
					.filter((s) => s.player === player)
					.sort((a, b) => a.sequence - b.sequence)}
				<TableBodyRow>
					<TableBodyCell class="p-0 text-xs font-semibold">{player}</TableBodyCell>
					{#each Array(maxPlayerShots) as _, idx}
						{@const cell = playerShots[idx] ?? null}
						<TableBodyCell class="h-4 w-6 p-0">
							<div class="w-6 p-0 text-center text-xs" style="background-color: {getShotColor(cell)}">
								{#if cell === null}
									-
								{:else if cell.hit}
									{#if cell.bounceCup}{cell.bounceCup},{/if}
									{#if cell.cup}{cell.cup}{/if}
								{:else}
									X
								{/if}
							</div>
						</TableBodyCell>
					{/each}
				</TableBodyRow>
			{/each}
		{/each}
	</TableBody>
</Table>
