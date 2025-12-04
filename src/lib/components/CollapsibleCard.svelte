<script lang="ts">
	import { Card } from 'flowbite-svelte';
	export let title: string;
	export let defaultOpen: boolean = false;
	export let className: string = '';
	let open = defaultOpen;
</script>

<Card class={`p-4 ${className}`}>
	<div class="flex items-center justify-between gap-3">
		<div
			class="flex cursor-pointer items-center gap-2 select-none"
			role="button"
			tabindex="0"
			on:click={() => (open = !open)}
			on:keydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					open = !open;
				}
			}}
		>
			<h2 class="text-lg font-semibold">{title}</h2>
			<!-- Chevron icon -->
			<svg
				class="h-5 w-5 transition-transform"
				style={`transform: rotate(${open ? 0 : -90}deg)`}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
				></path>
			</svg>
		</div>
		<div class="ml-auto flex items-center gap-3">
			<slot name="actions" />
		</div>
	</div>
	{#if open}
		<div class="mt-3">
			<slot />
		</div>
	{/if}
</Card>

<style>
	/* Styling is handled via Tailwind/Flowbite classes */
</style>
