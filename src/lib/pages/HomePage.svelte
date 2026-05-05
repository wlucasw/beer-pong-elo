<script lang="ts">
	import { CirclePlay, Trophy, History, Settings, Medal } from 'lucide-svelte';
	import HomeCard from '$lib/components/HomeCard.svelte';

	let loading = $state(false);

	function navigate(href: string) {
		loading = true;
		window.history.pushState({}, '', href);
		window.dispatchEvent(new PopStateEvent('popstate'));
	}
</script>

<main class="space-y-10 p-6">
	<section class="flex flex-col items-center gap-6">
		<div class="flex flex-wrap justify-center gap-6">
			<HomeCard
				icon={CirclePlay}
				iconClass="text-red-500"
				title="Démarrer un match"
				label="Démarrer"
				color="red"
				href="/match/setup"
				{loading}
				onNavigate={navigate}
			/>
			<HomeCard
				icon={Trophy}
				iconClass="text-yellow-500"
				title="Classement"
				label="Voir"
				color="yellow"
				href="/players"
				{loading}
				onNavigate={navigate}
			/>

			<HomeCard
				icon={History}
				iconClass="text-blue-500"
				title="Historique des matches"
				label="Parcourir"
				color="blue"
				href="/history"
				{loading}
				onNavigate={navigate}
			/>
		</div>

		<div class="flex flex-wrap justify-center gap-6">
			<HomeCard
				icon={Settings}
				iconClass="text-purple-600"
				title="Liste de soirée"
				label="Configurer"
				color="purple"
				href="/whitelist"
				{loading}
				onNavigate={navigate}
			/>
			<HomeCard
				icon={Medal}
				iconClass="text-amber-500"
				title="Hall of Fame"
				label="Découvrir"
				color="dark"
				href="/hall-of-fame"
				{loading}
				onNavigate={navigate}
			/>
		</div>
	</section>
</main>
