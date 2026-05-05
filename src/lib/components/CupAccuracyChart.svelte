<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { select, scaleLinear, scaleBand, axisBottom, axisLeft } from 'd3';
	import type { CupAccuracyPoint } from '$lib/types';

	export let data: CupAccuracyPoint[] = [];
	export let height = 260;
	export let margin = { top: 16, right: 20, bottom: 44, left: 48 };

	let containerEl: HTMLDivElement;
	let svgEl: SVGSVGElement;
	let resizeObserver: ResizeObserver | null = null;

	function accuracyColor(accuracy: number): string {
		return `hsl(${(120 * accuracy) / 100}, 70%, 45%)`;
	}

	function draw() {
		if (!containerEl || !svgEl) return;

		const width = containerEl.clientWidth;
		const innerWidth = Math.max(0, width - margin.left - margin.right);
		const innerHeight = Math.max(0, height - margin.top - margin.bottom);

		const sorted = [...data].sort((a, b) => b.cupsRemaining - a.cupsRemaining);

		const el = select(svgEl);
		el.selectAll('*').remove();
		el.attr('width', width).attr('height', height);

		const g = el.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		const x = scaleBand()
			.domain(sorted.map((d) => String(d.cupsRemaining)))
			.range([0, innerWidth])
			.padding(0.25);

		const y = scaleLinear().domain([0, 100]).range([innerHeight, 0]);

		// Gridlines
		g.append('g')
			.attr('stroke', '#e5e7eb')
			.attr('stroke-opacity', 0.7)
			.selectAll('line.grid')
			.data(y.ticks(5))
			.join('line')
			.attr('x1', 0)
			.attr('x2', innerWidth)
			.attr('y1', (d: number) => y(d))
			.attr('y2', (d: number) => y(d));

		// X axis
		g.append('g')
			.attr('transform', `translate(0,${innerHeight})`)
			.call(axisBottom(x));

		// Y axis
		g.append('g').call(
			axisLeft(y)
				.ticks(5)
				.tickFormat((d: number | { valueOf(): number }) => `${d}%`)
		);

		// X axis label
		g.append('text')
			.attr('x', innerWidth / 2)
			.attr('y', innerHeight + 38)
			.attr('text-anchor', 'middle')
			.attr('font-size', '11px')
			.attr('fill', '#6b7280')
			.text('Verres restantes (adversaire)');

		// Bars
		const bars = g
			.append('g')
			.selectAll('rect')
			.data(sorted)
			.join('rect')
			.attr('x', (d: CupAccuracyPoint) => x(String(d.cupsRemaining))!)
			.attr('y', (d: CupAccuracyPoint) => (d.total === 0 ? innerHeight : y(d.accuracy)))
			.attr('width', x.bandwidth())
			.attr('height', (d: CupAccuracyPoint) => (d.total === 0 ? 0 : innerHeight - y(d.accuracy)))
			.attr('fill', (d: CupAccuracyPoint) =>
				d.total === 0 ? '#e5e7eb' : accuracyColor(d.accuracy)
			)
			.attr('rx', 3);

		bars
			.append('title')
			.text((d: CupAccuracyPoint) =>
				d.total === 0
					? `${d.cupsRemaining} verre(s): aucune donnée`
					: `${d.cupsRemaining} verre(s): ${d.accuracy.toFixed(1)}% (${d.hits}/${d.total} tirs)`
			);

		// Accuracy labels on bars (only if bar is tall enough)
		g.append('g')
			.selectAll('text.bar-label')
			.data(sorted.filter((d: CupAccuracyPoint) => d.total > 0 && innerHeight - y(d.accuracy) > 18))
			.join('text')
			.attr('class', 'bar-label')
			.attr('x', (d: CupAccuracyPoint) => x(String(d.cupsRemaining))! + x.bandwidth() / 2)
			.attr('y', (d: CupAccuracyPoint) => y(d.accuracy) + 13)
			.attr('text-anchor', 'middle')
			.attr('font-size', '10px')
			.attr('fill', 'white')
			.attr('font-weight', '600')
			.text((d: CupAccuracyPoint) => `${d.accuracy.toFixed(0)}%`);
	}

	function setupResize() {
		if (resizeObserver) return;
		resizeObserver = new ResizeObserver(() => draw());
		resizeObserver.observe(containerEl);
	}

	onMount(() => {
		setupResize();
		draw();
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		resizeObserver = null;
	});

	$: (data, height, margin, draw());
</script>

<div bind:this={containerEl} class="w-full">
	<svg bind:this={svgEl} />
</div>

<style>
	svg {
		display: block;
	}
</style>
