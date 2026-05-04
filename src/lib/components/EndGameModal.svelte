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
				🏆 {match.teamAmineSide.map((e) => e.player.name).join(' · ')}
			</Button>
			<Button color="red" onclick={() => onConfirm('B')}>
				🏆 {match.teamRobinSide.map((e) => e.player.name).join(' · ')}
			</Button>
		</div>
		<Button class="mt-4" color="gray" onclick={onClose}>Annuler</Button>
	</div>
</div>
