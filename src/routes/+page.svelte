<script>
	import { Card, Spinner } from 'flowbite-svelte';
	import { Button } from 'flowbite-svelte';
	import { CirclePlay, Trophy, History } from 'lucide-svelte';
	let loading = false;

	let leaderboard = [
		{ name: 'Alice', elo: 1520 },
		{ name: 'Bob', elo: 1480 },
		{ name: 'Charlie', elo: 1450 }
	];
</script>

<main class="space-y-10 p-6">
	<!-- Quick Actions -->
	<section>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<Card
				class="flex flex-col items-center rounded-2xl p-6 text-center shadow-lg transition hover:shadow-xl"
			>
				<CirclePlay class="mb-3 h-12 w-12 text-red-500" />
				<h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900">Start a Match</h5>
				<p class="mb-4 font-normal text-gray-600">
					Begin recording a new beer pong game shot-by-shot.
				</p>
				<Button
					color="red"
					class="rounded-full px-6"
					disabled={loading}
					onclick={() => {
						loading = true;
						window.location.href = '/match/setup';
					}}
				>
					{#if loading}
						<span class="flex items-center">
							<Spinner class="me-3" size="4" color="gray" />
							Loading...
						</span>
					{:else}
						Start
					{/if}
				</Button>
			</Card>

			<Card
				class="flex flex-col items-center rounded-2xl p-6 text-center shadow-lg transition hover:shadow-xl"
			>
				<Trophy class="mb-3 h-12 w-12 text-yellow-500" />
				<h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900">Leaderboard</h5>
				<p class="mb-4 font-normal text-gray-600">See who’s on top with the Elo ranking system.</p>
				<Button color="yellow" class="rounded-full px-6">View</Button>
			</Card>

			<Card
				class="flex flex-col items-center rounded-2xl p-6 text-center shadow-lg transition hover:shadow-xl"
			>
				<History class="mb-3 h-12 w-12 text-blue-500" />
				<h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900">Match History</h5>
				<p class="mb-4 font-normal text-gray-600">
					Look back at all the matches recorded over time.
				</p>
				<Button color="blue" class="rounded-full px-6">Browse</Button>
			</Card>
		</div>
	</section>

	<!-- Leaderboard Preview -->
	<section>
		<h2 class="mb-4 text-xl font-bold">🏆 Current Top Players</h2>
		<ul class="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm">
			{#each leaderboard as player, i}
				<li class="flex items-center justify-between p-4 transition hover:bg-gray-50">
					<span class="font-medium">{i + 1}. {player.name}</span>
					<span class="text-gray-600">Elo: {player.elo}</span>
				</li>
			{/each}
		</ul>
	</section>
</main>
