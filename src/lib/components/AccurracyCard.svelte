<script lang="ts">
	import { Card } from 'flowbite-svelte';
    
    export let playersTeamA: { name: string; accuracy: number }[];
    export let playersTeamB: { name: string; accuracy: number }[];
</script>

<Card class={`p-4`}>
    <h2 class="mb-4 text-lg font-semibold">🎯 Précision par joueur</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <h3 class="mb-2 font-medium text-blue-600">Équipe Amine</h3>
            {#each playersTeamA as player}
                <div class="flex justify-between mb-1">
                    <span>{player.name}</span>
                    <span>{player.accuracy.toFixed(1)}%</span>
                </div>
            {/each}
        </div>
        <div>
            <h3 class="mb-2 font-medium text-red-600">Équipe Robin</h3>
            {#each playersTeamB as player}
                <div class="flex justify-between mb-1">
                    <span>{player.name}</span>
                    <span>{player.accuracy.toFixed(1)}%</span>
                </div>
            {/each}
        </div>
    </div>

</Card>

<style>
	/* Styling is handled via Tailwind/Flowbite classes */
</style>
