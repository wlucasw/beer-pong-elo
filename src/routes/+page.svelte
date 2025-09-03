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
				<h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900">Démarrer un match</h5>
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
						Démarrer
					{/if}
				</Button>
			</Card>

			<Card
				class="flex flex-col items-center rounded-2xl p-6 text-center shadow-lg transition hover:shadow-xl"
			>
				<Trophy class="mb-3 h-12 w-12 text-yellow-500" />
				<h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900">Classement</h5>
				<Button
					color="yellow"
					class="rounded-full px-6"
					disabled={loading}
					onclick={() => {
						loading = true;
						window.location.href = '/players';
					}}
				>
					{#if loading}
						<span class="flex items-center">
							<Spinner class="me-3" size="4" color="gray" />
							Loading...
						</span>
					{:else}
						Voir
					{/if}
				</Button>
			</Card>

			<Card
				class="flex flex-col items-center rounded-2xl p-6 text-center shadow-lg transition hover:shadow-xl"
			>
				<History class="mb-3 h-12 w-12 text-blue-500" />
				<h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900">Historique des matches</h5>
				<Button
					color="blue"
					class="rounded-full px-6"
					disabled={loading}
					onclick={() => {
						loading = true;
						window.location.href = '/history';
					}}
				>
					{#if loading}
						<span class="flex items-center">
							<Spinner class="me-3" size="4" color="gray" />
							Loading...
						</span>
					{:else}
						Parcourir
					{/if}
				</Button>
			</Card>
		</div>
	</section>
</main>
