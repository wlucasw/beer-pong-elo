<script lang="ts">
	import {
		Card,
		Button,
		Spinner,
		Table,
		TableHead,
		TableHeadCell,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		Input
	} from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { Player } from '$../../../domain/Player';

	let loading = true;
	let saving = false;
	let error = '';
	let success = '';
	let search = '';
	let players: Player[] = [];
	let whitelistedNames = new Set<string>();

	onMount(async () => {
		try {
			const [playersRes, whitelistRes] = await Promise.all([
				fetch('/api/player'),
				fetch('/api/player/whitelist')
			]);
			players = await playersRes.json();
			const wl: string[] = await whitelistRes.json();
			whitelistedNames = new Set(wl ?? []);
		} catch (e) {
			error = 'Impossible de charger la liste de soirée';
		} finally {
			loading = false;
		}
	});

	function isWhitelisted(name: string): boolean {
		return whitelistedNames.has(name);
	}

	function togglePlayer(name: string) {
		if (whitelistedNames.has(name)) {
			whitelistedNames.delete(name);
		} else {
			whitelistedNames.add(name);
		}
	}

	async function handleSave() {
		saving = true;
		error = '';
		success = '';
		try {
			const playersToSave = players
				.filter((p) => whitelistedNames.has(p.name))
				.map((p) => p.name);
			const res = await fetch('/api/player/whitelist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ players: playersToSave })
			});
			if (!res.ok) {
				error = 'Échec de l’enregistrement';
			} else {
				success = 'Liste de soirée enregistrée';
			}
		} catch (e) {
			error = 'Erreur réseau';
		} finally {
			saving = false;
		}
	}
</script>

<main class="p-6">
	<Card class="mx-auto w-full max-w-2xl space-y-4 p-6">
		<h2 class="text-center text-xl font-bold">⚙️ Liste de soirée</h2>

		{#if loading}
			<div class="flex justify-center py-8">
				<Spinner size="6" color="gray" />
			</div>
		{:else}
			<div class="space-y-3">
				<label for="whitelist-search" class="block text-sm font-medium text-gray-700">Rechercher</label>
				<Input id="whitelist-search" type="text" placeholder="Nom du joueur" bind:value={search} />
			</div>

			<Table>
				<TableHead>
					<TableHeadCell>Joueur</TableHeadCell>
					<TableHeadCell class="text-right">ELO</TableHeadCell>
					<TableHeadCell class="w-40 text-center">Whitelist</TableHeadCell>
				</TableHead>
				<TableBody>
					{#each [...players].sort((a, b) => a.name.localeCompare(b.name)).filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) as p}
						<TableBodyRow>
							<TableBodyCell>{p.name}</TableBodyCell>
							<TableBodyCell class="text-right">{p.elo}</TableBodyCell>
							<TableBodyCell class="text-center">
								<input
									type="checkbox"
									class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									checked={isWhitelisted(p.name)}
									on:change={() => togglePlayer(p.name)}
								/>
							</TableBodyCell>
						</TableBodyRow>
					{/each}
				</TableBody>
			</Table>

			<div class="flex items-center gap-3">
				<Button color="purple" class="px-6" disabled={saving} onclick={handleSave}>
					{#if saving}
						<span class="flex items-center">
							<Spinner class="me-3" size="4" color="gray" />
							Enregistrement...
						</span>
					{:else}
						Enregistrer
					{/if}
				</Button>
				{#if success}
					<span class="text-sm text-green-600">{success}</span>
				{/if}
				{#if error}
					<span class="text-sm text-red-600">{error}</span>
				{/if}
			</div>
		{/if}
	</Card>
</main>


