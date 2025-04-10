<script lang="ts">
	import { onMount } from "svelte";
	import * as fabric from "fabric";
	import { rearrangeItems } from "$lib/sort_dictionary";
	import { supabase } from "$lib/supabaseClient";

	const cellSize = 30;
	const strokeWidth = 6;
	const backgroundColor = "#e1fff3";
	let canvasWidth = 0;
	let canvasHeight = 0;
	let canv;
	//smthn
	let setLineStyle = "-";
	let setSurfaceStyle = "";
	let lineDragType = true; //true = line, false = surface

	let canvas;

	let {
		puzzle = $bindable(),
		is_puzzle = false,
		relation_id,
		team_id,
		lastUpdated = "",
		onChange = async (ind, new_state) => {
			console.log(ind, new_state);
		},
		opacity=100,
		editable=true
	} = $props();

	let styles = {
		x: {
			stroke: "lightgrey",
			strokeDashArray: [5, 5],
		},
		"+": {
			stroke: "green",
			strokeDashArray: "",
		},
		"=": {
			stroke: "black",
			strokeDashArray: "",
		},
		"-": {
			stroke: "grey",
			strokeDashArray: [5, 5],
		},
	};

	function creatingLine(strokeColor, strokeDashArray, item) {
		const halfPixel = 0; // Define half a pixel
		const startX = item.loc[0][0] * cellSize + cellSize / 2;
		const startY = item.loc[0][1] * cellSize + cellSize / 2;
		const endX = item.loc[1][0] * cellSize + cellSize / 2;
		const endY = item.loc[1][1] * cellSize + cellSize / 2;

		// Calculate the midpoint of the line
		const midX = (startX + endX) / 2;
		const midY = (startY + endY) / 2;

		// Adjust the midpoint by half a pixel
		const adjustedMidX = midX + (midX > startX ? halfPixel : -halfPixel);
		const adjustedMidY = midY + (midY > startY ? halfPixel : -halfPixel);

		// Calculate adjusted coordinates for the endpoints
		const adjustedStartX = adjustedMidX + (adjustedMidX - startX);
		const adjustedStartY = adjustedMidY + (adjustedMidY - startY);
		const adjustedEndX = adjustedMidX + (adjustedMidX - endX);
		const adjustedEndY = adjustedMidY + (adjustedMidY - endY);

		var dx = adjustedEndX - adjustedStartX;
		var dy = adjustedEndY - adjustedStartY;
		var angle = Math.atan2(dy, dx) * (180 / Math.PI);

		// Calculate the length of the line
		var length = Math.sqrt(dx * dx + dy * dy);

		const line = new fabric.Line(
			[
				adjustedMidX - length / 2,
				adjustedMidY,
				adjustedMidX + length / 2,
				adjustedMidY,
			],
			{
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				padding: 6,
				strokeDashArray: strokeDashArray,
				selectable: false,
				angle: angle,
				originX: "center",
				originY: "center",
				hoverCursor: "pointer",
			}
		);

		return line;
	}

	function creatingCrossedLines(item) {
		const size = 5;
		const offset = -0.5;
		const coordinatex = cellSize * ((item.loc[0][0] + item.loc[1][0] + 1) / 2);
		const coordinatey = cellSize * ((item.loc[0][1] + item.loc[1][1] + 1) / 2);

		const diagonalLine1 = new fabric.Line(
			[
				coordinatex - size + offset,
				coordinatey - size + offset,
				coordinatex + size + offset,
				coordinatey + size + offset,
			],
			{
				stroke: "red",
				strokeWidth: 2,
				selectable: false,
			}
		);

		// Create diagonal line from top-right to bottom-left
		const diagonalLine2 = new fabric.Line(
			[
				coordinatex + size + offset,
				coordinatey - size + offset,
				coordinatex - size + offset,
				coordinatey + size + offset,
			],
			{
				stroke: "red",
				strokeWidth: 2,
				selectable: false,
			}
		);

		return [diagonalLine1, diagonalLine2];
	}

	function renderCanvas() {
		canvas.clear(); // Clear the canvas before re-rendering

		puzzle.forEach((item, i) => {
			if (item.type === "edge") {
				let line = creatingLine("grey", [5, 5], item);
				let [crossLine1, crossLine2] = creatingCrossedLines(item);

				line.set({
					stroke: styles[item.state].stroke,
					strokeDashArray: styles[item.state].strokeDashArray,
				});

				canvas.add(line);

				if (item.state === "x") {
					canvas.add(crossLine1);
					canvas.add(crossLine2);
				}

				if (editable) {
					// Add click event listener to each line
					line.on("mousedown", async function (options) {
						canvas.remove(crossLine1);
						canvas.remove(crossLine2);

						if (options.e.buttons === 1) {
							// Left-click
							if (item.state === "+") {
								item.state = "-";
								await onChange(i, "-");
							} else if (item.state !== "=") {
								item.state = "+";
								await onChange(i, "+");
							}

							line.set({
								stroke: styles[item.state].stroke,
								strokeDashArray: styles[item.state].strokeDashArray,
							});

							setLineStyle = item.state;
							lineDragType = true;
							canvas.renderAll();
						} else if (options.e.buttons === 2) {
							// Right-click
							if (item.state === "x") {
								item.state = "-";
								await onChange(i, "-");
							} else if (item.state !== "=") {
								item.state = "x";
								canvas.add(crossLine1);
								canvas.add(crossLine2);
								await onChange(i, "x");
							}

							line.set({
								stroke: styles[item.state].stroke,
								strokeDashArray: styles[item.state].strokeDashArray,
							});

							setLineStyle = item.state;
							lineDragType = true;
							canvas.renderAll();
						}
					});

					crossLine1.on("mousedown", async function (options) {
						if (item.state === "x") {
							if (options.e.buttons === 2) {
								item.state = "-";
								canvas.remove(crossLine1);
								canvas.remove(crossLine2);
								await onChange(i, "-");
							} else if (options.e.buttons === 1) {
								item.state = "+";
								canvas.remove(crossLine1);
								canvas.remove(crossLine2);
								await onChange(i, "+");
							}

							line.set({
								stroke: styles[item.state].stroke,
								strokeDashArray: styles[item.state].strokeDashArray,
							});

							canvas.renderAll();
							setLineStyle = item.state;
							lineDragType = true;
						}
					});

					crossLine2.on("mousedown", async function (options) {
						if (item.state === "x") {
							if (options.e.buttons === 2) {
								item.state = "-";
								canvas.remove(crossLine1);
								canvas.remove(crossLine2);
								await onChange(i, "-");
							} else if (options.e.buttons === 1) {
								item.state = "+";
								canvas.remove(crossLine1);
								canvas.remove(crossLine2);
								await onChange(i, "+");
							}

							line.set({
								stroke: styles[item.state].stroke,
								strokeDashArray: styles[item.state].strokeDashArray,
							});

							canvas.renderAll();
							setLineStyle = item.state;
							lineDragType = true;
						}
					});
				}

				/*
				canvas.on("mouse:move", async (event) => {
					const pointer = canvas.getPointer(event.e);
					const x = pointer.x;
					const y = pointer.y;

					// Check if the mouse is pressed down
					if (event.e.buttons === 1 || event.e.buttons === 2) {
						// Check if the cursor is hovering over the rectangle
						if (
							line.containsPoint({ x, y }) &&
							lineDragType &&
							item.state != setLineStyle
						) {
							canvas.remove(crossLine1);
							canvas.remove(crossLine2);

							line.set({
								stroke: styles[setLineStyle].stroke,
								strokeDashArray: styles[setLineStyle].strokeDashArray,
							});

							if (setLineStyle === "x") {
								canvas.add(crossLine1);
								canvas.add(crossLine2);
							}

							item.state = setLineStyle;
							await onChange(i, setLineStyle);

							canvas.renderAll();
						}
					}
				});
				*/
			} else if (item.type === "surface") {
				// Convert points to Fabric.js format
				var fabricPoints = item.loc.map(function (point) {
					return {
						x: point[0] * cellSize + cellSize / 2,
						y: point[1] * cellSize + cellSize / 2,
					};
				});

				if (item.state == "") {
					item.state = backgroundColor; //white
				}

				var polygon = new fabric.Polygon(fabricPoints, {
					fill: item.state,
					selectable: false,
					lockScalingX: true,
					lockScalingY: true,
					hasControls: false,
					hasBorders: false,
					hoverCursor: "cell",
					paintFirst: "fill",
					perPixelTargetFind: true,
				});

				//canvas.sendToBack(polygon);
				canvas.add(polygon);

				if (editable) {
					polygon.on("mousedown", async function (options) {
						canvas.discardActiveObject();

						if (options.e.buttons === 1) {
							// Left-click
							if (item.state === "#bad6ff") {
								//blue
								item.state = backgroundColor;
								polygon.set({ fill: item.state });
								await onChange(i, item.state);
							} else {
								item.state = "#bad6ff";
								polygon.set({ fill: item.state });
								await onChange(i, item.state);
							}

							canvas.sendToBack(polygon);
							canvas.renderAll();
						} else if (options.e.buttons === 2) {
							// Right-click
							if (item.state === "#fff1ba") {
								//yellow
								item.state = backgroundColor;
								polygon.set({ fill: item.state });
								await onChange(i, item.state);
							} else {
								item.state = "#fff1ba";
								polygon.set({ fill: item.state });
								await onChange(i, item.state);
							}

							canvas.renderAll();
						}

						setSurfaceStyle = item.state;
						lineDragType = false;
					});
				}
				/*
				canvas.on("mouse:move", async (event) => {
					const pointer = canvas.getPointer(event.e);
					const x = pointer.x;
					const y = pointer.y;

					// Check if the mouse is pressed down
					if (event.e.buttons === 1 || event.e.buttons === 2) {
						// Check if the cursor is hovering over the rectangle
						if (
							polygon.containsPoint({ x, y }) &&
							!lineDragType &&
							item.state != setSurfaceStyle
						) {
							polygon.set({ fill: setSurfaceStyle });
							item.state = setSurfaceStyle;
							await onChange(i, setSurfaceStyle);
							canvas.renderAll();
						}
					}
				});
				*/
			} else if (item.type === "text") {
				const text = new fabric.Text(item.state, {
					left: item.loc[0][0] * cellSize + cellSize / 2,
					top: item.loc[0][1] * cellSize + cellSize / 2,
					fontSize: 28,
					fontFamily: "Helvetica",
					selectable: false,
					evented: false,
					originX: "center", // Center horizontally
					originY: "center", // Center vertically
					perPixelTargetFind: true,
				});

				//canvas.sendToBack(text);

				// Adjust text position to center it within the square
				text.set({
					left: item.loc[0][0] * cellSize + cellSize / 2,
					top: item.loc[0][1] * cellSize + cellSize / 2 + 2,
				});

				canvas.add(text);
			} else if (item.type === "point") {
				if (item.state == "true") {
					const radius = 4;
					const circle = new fabric.Circle({
						radius: radius,
						fill: "black",
						left: item.loc[0][0] * cellSize + cellSize / 2 - radius,
						top: item.loc[0][1] * cellSize + cellSize / 2 - radius,
						selectable: false,
					});

					canvas.add(circle);
				}
			}
		});
	}

	if (is_puzzle) {
		const puzzleProgress = supabase.channel("puzzles");
		puzzleProgress
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "puzzle_progress", filter: `team_id=eq.${team_id}` },
				async (payload) => {
					if (payload.new.relation_id === relation_id) {
						if (payload.new.solved)
							window.location.replace("/puzzle/" + relation_id);
						else if (
							new Date(payload.new.last_updated).toLocaleString() !==
							lastUpdated.toLocaleString()
						)
							window.location.replace("/puzzle/" + relation_id);
						else {
							puzzle = payload.new.progress;
							renderCanvas();
						}
					}
				}
			)
			.on("broadcast", { event: "tournament_end" }, () => {
				window.location.replace("/");
			})
			.subscribe();
	}

	onMount(() => {
		// Calculate the canvas size based on the puzzle dimensions
		puzzle.forEach((item) => {
			canvasWidth = Math.max(
				canvasWidth,
				(parseInt(item.loc[0][0]) + 1) * cellSize + 25
			);
			canvasHeight = Math.max(
				canvasHeight,
				(parseInt(item.loc[0][1]) + 1) * cellSize + 25
			);
		});

		canvas = new fabric.Canvas(canv, {
			width: canvasWidth,
			height: canvasHeight,
			selection: false,
			fireRightClick: true,
			stopContextMenu: true,
		});

		renderCanvas();
	});
</script>

<div class="border" style="opacity: {opacity}%">
	<canvas bind:this={canv} id="canvas" />
</div>

<style>
	.border {
		padding: 5px;
		margin: 5px;
		border: 2px dotted black;
		display: inline-block;
		height: fit-content;
		width: fit-content;
	}

	#canvas {
		width: 100%;
		height: 100%;
	}
</style>