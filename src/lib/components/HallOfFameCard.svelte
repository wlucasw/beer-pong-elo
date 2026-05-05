<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import type { HallOfFameCardEntry } from '$lib/types';

	export let title: string;
	export let subtitle: string | undefined = undefined;
	export let entries: HallOfFameCardEntry[];

	const MEDALS = ['🥇', '🥈', '🥉'];
</script>

<Card class="p-4">
	<h2 class="mb-3 text-lg font-semibold">{title}</h2>
	{#if subtitle}
		<p class="mb-2 text-xs text-gray-400">{subtitle}</p>
	{/if}
	<div class="space-y-2">
		{#each entries as entry (entry.rank)}
			<button
				class="flex w-full items-center gap-3 rounded p-2 text-left {entry.onClick ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}"
				onclick={entry.onClick}
			>
				<span class="text-xl">{MEDALS[entry.rank - 1]}</span>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{entry.label}</p>
					{#if entry.subLabel}
						<p class="text-xs text-gray-400">{entry.subLabel}</p>
					{/if}
				</div>
				<span class="shrink-0 font-bold text-gray-700">{entry.value}</span>
			</button>
		{/each}
	</div>
</Card>
