<script lang="ts">
	export let data;
</script>

<main class="flex flex-col items-center space-y-6 p-6">
	<h1 class="text-2xl font-bold">📜 Match History</h1>

	{#if data.matches.length === 0}
		<p class="text-gray-500">No matches recorded yet.</p>
	{:else}
		<div class="w-full max-w-2xl space-y-4">
			{#each data.matches as match}
				<div class="rounded-xl border bg-white p-4 shadow">
					<p class="text-sm text-gray-400">
						{new Date(match.createdAt).toLocaleString()}
					</p>

					<div class="mt-2 grid grid-cols-2 gap-4">
						<div class="text-center">
							<h3 class="font-semibold text-blue-600">Team Amine</h3>
							<ul>
								{#each match.teamAmineSide as entry}
									<li>{entry.player.name} ({entry.player.elo})</li>
								{/each}
							</ul>
						</div>

						<div class="text-center">
							<h3 class="font-semibold text-red-600">Team Robin</h3>
							<ul>
								{#each match.teamRobinSide as entry}
									<li>{entry.player.name} ({entry.player.elo})</li>
								{/each}
							</ul>
						</div>
					</div>

					<div class="mt-3 text-center font-bold">
						{#if match.winnerA}
							<span class="text-blue-600">🏆 Team Amine won!</span>
						{:else if match.winnerB}
							<span class="text-red-600">🏆 Team Robin won!</span>
						{:else}
							<span class="text-gray-500">Match pending result</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</main>
