<script>
	import { Card, Spinner } from 'flowbite-svelte';
	import { Button } from 'flowbite-svelte';
	import { CirclePlay, Trophy, History, Settings } from 'lucide-svelte';
	let loading = false;
</script>

<main class="space-y-10 p-6">
	<!-- Quick Actions -->
	<section>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
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
						window.history.pushState({}, '', '/match/setup');
						window.dispatchEvent(new PopStateEvent('popstate'));
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
						window.history.pushState({}, '', '/players');
						window.dispatchEvent(new PopStateEvent('popstate'));
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
				<Settings class="mb-3 h-12 w-12 text-purple-600" />
				<h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900">Liste de soirée</h5>
				<Button
					color="purple"
					class="rounded-full px-6"
					disabled={loading}
					onclick={() => {
						loading = true;
						window.history.pushState({}, '', '/whitelist');
						window.dispatchEvent(new PopStateEvent('popstate'));
					}}
				>
					{#if loading}
						<span class="flex items-center">
							<Spinner class="me-3" size="4" color="gray" />
							Loading...
						</span>
					{:else}
						Configurer
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
						window.history.pushState({}, '', '/history');
						window.dispatchEvent(new PopStateEvent('popstate'));
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


