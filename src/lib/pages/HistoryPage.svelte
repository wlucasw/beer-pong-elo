<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, Badge } from 'flowbite-svelte';
	import type { MatchLite } from '$lib/types';

	type MatchGroup = {
		key: string;
		label: string;
		matches: MatchLite[];
	};

	let matches: MatchLite[] = [];
	let loading = true;
	let collapsedGroups: Record<string, boolean> = {};

	// A "day" runs from noon to noon: subtract 12h so noon becomes midnight,
	// then use local date components to get the session date.
	function getSessionKey(date: Date): string {
		const adjusted = new Date(date.getTime() - 12 * 60 * 60 * 1000);
		const y = adjusted.getFullYear();
		const m = String(adjusted.getMonth() + 1).padStart(2, '0');
		const d = String(adjusted.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	function getSessionLabel(key: string): string {
		const [y, m, d] = key.split('-').map(Number);
		const start = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
		const endDate = new Date(y, m - 1, d + 1);
		const end = `${String(endDate.getDate()).padStart(2, '0')}/${String(endDate.getMonth() + 1).padStart(2, '0')}`;
		return `${start}-${end} ${y}`;
	}

	$: groups = Object.entries(
		matches.reduce((acc: Record<string, MatchGroup>, match) => {
			const key = getSessionKey(new Date(match.createdAt));
			if (!acc[key]) acc[key] = { key, label: getSessionLabel(key), matches: [] };
			acc[key].matches.push(match);
			return acc;
		}, {})
	)
		.sort(([a], [b]) => b.localeCompare(a))
		.map(([, group]) => group);

	function toggleGroup(key: string): void {
		collapsedGroups = { ...collapsedGroups, [key]: !collapsedGroups[key] };
	}

	onMount(async () => {
		const res = await fetch('/api/match?finished=1');
		matches = res.ok ? await res.json() : [];
		loading = false;
	});
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	<h1 class="text-2xl font-bold">📜 Historique des parties</h1>

	{#if loading}
		<p class="text-gray-500">Chargement...</p>
	{:else if matches.length === 0}
		<p class="text-gray-500">Aucune partie enregistrée.</p>
	{:else}
		<div class="flex w-full flex-col items-center space-y-4">
			{#each groups as group}
				<div class="w-full max-w-xl">
					<button
						class="flex w-full items-center justify-between rounded-lg bg-gray-100 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
						onclick={() => toggleGroup(group.key)}
					>
						<span>🗓 {group.label}</span>
						<span class="text-sm text-gray-500 dark:text-gray-400">
							{group.matches.length} partie{group.matches.length > 1 ? 's' : ''}
							{collapsedGroups[group.key] ? '▼' : '▲'}
						</span>
					</button>

					{#if !collapsedGroups[group.key]}
						<div class="mt-3 flex flex-col space-y-4 items-center">
							{#each group.matches as match}
								<Card
									class="w-full cursor-pointer p-4"
									onclick={() => {
										window.history.pushState({}, '', `/match/${match.id}/recap`);
										window.dispatchEvent(new PopStateEvent('popstate'));
									}}
								>
									<p class="text-sm text-gray-400">
										{new Date(match.createdAt).toLocaleString()}
									</p>

									<div class="mt-3 grid grid-cols-2 gap-6">
										<div class="text-center">
											<h3 class="mb-1 font-semibold text-blue-600">Team Amine</h3>
											<ul class="space-y-1">
												{#each match.teamAmineSide as entry}
													<li class="text-sm">
														{entry.player.name}
														<Badge color="blue" class="ml-1">{entry.player.elo}</Badge>
													</li>
												{/each}
											</ul>
										</div>

										<div class="text-center">
											<h3 class="mb-1 font-semibold text-red-600">Team Robin</h3>
											<ul class="space-y-1">
												{#each match.teamRobinSide as entry}
													<li class="text-sm">
														{entry.player.name}
														<Badge color="red" class="ml-1">{entry.player.elo}</Badge>
													</li>
												{/each}
											</ul>
										</div>
									</div>

									<div class="mt-4 text-center font-bold">
										{#if match.winnerA}
											<Badge color="blue" size="lg" class="px-4 py-1">🏆 Team Amine won!</Badge>
										{:else if match.winnerB}
											<Badge color="red" size="lg" class="px-4 py-1">🏆 Team Robin won!</Badge>
										{:else}
											<Badge color="gray" size="lg" class="px-4 py-1">Résultat en attente</Badge>
										{/if}
									</div>
								</Card>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</main>
