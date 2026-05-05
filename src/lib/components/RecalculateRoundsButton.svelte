<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from 'flowbite-svelte';
	import type { Shot, MatchFull } from '$lib/types';

	export let matchId: number;
	export let initialShotsByMatch: number;

	const dispatch = createEventDispatcher<{ done: { match: MatchFull; shots: Shot[] } }>();

	let modalOpen = false;
	let recalculating = false;
	let recalcError = '';
	let shotsByMatch = initialShotsByMatch;

	function open() {
		shotsByMatch = initialShotsByMatch;
		recalcError = '';
		modalOpen = true;
	}

	async function submit(numberOfShots: number) {
		recalcError = '';
		recalculating = true;
		try {
			const res = await fetch(`/api/match/${matchId}/recalculate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ numberOfShotByMatch: numberOfShots })
			});
			if (!res.ok) {
				recalcError = (await res.text()) || 'Échec du recalcul';
				return;
			}
			const match: MatchFull = await res.json();
			const shotsRes = await fetch(`/api/match/${matchId}/recap`);
			const shots: Shot[] = await shotsRes.json();
			dispatch('done', { match, shots });
			modalOpen = false;
		} catch (e: any) {
			recalcError = e.message ?? 'Échec du recalcul';
		} finally {
			recalculating = false;
		}
	}
</script>

<button
	on:click={open}
	class="fixed bottom-6 right-6 rounded-full bg-gray-100 p-3 text-gray-400 shadow hover:bg-gray-200 hover:text-gray-600"
	title="Recalculer les manches"
>
	⚙️
</button>

{#if modalOpen}
	<div class="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="min-w-[300px] rounded-lg bg-white p-6 shadow-lg">
			<h3 class="mb-4 text-lg font-semibold">Recalculer les manches</h3>
			<div class="mb-4 flex flex-col gap-3">
				<label for="shots-by-match" class="text-sm text-gray-600">Nombre de balles par manche</label>
				<input
					id="shots-by-match"
					type="number"
					min="1"
					bind:value={shotsByMatch}
					class="w-full rounded border px-2 py-1"
				/>
				{#if recalcError}
					<p class="text-sm text-red-600">{recalcError}</p>
				{/if}
			</div>
			<div class="flex flex-col gap-3">
				<Button color="blue" onclick={() => submit(shotsByMatch)} disabled={recalculating}>
					{recalculating ? 'Recalcul en cours…' : 'Recalculer'}
				</Button>
				<Button color="red" onclick={() => submit(-1)} disabled={recalculating}>
					Réinitialiser les manches
				</Button>
				<Button color="gray" onclick={() => (modalOpen = false)}>Annuler</Button>
			</div>
		</div>
	</div>
{/if}
