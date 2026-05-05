<script lang="ts">
	import {
		Table,
		TableHead,
		TableHeadCell,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		Badge
	} from 'flowbite-svelte';
	import CollapsibleCard from '$lib/components/CollapsibleCard.svelte';
	import type { MatchupRow } from '$lib/types';

	export let title: string;
	export let nameHeader: string;
	export let items: MatchupRow[] = [];
	export let loading = false;
	export let isOpponent = true;

	type SortKey = 'name' | 'games' | 'winRate' | 'myAcc' | 'theirAcc' | 'accDiff' | 'wrDiff';
	type SortDir = 'asc' | 'desc';

	let sortKey: SortKey = 'games';
	let sortDir: SortDir = 'desc';

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'desc';
		}
	}

	$: indicators = {
		name: sortKey === 'name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '',
		winRate: sortKey === 'winRate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '',
		myAcc: sortKey === 'myAcc' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '',
		theirAcc: sortKey === 'theirAcc' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '',
		accDiff: sortKey === 'accDiff' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '',
		wrDiff: sortKey === 'wrDiff' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''
	};

	function rowValues(s: MatchupRow) {
		const myWinPct = s.games > 0 ? (s.wins / s.games) * 100 : 0;
		const myAccPct = s.shotsTotal > 0 ? (s.shotsHit / s.shotsTotal) * 100 : null;
		const theirAccPct = s.theirShotsTotal > 0 ? (s.theirShotsHit / s.theirShotsTotal) * 100 : null;
		const accDiff = theirAccPct !== null ? theirAccPct - s.theirGlobalAccuracyPct : null;
		const wrDiff = s.games > 0 ? s.theirWinPercentVsUs - s.theirGlobalWinPercent : null;
		return { myWinPct, myAccPct, theirAccPct, accDiff, wrDiff };
	}

	function sortValue(s: MatchupRow, key: SortKey): number | string {
		const v = rowValues(s);
		switch (key) {
			case 'name': return s.name.toLowerCase();
			case 'games': return s.games;
			case 'winRate': return v.myWinPct;
			case 'myAcc': return v.myAccPct ?? -1;
			case 'theirAcc': return v.theirAccPct ?? -1;
			case 'accDiff': return v.accDiff ?? -Infinity;
			case 'wrDiff': return v.wrDiff ?? -Infinity;
		}
	}

	$: sortedItems = [...items].sort((a, b) => {
		const va = sortValue(a, sortKey);
		const vb = sortValue(b, sortKey);
		const cmp = va < vb ? -1 : va > vb ? 1 : 0;
		return sortDir === 'asc' ? cmp : -cmp;
	});

	$: matchupNaming = isOpponent ? 'adverse' : 'part.';

	function winRateColor(pct: number): string {
		return `hsl(${(120 * pct) / 100}, 70%, 45%)`;
	}

	function accuracyColor(pct: number): string {
		return `hsl(${(120 * pct) / 100}, 70%, 45%)`;
	}

	function diffColor(diff: number, isOpponentContext: boolean): string {
		const positive = isOpponentContext ? diff < 0 : diff > 0;
		return positive ? 'hsl(120, 70%, 40%)' : diff === 0 ? 'inherit' : 'hsl(0, 75%, 50%)';
	}

	function diffLabel(diff: number): string {
		return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
	}
</script>

{#if loading}
	<p class="text-sm text-gray-500">Chargement…</p>
{:else if !items || items.length === 0}
	<p class="text-sm text-gray-500">Aucune donnée à afficher.</p>
{:else}
	<CollapsibleCard {title} className="mx-auto w-full max-w-3xl p-4">
		<div class="w-full overflow-x-auto">
			<div class="mx-auto w-fit min-w-full sm:min-w-0">
				<Table>
					<TableHead>
						<TableHeadCell class="cursor-pointer select-none hover:bg-gray-100" onclick={() => toggleSort('name')}>
							{nameHeader}{indicators.name}
						</TableHeadCell>
						<TableHeadCell>V-D</TableHeadCell>
						<TableHeadCell class="cursor-pointer select-none hover:bg-gray-100" onclick={() => toggleSort('winRate')}>
							Mon WR{indicators.winRate}
						</TableHeadCell>
						<TableHeadCell class="cursor-pointer select-none hover:bg-gray-100" onclick={() => toggleSort('myAcc')}>
							Ma préc.{indicators.myAcc}
						</TableHeadCell>
						<TableHeadCell class="cursor-pointer select-none hover:bg-gray-100" onclick={() => toggleSort('theirAcc')}>
							Préc. {matchupNaming}{indicators.theirAcc}
						</TableHeadCell>
						<TableHeadCell class="cursor-pointer select-none hover:bg-gray-100" onclick={() => toggleSort('accDiff')}>
							Δ Préc. {matchupNaming}{indicators.accDiff}
						</TableHeadCell>
						<TableHeadCell class="cursor-pointer select-none hover:bg-gray-100" onclick={() => toggleSort('wrDiff')}>
							Δ WR {matchupNaming}{indicators.wrDiff}
						</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each sortedItems as s}
							{@const { myWinPct, myAccPct, theirAccPct, accDiff, wrDiff } = rowValues(s)}
							<TableBodyRow>
								<TableBodyCell>{s.name}</TableBodyCell>
								<TableBodyCell>{s.wins}-{s.losses}</TableBodyCell>

								<TableBodyCell>
									{#if s.games > 0}
										{#if myWinPct >= 50}
											<Badge color="green">{myWinPct.toFixed(1)}%</Badge>
										{:else}
											<Badge color="red">{myWinPct.toFixed(1)}%</Badge>
										{/if}
									{:else}
										-
									{/if}
								</TableBodyCell>

								<TableBodyCell>
									{#if myAccPct !== null}
										<span style="color: {accuracyColor(myAccPct)}">{myAccPct.toFixed(1)}%</span>
									{:else}
										<span class="text-gray-400">n/a</span>
									{/if}
								</TableBodyCell>

								<TableBodyCell>
									{#if theirAccPct !== null}
										<span style="color: {accuracyColor(theirAccPct)}">{theirAccPct.toFixed(1)}%</span>
									{:else}
										<span class="text-gray-400">n/a</span>
									{/if}
								</TableBodyCell>

								<TableBodyCell>
									{#if accDiff !== null}
										<span style="color: {diffColor(accDiff, isOpponent)}; font-weight: 600">
											{diffLabel(accDiff)}
										</span>
									{:else}
										<span class="text-gray-400">n/a</span>
									{/if}
								</TableBodyCell>

								<TableBodyCell>
									{#if wrDiff !== null}
										<span style="color: {diffColor(wrDiff, isOpponent)}; font-weight: 600">
											{diffLabel(wrDiff)}
										</span>
									{:else}
										-
									{/if}
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		</div>
	</CollapsibleCard>
{/if}
