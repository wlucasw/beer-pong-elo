<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		select,
		scaleTime,
		scaleLinear,
		axisBottom,
		axisLeft,
		line as d3Line,
		extent,
		max,
		format
	} from 'd3';

	type EloMatchPoint = {
		createdAt: string;
		eloVariation: number;
	};
	type SeriesPoint = { date: Date; elo: number };

	export let matches: EloMatchPoint[] = [];
	export let startingElo: number = 1000;
	export let height = 300;
	export let margin = { top: 16, right: 20, bottom: 28, left: 44 };
	export let xMode: 'date' | 'index' = 'date';

	let containerEl: HTMLDivElement;
	let svgEl: SVGSVGElement;

	let resizeObserver: ResizeObserver | null = null;

	function computeSeries() {
		const sorted = [...matches].sort((a: EloMatchPoint, b: EloMatchPoint) => {
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		});
		let current = startingElo;
		const series: SeriesPoint[] = [];

		// Add initial starting point at startingElo before the first match
		if (sorted.length > 0) {
			const firstDate = new Date(sorted[0].createdAt);
			const initialDate = new Date(firstDate.getTime() - 1000); // 1s before first match
			series.push({ date: initialDate, elo: current });
		}

		for (const m of sorted) {
			current += m.eloVariation ?? 0;
			series.push({ date: new Date(m.createdAt), elo: current });
		}
		return series;
	}

	function draw() {
		if (!containerEl) return;

		const width = containerEl.clientWidth;
		const innerWidth = Math.max(0, width - margin.left - margin.right);
		const innerHeight = Math.max(0, height - margin.top - margin.bottom);

		const data = computeSeries();
		const n = data.length;

		const eloMax = max(data, (d: SeriesPoint) => d.elo) ?? startingElo;
		const eloMin = data.length > 0 ? Math.min(...data.map((d: SeriesPoint) => d.elo)) : startingElo;

		let x: any;
		if (xMode === 'date') {
			const datesExtent = extent(data, (d: SeriesPoint) => d.date) as
				| [Date, Date]
				| [undefined, undefined];
			const minDate = datesExtent?.[0] ?? new Date();
			const maxDate = datesExtent?.[1] ?? new Date();
			x = scaleTime().domain([minDate, maxDate]).range([0, innerWidth]).nice();
		} else {
			// x is game index starting at 1
			x = scaleLinear()
				.domain([1, Math.max(1, n)])
				.range([0, innerWidth])
				.nice();
		}
		const y = scaleLinear()
			.domain([Math.floor(eloMin - 10), Math.ceil(eloMax + 10)])
			.range([innerHeight, 0])
			.nice();

		const el = select(svgEl);
		el.selectAll('*').remove();

		el.attr('width', width).attr('height', height);

		const g = el.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		// Axes
		const xAxis = g.append('g').attr('transform', `translate(0,${innerHeight})`);
		if (xMode === 'date') {
			xAxis.call((axisBottom as any)(x).ticks(5));
		} else {
			xAxis.call(
				(axisBottom as any)(x)
					.ticks(Math.min(10, n))
					.tickFormat(format('d') as any)
			);
		}

		g.append('g').call(axisLeft(y).ticks(5));

		// Gridlines (horizontal)
		g.append('g')
			.attr('stroke', '#e5e7eb')
			.attr('stroke-opacity', 0.6)
			.selectAll('line.grid')
			.data(y.ticks(5) as number[])
			.join('line')
			.attr('x1', 0)
			.attr('x2', innerWidth)
			.attr('y1', (d: number) => y(d))
			.attr('y2', (d: number) => y(d));

		// Line
		const lineGen = d3Line();
		if (xMode === 'date') {
			lineGen.x((d: SeriesPoint) => (x as any)(d.date));
		} else {
			lineGen.x((_: SeriesPoint, i: number) => (x as any)(i + 1));
		}
		lineGen.y((d: SeriesPoint) => y(d.elo));

		g.append('path')
			.datum(data)
			.attr('fill', 'none')
			.attr('stroke', '#3b82f6')
			.attr('stroke-width', 2)
			.attr('d', lineGen);

		// Points with native title tooltip
		g.append('g')
			.selectAll('circle')
			.data(data as SeriesPoint[])
			.join('circle')
			.attr('cx', (d: SeriesPoint, i: number) =>
				xMode === 'date' ? (x as any)(d.date) : (x as any)(i + 1)
			)
			.attr('cy', (d: SeriesPoint) => y(d.elo))
			.attr('r', 3)
			.attr('fill', '#1d4ed8')
			.append('title')
			.text((d: SeriesPoint, i: number) => {
				if (xMode === 'date') {
					return `${d.date.toLocaleDateString()}\nElo: ${d.elo}`;
				}
				return i === 0 ? `Start\nElo: ${d.elo}` : `Game #${i}\nElo: ${d.elo}`;
			});
	}

	function setupResize() {
		if (resizeObserver) return;
		resizeObserver = new ResizeObserver(() => {
			draw();
		});
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

	$: (matches, startingElo, height, margin, xMode, draw());
</script>

<div bind:this={containerEl} class="w-full">
	<svg bind:this={svgEl} />
</div>

<style>
	svg {
		display: block;
	}
</style>
