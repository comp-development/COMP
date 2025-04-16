<script lang="ts">
	import { Canvas, FabricImage, Group, Point, Rect } from "fabric";

	import { onMount, afterUpdate } from "svelte";

	export let image: FabricImage;
	export let inputCoordinates: {
		left: number;
		top: number;
		width: number;
		height: number;
	};

	export let mod: number = 0;


	let canvas: Canvas | null = null;
	let focusRect;
	let group: Group | null = null;
	let rectCoordinates: typeof inputCoordinates;
	let ogPosition: { left: number; top: number };

	async function initializeCanvas() {
		if (canvas) {
			canvas.clear(); // Clear canvas if it already exists
		}
		const aspectRatio = inputCoordinates.width / inputCoordinates.height;
		const canvasContainer = document.getElementById(mod > 0 ? "canvas-container-2" : "canvas-container")!;
		canvasContainer.style.width = `${
			canvasContainer.offsetHeight * aspectRatio
		}px`;

		// Initialize Fabric canvas
		canvas = new Canvas((mod > 0 ? "canvas-2" : "canvas"), {
			width: canvasContainer.offsetWidth,
			height: canvasContainer.offsetHeight,
			selectable: false,
		});
		await update();
	}

	onMount(initializeCanvas); // Initialize canvas on mount

	async function update() {
		// Load image onto canvas
		rectCoordinates = {
			left: ((inputCoordinates.left / 612) * image.width) - (mod == 2 ? 450 :(mod == 1? 150  : 0)),
			top: (inputCoordinates.top / 792) * image.height,
			width: (inputCoordinates.width / 612 * (mod > 0 ? 0.5 : 1)) * image.width,
			height: (inputCoordinates.height / 792) * image.height,
		};
		image.set({ selectable: false });

		// Set initial crop rectangle
		focusRect = new Rect({
			left: rectCoordinates.left,
			top: rectCoordinates.top,
			width: rectCoordinates.width,
			height: rectCoordinates.height,
			fill: "transparent",
			stroke: "red",
			strokeWidth: 2,
			selectable: true, // Prevent selection of the rectangle
		});

		if (group) {
			canvas!.remove(group);
		}

		group = new Group([image, focusRect], {
			selectable: true, // Allow selection
			hasControls: false, // Hide controls
			lockMovementX: false, // Allow horizontal movement
			lockMovementY: false, // Allow vertical movement
		});
		canvas!.add(group);
		ogPosition = { left: group.left, top: group.top };
		reZoom();
		await zoomOut();
		await zoomOut();
	}

	afterUpdate(update);

	function reset() {
		reZoom();
		recenterCanvas();
	}

	function reZoom() {
		if (group) {
			canvas!.setViewportTransform([
				1,
				0,
				0,
				1,
				-rectCoordinates.left + canvas!.width / 2 - rectCoordinates.width / 2,
				-rectCoordinates.top + canvas!.height / 2 - rectCoordinates.height / 2,
			]);
			zoomOut();
			canvas!.renderAll();
		}
	}

	function zoomIn() {
		if (group) {
			canvas!.zoomToPoint(
				new Point(canvas!.width / 2, canvas!.height / 2),
				canvas!.getZoom() * 1.2,
			);
		}
	}

	function zoomOut() {
		if (group) {
			canvas!.zoomToPoint(
				new Point(canvas!.width / 2, canvas!.height / 2),
				canvas!.getZoom() / 1.2,
			);
		}
	}

	function recenterCanvas() {
		if (group) {
			group.set({
				left: ogPosition.left,
				top: ogPosition.top,
			});
			canvas!.renderAll();
		}
	}
</script>

<div class="picture">
	{#if mod > 0}
	<div id="canvas-container-2" class="centered">
		<canvas id="canvas-2" />
		<div class="zoom-controls">
			<button on:click={zoomIn} class="icon-button">
				<i class="ri-zoom-in-fill" style="font-size: 30px;" />
			</button>
			<button on:click={zoomOut} class="icon-button">
				<i class="ri-zoom-out-fill ri-lg" style="font-size: 30px;" />
			</button>
			<button on:click={reset} class="icon-button">
				<i class="ri-find-replace-fill ri-lg" style="font-size: 30px;" />
			</button>
		</div>
	</div>
	{:else}
	<div id="canvas-container" class="centered">
		<canvas id="canvas" />
		<div class="zoom-controls">
			<button on:click={zoomIn} class="icon-button">
				<i class="ri-zoom-in-fill" style="font-size: 30px;" />
			</button>
			<button on:click={zoomOut} class="icon-button">
				<i class="ri-zoom-out-fill ri-lg" style="font-size: 30px;" />
			</button>
			<button on:click={reset} class="icon-button">
				<i class="ri-find-replace-fill ri-lg" style="font-size: 30px;" />
			</button>
		</div>
	</div>
	{/if}
</div>

<style>
	#canvas-container {
		position: relative;
		width: 100%;
		text-align: center;
	}
	#canvas-container-2 {
		position: relative;
		width: 100%;
		text-align: center;
	}

	#canvas {
		border: 1px solid #ccc;
		position: relative;
	}

	#canvas-2 {
		border: 1px solid #ccc;
		position: relative;
	}

	.zoom-controls {
		position: absolute;
		top: 50%;
		right: 0px;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.icon-button {
		margin: 5px;
		padding: 5px;
		margin-right: 0;
		font-size: 20px;
		background: none;
		border: none;
		cursor: pointer;
	}

	.picture {
		background-color: var(--primary-tint);
		max-width: 800px;
		max-height: 600px;
		width: auto;
		height: auto;
		padding: 10px;
		border: 5px solid var(--primary-dark);
		border-radius: 15px;
		margin: auto;
		overflow: hidden;
	}

	.icon-button i {
		color: var(--secondary-dark);
	}
</style>
