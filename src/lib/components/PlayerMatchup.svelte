<script lang="ts">
	import { onMount } from 'svelte';
	import MatchupTable from '$lib/components/MatchupTable.svelte';
	import type { MatchupRow, MatchupApiRow } from '$lib/types';

	export let playerId: number;

	let loading = true;
	let items: MatchupRow[] = [];

	async function fetchStats() {
		try {
			const res = await fetch(`/api/player/${playerId}/matchups/opponents`);
			const data: MatchupApiRow[] = await res.json();
			items = (data ?? []).map((r) => ({
				name: r.name,
				games: r.games,
				wins: r.wins,
				losses: r.losses,
				shotsHit: r.shotsHit,
				shotsTotal: r.shotsTotal
			}));
		} catch {
			items = [];
		}
	}

	onMount(async () => {
		await fetchStats();
		loading = false;
	});

	$: (playerId,
		(async () => {
			loading = true;
			await fetchStats();
			loading = false;
		})());
</script>

<MatchupTable title="🔁 Matchups by opponent" nameHeader="Adversaire" {items} {loading} />
