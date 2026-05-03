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

	let roundsLength: number[];

	// Get unique players
	$: players = Array.from(new Set(shots.map((s) => s.player)));

	// Find max round to know how many columns we need
	$: maxRound = shots.length ? Math.max(...shots.map((s) => s.round)) : 0;
	$: maxSequence = shots.length ? Math.max(...shots.map((s) => s.sequence)) : 0;

	$: roundsLength = new Array(maxRound + 1)
		.fill(null)
		.map((_, i) => i)
		.filter((r) => r % 2 === 0)
		.map((round) => {
			const roundNumberOfShotsByTeam = players.reduce(
				(acc, player) => {
					const playerShots = shots.filter((s) => s.player === player);
					return {
						teamNShots: Math.max(
							acc.teamNShots,
							playerShots.filter((shot) => shot.round === round).length || 0
						),
						opponentShots: Math.max(
							acc.opponentShots,
							playerShots.filter((shot) => shot.round === round + 1).length || 0
						)
					};
				},
				{ teamNShots: 0, opponentShots: 0 }
			);

			const maxShots = Math.max(
				roundNumberOfShotsByTeam.teamNShots,
				roundNumberOfShotsByTeam.opponentShots
			);
			return maxShots;
		});

	// Build a 2D array: rows = players, columns = shot sequence
	$: grid = players.map((player) => {
		const playerShots = shots.filter((s) => s.player === player);
		return roundsLength.map((roundLength, roundIdx) => {
			const roundShots = playerShots.filter(
				(s) => s.round === roundIdx * 2 + 1 || s.round === roundIdx * 2 + 0
			);
			const row: ((typeof roundShots)[0] | null)[] = new Array(roundLength).fill(null);
			roundShots
				.sort((a, b) => a.sequence - b.sequence)
				.forEach((shot, idy) => {
					row[idy] = shot;
				});
			return row;
		});
	});
</script>

<Table class="text-xs">
	<TableHead>
		<TableHeadCell class="px-2 py-0.5 text-xs">Player</TableHeadCell>
		{#each Array(Math.floor(maxRound / 2) + 1) as _, idx}
			<TableHeadCell
				class="py-0.5 text-xs w-{6 *
					(roundsLength[idx] || 0)} border-l-2 border-gray-700 px-0 text-center"
				>{idx + 1}</TableHeadCell
			>
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
					<TableBodyCell class="p-0 text-xs font-semibold">{player}</TableBodyCell>
					{#each grid[players.indexOf(player)] as round, idx}
						<TableBodyCell class="h-4 w-full p-0 {idx > 0 ? 'border-l-2 border-gray-700' : ''}">
							<div class="inline-flex w-full">
								{#each round as cell}
									<div
										class="w-6 p-0 text-center text-xs"
										style="background-color: {cell === null
											? '#fff'
											: cell.hit
												? cell.isCounter
													? '#47BDFF'
													: '#4ade80'
												: cell.isCounter
													? '#F8B271'
													: '#f87171'}"
									>
										{#if cell === null}-{:else if cell.hit}
											{#if cell.bounceCup}
												{cell.bounceCup},
											{/if}
											{#if cell.cup}
												{cell.cup}
											{/if}
										{:else}
											X
										{/if}
									</div>
								{/each}
							</div>
						</TableBodyCell>
					{/each}
				</TableBodyRow>
			{/each}
		{/each}
	</TableBody>
</Table>
