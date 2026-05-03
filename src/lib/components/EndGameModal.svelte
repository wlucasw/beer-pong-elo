<script lang="ts">
	import { Button } from 'flowbite-svelte';

	export let match: {
		teamAmineSide: { player: { name: string }; teamName?: string }[];
		teamRobinSide: { player: { name: string }; teamName?: string }[];
	};
	export let onConfirm: (winner: 'A' | 'B') => void;
	export let onClose: () => void;
</script>

<div class="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
	<div class="min-w-[300px] rounded-lg bg-white p-6 shadow-lg">
		<h3 class="mb-4 text-lg font-semibold">Sélectionnez l'équipe gagnante</h3>
		<div class="flex flex-col gap-3">
			<Button color="blue" onclick={() => onConfirm('A')}>
				🏆 {match.teamAmineSide[0]?.teamName || 'Team Amine'}
			</Button>
			<div class="mb-2 ml-2 text-xs text-gray-500">
				{#each match.teamAmineSide as entry, i}
					{entry.player.name}{i < match.teamAmineSide.length - 1 ? ', ' : ''}
				{/each}
			</div>
			<Button color="red" onclick={() => onConfirm('B')}>
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
