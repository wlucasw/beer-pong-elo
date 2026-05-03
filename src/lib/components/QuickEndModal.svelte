<script lang="ts">
	import { Button } from 'flowbite-svelte';

	export let match: {
		teamAmineSide: { player: { name: string }; teamName?: string }[];
		teamRobinSide: { player: { name: string }; teamName?: string }[];
	};
	export let onConfirm: (winner: 'A' | 'B', scoreAmine: number, scoreRobin: number) => void;
	export let onClose: () => void;

	let scoreAmine = '';
	let scoreRobin = '';
</script>

<div class="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
	<div class="min-w-[300px] rounded-lg bg-white p-6 shadow-lg">
		<h3 class="mb-4 text-lg font-semibold">Sélectionnez l'équipe gagnante</h3>
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-4">
				<label class="text-sm" for="scoreAmine">Ecocups restante</label>
				<input
					type="number"
					min="0"
					class="mt-1 w-28 rounded border px-2 py-1"
					id="scoreAmine"
					bind:value={scoreAmine}
					placeholder="Amine Side"
				/>
				<input
					type="number"
					min="0"
					class="mt-1 w-28 rounded border px-2 py-1"
					id="scoreRobin"
					bind:value={scoreRobin}
					placeholder="Robin Side"
				/>
			</div>
			<Button
				color="blue"
				onclick={() => onConfirm('A', Number(scoreAmine), Number(scoreRobin))}
				disabled={scoreAmine === ''}
			>
				🏆 {match.teamAmineSide[0]?.teamName || 'Amine Side'}
			</Button>
			<div class="mb-2 ml-2 text-xs text-gray-500">
				{#each match.teamAmineSide as entry, i}
					{entry.player.name}{i < match.teamAmineSide.length - 1 ? ', ' : ''}
				{/each}
			</div>
			<Button
				color="red"
				onclick={() => onConfirm('B', Number(scoreAmine), Number(scoreRobin))}
				disabled={scoreRobin === ''}
			>
				🏆 {match.teamRobinSide[0]?.teamName || 'Robin Side'}
			</Button>
			<div class="mb-2 ml-2 text-xs text-gray-500">
				{#each match.teamRobinSide as entry, i}
					{entry.player.name}{i < match.teamRobinSide.length - 1 ? ', ' : ''}
				{/each}
			</div>
		</div>
		<Button class="mt-4" color="gray" onclick={onClose}>Annuler</Button>
	</div>
</div>
