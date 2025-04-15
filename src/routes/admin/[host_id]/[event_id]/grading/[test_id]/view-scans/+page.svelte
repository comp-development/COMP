<script lang="ts">
	import { onMount } from "svelte";
	import { supabase } from "$lib/supabaseClient";
	import { page } from "$app/stores";
	import {
		Canvas,
		FabricImage,
		Rect,
		Group,
	} from "fabric";

	let test_id = Number($page.params.test_id);
	let canvas: Canvas;
	let boundingBoxes = [];
	let scanImages: { url: string; page_number: number }[] = [];
	let currentPage = 0;
	let zoomLevel = 0.8;
	let inputPage = 1;
	let group: Group | null = null;

	function calculateDimensions(bounding_boxes) {
		return bounding_boxes.map((bounding_box) => {
			const topLeftX = parseFloat(bounding_box.top_left[0]);
			const topLeftY = parseFloat(bounding_box.top_left[1]);
			const bottomRightX = parseFloat(bounding_box.bottom_right[0]);
			const bottomRightY = parseFloat(bounding_box.bottom_right[1]);

			return {
				left: topLeftX,
				top: topLeftY,
				width: bottomRightX - topLeftX,
				height: bottomRightY - topLeftY,
				page: bounding_box.page ?? 1,
			};
		});
	}

	async function loadPage(index: number) {
		canvas.clear();
		const scan = scanImages[index];
		const image = await FabricImage.fromURL(scan.url);
		image.set({ selectable: false });
		canvas.setWidth(image.width!);
		canvas.setHeight(image.height!);

		const rects = boundingBoxes
			.filter((b) => b.page === scan.page_number || b.page === 1)
			.map((box) =>
				new Rect({
					left: (box.left / 612) * image.width!,
					top: (box.top / 792) * image.height!,
					width: (box.width / 612) * image.width!,
					height: (box.height / 792) * image.height!,
					fill: "transparent",
					stroke: "red",
					strokeWidth: 2,
					selectable: false,
				})
			);

		group = new Group([image, ...rects], {
			selectable: false,
			hasControls: false,
		});

		canvas.add(group);

		const bounds = group.getBoundingRect();
		const zoomX = canvas.getWidth() / bounds.width;
		const zoomY = canvas.getHeight() / bounds.height;
		const zoom = Math.min(zoomX, zoomY) * zoomLevel; // Zoomed out further

		const dx = canvas.getWidth() / 2 - (group.left! + group.width! / 2) * zoom;
		const dy = canvas.getHeight() / 2 - (group.top! + group.height! / 2) * zoom;

		canvas.setZoom(zoom);
		canvas.setViewportTransform([zoom, 0, 0, zoom, dx, dy]);
		canvas.renderAll();
	}

	function applyZoom() {
	if (!group) return;
	const bounds = group.getBoundingRect();
	const dx = canvas.getWidth() / 2 - (group.left! + group.width! / 2) * zoomLevel;
	const dy = canvas.getHeight() / 2 - (group.top! + group.height! / 2) * zoomLevel;
	canvas.setZoom(zoomLevel);
	canvas.setViewportTransform([zoomLevel, 0, 0, zoomLevel, dx, dy]);
	canvas.renderAll();
}

function zoomIn() {
	zoomLevel = Math.min(5, zoomLevel + 0.1);
	applyZoom();
}

function zoomOut() {
	zoomLevel = Math.max(0.1, zoomLevel - 0.1);
	applyZoom();
}

	onMount(async () => {
		const { data: test, error: testError } = await supabase
			.from("tests")
			.select("bounding_boxes")
			.eq("test_id", test_id)
			.single();
		if (testError) return console.error(testError);
		boundingBoxes = calculateDimensions(test.bounding_boxes);

		const { data: scans, error: scanError } = await supabase
			.from("scans")
			.select("scan_path, page_number")
			.eq("test_id", test_id)
			.order("page_number");
		if (scanError) return console.error(scanError);

		scanImages = scans.map((s) => ({
			url: supabase.storage.from("scans").getPublicUrl(s.scan_path).data.publicUrl,
			page_number: s.page_number,
		}));

		const canvasEl = document.getElementById("canvas") as HTMLCanvasElement;
		canvas = new Canvas(canvasEl);

		await loadPage(currentPage);
	});

	function nextPage() {
		if (currentPage < scanImages.length - 1) {
			currentPage++;
			inputPage = currentPage + 1;
			loadPage(currentPage);
		}
	}

	function prevPage() {
		if (currentPage > 0) {
			currentPage--;
			inputPage = currentPage + 1;
			loadPage(currentPage);
		}
	}

	function jumpToPage() {
		const target = inputPage - 1;
		if (target >= 0 && target < scanImages.length) {
			currentPage = target;
			loadPage(currentPage);
		}
	}
</script>

<div class="picture">
	<div class="input-bar">
		<label>Jump to page:</label>
		<input on:keydown={(e) => {
			if (e.key === "Enter") {
				jumpToPage();
			}
		}} type="number" bind:value={inputPage} min="1" max={scanImages.length} />
		<button on:click={jumpToPage}>Go</button>
	</div>

	<div id="canvas-container" class="canvas-scroll">
		<canvas id="canvas" />
	</div>

	<div class="pagination-controls">
		<button on:click={prevPage} disabled={currentPage === 0}>&larr; Prev</button>
		<span>Page {currentPage + 1} of {scanImages.length}</span>
		<button on:click={nextPage} disabled={currentPage === scanImages.length - 1}>Next &rarr;</button>
	</div>
	<div class="zoom-controls">
		<button on:click={zoomOut}>-</button>
		<input
			type="number"
			min="0.1"
			step="0.1"
			bind:value={zoomLevel}
			on:change={applyZoom}
		/>
		<button on:click={zoomIn}>+</button>
	</div>
</div>

<style>
	#canvas-container {
		position: relative;
		width: 100%;
		text-align: center;
	}

	.canvas-scroll {
	overflow-x: auto;
	overflow-y: hidden;
	width: 100%;
}
.zoom-controls {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 10px;
	margin-top: 1rem;
}

.zoom-controls input {
	width: 60px;
	text-align: center;
	padding: 4px;
}
	#canvas {
		border: 1px solid #ccc;
		position: relative;
		max-width: 100%;
	}

	.picture {
		background-color: var(--primary-tint, #f9f9f9);
		max-width: 1000px;
		width: auto;
		padding: 10px;
		border: 3px solid #aaa;
		border-radius: 10px;
		margin: auto;
		overflow: hidden;
	}

	.input-bar {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		margin-bottom: 1rem;
	}

	.input-bar input {
		width: 60px;
		padding: 4px;
		font-size: 1rem;
	}

	.pagination-controls {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin-top: 1rem;
	}

	.pagination-controls button {
		padding: 6px 12px;
		font-size: 1rem;
	}
</style>
