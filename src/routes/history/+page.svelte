<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import { Badge } from 'flowbite-svelte';
	export let data;
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	<h1 class="text-2xl font-bold">📜 Match History</h1>

	{#if data.matches.length === 0}
		<p class="text-gray-500">No matches recorded yet.</p>
	{:else}
		<div class="flex w-full flex-col items-center space-y-6">
			{#each data.matches as match}
				<Card
					class="w-full max-w-xl cursor-pointer p-4"
					onclick={() => (window.location.href = `/match/${match.id}/recap`)}
				>
					<!-- Match date -->
					<p class="text-sm text-gray-400">
						{new Date(match.createdAt).toLocaleString()}
					</p>

					<!-- Teams -->
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

					<!-- Result -->
					<div class="mt-4 text-center font-bold">
						{#if match.winnerA}
							<Badge color="blue" size="lg" class="px-4 py-1">🏆 Team Amine won!</Badge>
						{:else if match.winnerB}
							<Badge color="red" size="lg" class="px-4 py-1">🏆 Team Robin won!</Badge>
						{:else}
							<Badge color="gray" size="lg" class="px-4 py-1">Match pending result</Badge>
						{/if}
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</main>
