<script lang="ts">
	import { Card, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Badge } from 'flowbite-svelte';
	type MatchupRow = {
		name: string;
		games: number;
		wins: number;
		losses: number;
		shotsHit: number;
		shotsTotal: number;
	};

	export let title: string;
	export let nameHeader: string;
	export let items: MatchupRow[] = [];
	export let loading = false;
</script>

{#if loading}
	<p class="text-sm text-gray-500">Chargement…</p>
{:else if !items || items.length === 0}
	<p class="text-sm text-gray-500">Aucune donnée à afficher.</p>
{:else}
	<Card class="mx-auto w-full max-w-3xl p-4">
		<div>
			<h2 class="mb-3 text-lg font-semibold">{title}</h2>
			<div class="w-full overflow-x-auto">
				<div class="mx-auto w-fit min-w-full sm:min-w-0">
					<Table>
						<TableHead>
							<TableHeadCell>{nameHeader}</TableHeadCell>
							<TableHeadCell>Parties</TableHeadCell>
							<TableHeadCell>Victoires-Défaites</TableHeadCell>
							<TableHeadCell>Taux de victoire</TableHeadCell>
							<TableHeadCell>Précision</TableHeadCell>
						</TableHead>
						<TableBody>
							{#each items as s}
								<TableBodyRow>
									<TableBodyCell>{s.name}</TableBodyCell>
									<TableBodyCell>{s.games}</TableBodyCell>
									<TableBodyCell>{s.wins}-{s.losses}</TableBodyCell>
									<TableBodyCell>
										{#if s.games > 0}
											{#if (s.wins / s.games) * 100 >= 50}
												<Badge color="green">{((s.wins / s.games) * 100).toFixed(1)}%</Badge>
											{:else}
												<Badge color="red">{((s.wins / s.games) * 100).toFixed(1)}%</Badge>
											{/if}
										{:else}
											-
										{/if}
									</TableBodyCell>
									<TableBodyCell>
										{#if s.shotsTotal > 0}
											<span style="color: hsl({(120 * (s.shotsHit / s.shotsTotal) * 100) / 100}, 70%, 45%)">
												{((s.shotsHit / s.shotsTotal) * 100).toFixed(1)}%
											</span>
										{:else}
											<span class="text-gray-500">n/a</span>
										{/if}
									</TableBodyCell>
								</TableBodyRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	</Card>
{/if}

<style>
	/* Minimal styles; layout handled via Flowbite/Tailwind classes */
</style>


