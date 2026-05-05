<script lang="ts">
	import { Card, Button, Spinner } from 'flowbite-svelte';
	import type { ComponentType, SvelteComponent } from 'svelte';
	import type { IconProps } from 'lucide-svelte';

	type ButtonColor = 'red' | 'yellow' | 'purple' | 'blue' | 'dark' | 'green';
	type LucideIcon = ComponentType<SvelteComponent<IconProps>>;

	interface Props {
		icon: LucideIcon;
		iconClass: string;
		title: string;
		label: string;
		color: ButtonColor;
		href: string;
		loading: boolean;
		onNavigate: (href: string) => void;
	}

	let { icon: Icon, iconClass, title, label, color, href, loading, onNavigate }: Props = $props();
</script>

<Card class="flex w-52 flex-col items-center rounded-2xl p-6 text-center shadow-lg transition hover:shadow-xl">
	<Icon class="mb-3 h-12 w-12 {iconClass}" />
	<h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900">{title}</h5>
	<Button {color} class="rounded-full px-6" disabled={loading} onclick={() => onNavigate(href)}>
		{#if loading}
			<span class="flex items-center">
				<Spinner class="me-3" size="4" color="gray" />
				Chargement...
			</span>
		{:else}
			{label}
		{/if}
	</Button>
</Card>
