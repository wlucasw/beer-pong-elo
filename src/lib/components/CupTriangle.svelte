<script lang="ts">
	export let cups: number[][] = []; // triangle layout, e.g. [[1],[2,3],[4,5,6],[7,8,9,10]]
	export let selectedCup: number | null = null;
	export let onSelectCup: (cup: number) => void;
	export let isHit: (cup: number) => boolean; // function to check if cup is already hit

	function handleClick(cup: number) {
		if (!isHit(cup)) {
			onSelectCup(cup);
		}
	}
</script>

<div class="space-y-2">
	{#each cups as row}
		<div class="flex justify-center space-x-2">
			{#each row as cup}
				<div
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2
						{selectedCup === cup
						? 'border-yellow-600 bg-yellow-400'
						: isHit(cup)
							? 'border-gray-500 bg-gray-400'
							: 'border-gray-400 bg-gray-200'}"
					onclick={() => handleClick(cup)}
				>
					{cup}
				</div>
			{/each}
		</div>
	{/each}
</div>
