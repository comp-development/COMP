<script lang="ts">
	import { displayLatex } from "$lib/latexStuff";
	import Button from "$lib/components/Button.svelte";
	import ImageZoomer from "$lib/components/ImageZoomer.svelte";
	import { handleError } from "$lib/handleError";
	import Loading from "$lib/components/Loading.svelte";

	import {
		fetchNewProblem,
		fetchNewScans,
		submitGrade,
		undoGrade,
	} from "$lib/supabase";
	import { Modal } from "flowbite-svelte";
	import { user } from "$lib/sessionStore";
	import {
		supabase,
		type AsyncReturnType,
		type Unpacked,
	} from "$lib/supabaseClient";
	import type { Tables } from "../../../db/database.types";
	import { FabricImage } from "fabric";

	export let showGrades = false;
	export let onlyConflicted = false;
	export let disableUnsure = false;
	export let event_id: number;
	export let testId: number;

	// TODO: handle conflict grading
	// TODO: delete the tiebreaks test_problem associations in prod DB and communicate it needs to stay that way

	type Action = "Correct" | "Incorrect" | "Unsure" | "Undo";

	let test_data: null | Tables<"tests"> = null;
	let problem_data: Map<
		number,
		AsyncReturnType<typeof fetchNewProblem> & { answer_display: any }
	> = new Map();
	let loaded = false;
	let switchingProblems = false;
	let fetching_problems = false;
	let currentProblemID: number | null = null;

	let gradeQueue: (Unpacked<AsyncReturnType<typeof fetchNewScans>> & {
		image: FabricImage;
		grade_id: number | null;
		grades: (string | null)[] | null;
	})[] = [];
	let loaded_scans = new Set();
	let currentIndex = 0;
	let no_remaining_problems = false;

	async function fetchNextProblem(): Promise<number | null> {
		const load_conflicted = async () => {
			const { data: scan_data, error: scan_error } = await supabase
				.rpc("get_test_problem_scans_state", {
					in_test_id: testId,
					target_grader: $user!.id,
				})
		    .filter("overriden", "is", false)
				.or("unsure_grades.gt.0, distinct_grades.gt.1")
				.limit(1);
			if (scan_error) throw scan_error;
			if (scan_data.length == 0) {
				return null;
			}
			const { data: problem_data, error } = await supabase
				.from("test_problems")
				.select(
					"problems(problem_latex, answer_latex, solution_latex), problem_number",
				)
				.eq("test_problem_id", scan_data[0].test_problem_id)
				.single();
			if (error) throw error;
			return {
				test_problem_id: scan_data[0].test_problem_id,
				problem_number: problem_data.problem_number,
				...problem_data.problems,
			};
		};

		const new_problem = onlyConflicted
			? await load_conflicted()
			: await fetchNewProblem($user!.id, testId);
		if (!new_problem) {
			return null;
		}

		const html_latex = (await displayLatex(new_problem.answer_latex ?? "", []))
			.out;
		problem_data.set(new_problem.test_problem_id, {
			answer_display: html_latex,
			...new_problem,
		});

		return new_problem.test_problem_id;
	}

	async function fetchMoreScans(num_scans = 10) {
		if (no_remaining_problems || fetching_problems) {
			return;
		}
		fetching_problems = true;
		loaded = false;

		if (!currentProblemID) {
			const maybe_id = await fetchNextProblem();
			console.log("maybe id", maybe_id);
			if (!maybe_id) {
				no_remaining_problems = true;
				fetching_problems = false;
				loaded = true;
				return;
			}
			switchingProblems = true;
			currentProblemID = maybe_id;
		}

		const scans = await fetchNewScans(
			$user!.id,
			num_scans,
			testId,
			currentProblemID,
			gradeQueue.slice(currentIndex).map((p) => p.scan_id),
			onlyConflicted,
		);

		// If we run out of scans, fetch another problem.
		if (scans.length == 0 && currentIndex == gradeQueue.length) {
			console.log("out of problems");
			currentProblemID = null;
			fetching_problems = false;
			await fetchMoreScans(num_scans);
			return;
		}

		if (scans.length > 0) {
			gradeQueue = gradeQueue.concat(
				await Promise.all(
					scans.map(async (s) => ({
						...s,
						image: await FabricImage.fromURL(
							supabase.storage.from("scans").getPublicUrl(s.scan_path).data
								.publicUrl,
						),
						grade_id: null,
						grades: showGrades
							? ((
									await supabase
										.from("scan_grades")
										.select("grade")
										.eq("test_problem_id", s.test_problem_id)
										.eq("scan_id", s.scan_id)
								).data?.map((g) => g.grade) ?? [])
							: [],
					})),
				),
			);
		}

		fetching_problems = false;
		loaded = true;
	}

	$: (async () => {
		// TODO: @tweoss. Check if this is valid (handleAction might assume index is just 1 less)
		if (gradeQueue.length - currentIndex < 5) {
			console.log(
				`Fetching more problems... because length is at ${gradeQueue.length} and currentIndex is at ${currentIndex}`,
			);
			await fetchMoreScans();
		}
	})();

	(async () => {
		const { data, error } = await supabase
			.from("tests")
			.select("*")
			.eq("test_id", testId)
			.single();
		if (error) handleError(error);

		test_data = data;
		loaded = true;
	})();

	function calculateDimensions(problem_number: number) {
		const bounding_boxes = test_data!.bounding_boxes as any;
		console.log(bounding_boxes, problem_number, gradeQueue, problem_data);
		// let boxIndex = Math.min(problem_number, bounding_boxes.box_positions.length - 1);
		const bounding_box = bounding_boxes[problem_number - 1];

		// Parse input object
		const topLeftX = parseFloat(bounding_box.top_left[0]);
		const topLeftY = parseFloat(bounding_box.top_left[1]);
		const bottomRightX = parseFloat(bounding_box.bottom_right[0]);
		const bottomRightY = parseFloat(bounding_box.bottom_right[1]);

		// Calculate dimensions
		const left = topLeftX;
		const top = topLeftY;
		const width = bottomRightX - topLeftX;
		const height = bottomRightY - topLeftY;

		// Return result
		return {
			left,
			top,
			width,
			height,
		};
	}

	// Handle swipe actions
	async function handleAction(action: Action) {
		if (switchingProblems || gradeQueue.length <= currentIndex) {
			return;
		}

		// Get the reference to the body element
		const bodyElement = document.querySelector("main")!;

		// Define the durations for transition into flash color and back to original color (in milliseconds)
		const flashInDuration = 100; // 0.2 seconds
		const flashOutDuration = 1000; // 1 second

		if (
			(["Correct", "Incorrect", "Unsure"] satisfies Action[]).find(
				(a) => a == action,
			) != null
		) {
			const data = await submitGrade(
				$user!.id,
				{
					scan_id: gradeQueue[currentIndex].scan_id,
					test_problem_id: gradeQueue[currentIndex].test_problem_id,
					grade: action as "Correct" | "Incorrect" | "Unsure",
				},
				onlyConflicted,
			);
			gradeQueue[currentIndex].grade_id = data.grade_id;
		}

		if (action == "Undo") {
			await undoGrade(
				gradeQueue[currentIndex - 1 >= 0 ? currentIndex - 1 : 0].grade_id!,
			);
		}

		// Change the background color of the entire page to the color with fast transition
		bodyElement.style.transition = `background-color ${
			flashInDuration / 1000
		}s ease-in-out`;
		let color = "";
		if (action == "Correct") color = "#9BFF99";
		if (action == "Incorrect") color = "#FF9999";
		if (action == "Unsure") color = "#FFFB99";
		if (action == "Undo") color = "#999999";
		bodyElement.style.backgroundColor = color;

		// Revert the background color to original with slower transition after the specified duration
		setTimeout(() => {
			bodyElement.style.transition = `background-color ${
				flashOutDuration / 1000
			}s ease-in-out`;
			bodyElement.style.backgroundColor = ""; // Revert to original color
		}, flashInDuration);

		// Move to the next card
		if (action == "Undo") {
			if (currentIndex > 0) {
				currentIndex -= 1;
			}
		} else {
			currentIndex += 1;
		}
	}

	async function handleKey(e: KeyboardEvent) {
		// Check if the pressed key is 'X'
		if (e.key === "x" || e.key === "X") {
			await handleAction("Incorrect");
		} else if (e.key === "z" || e.key === "Z") {
			await handleAction("Undo");
		} else if ((e.key === "c" || e.key === "C") && !disableUnsure) {
			await handleAction("Unsure");
		} else if (e.key === "v" || e.key === "V") {
			await handleAction("Correct");
		}
	}

	function count_occurences(array: (string | null)[], grade: string) {
		return array.reduce((a, e) => a + (e == grade ? 1 : 0), 0);
	}
</script>

<svelte:window on:keydown={handleKey} />

<div class="grading">
	<h1>Grading {test_data?.test_name}</h1>

	<br />
	<Button title="Go Back" href="/admin/2/{event_id}/grading" />
	<br /><br />
	{#if !gradeQueue[currentIndex] && !loaded}
		<Loading />
	{:else}
		<div class="card">
			{#if gradeQueue[currentIndex]}
				<div class="flex">
					<div class="sideBySide">
						<p style="margin-left: 20px">
							Problem #{problem_data.get(
								gradeQueue[currentIndex].test_problem_id,
							)!.problem_number}
						</p>
					</div>
				</div>
				<br />
				<h2>
					{@html problem_data.get(gradeQueue[currentIndex].test_problem_id)!
						.answer_display}
				</h2>
				{console.log(
					"Debug - gradeQueue:",
					gradeQueue,
					"currentIndex:",
					currentIndex,
				)}
				<ImageZoomer
					image={gradeQueue[currentIndex].image}
					inputCoordinates={calculateDimensions(
						problem_data.get(gradeQueue[currentIndex].test_problem_id)!
							.problem_number,
					)}
				/>
				<br />
				<div class="flex">
					<button
						style="background-color: #999999; color: #282828;"
						on:click={async () => handleAction("Undo")}>↩ (Z)</button
					>
					<button
						style="background-color: #ff9999; color: #AD2828;"
						on:click={async () => handleAction("Incorrect")}>X (X)</button
					>
					{#if !disableUnsure}
						<button
							style="background-color: #FFFB99; color: #7C7215;"
							on:click={async () => handleAction("Unsure")}>? (C)</button
						>
					{/if}
					<button
						style="background-color: #9BFF99; color: #157C20;"
						on:click={async () => handleAction("Correct")}>✔ (V)</button
					>
				</div>
				{#if showGrades}
					<div class="flex">
						<button disabled style="background-color: #FFFB99; color: #7C7215;">
							{count_occurences(
								gradeQueue[currentIndex].grades ?? [],
								"Unsure",
							)}
						</button>
						<button disabled style="background-color: #ff9999; color: #AD2828;">
							{count_occurences(
								gradeQueue[currentIndex].grades ?? [],
								"Incorrect",
							)}
						</button>
						<button disabled style="background-color: #9BFF99; color: #157C20;">
							{count_occurences(
								gradeQueue[currentIndex].grades ?? [],
								"Correct",
							)}
						</button>
					</div>
				{/if}
				<br />
			{:else}
				<p>No more problems - check back later!</p>
				<!-- in case someone messed up on the last grade and wants to go back and fix -->
				{#if currentIndex > 0}
					<button
						style="font-size: 10pt; background-color: #FFFB99;"
						on:click={() => {
							currentIndex = currentIndex > 0 ? currentIndex - 1 : 0;
						}}>Go Back to UNDO</button
					>
					<br />
				{/if}
			{/if}
			Number of problems remaining in local queue: {gradeQueue.length -
				currentIndex}
		</div>
	{/if}

	<!--
	primaryButtonText="Confirm (space, enter)"
		on:open
		on:close
		on:submit={() => {
			switchingProblems = false;
		}}
	-->
	<Modal
		bind:open={switchingProblems}
		title={gradeQueue.at(currentIndex)
			? `Switching to Problem ${problem_data.get(gradeQueue.at(currentIndex)!.test_problem_id)!.problem_number}`
			: "Searching for new problem"}
	>
		New Answer: {@html gradeQueue[currentIndex]
			? problem_data.get(gradeQueue[currentIndex].test_problem_id)!
					.answer_display
			: "<div></div>"}
	</Modal>
</div>

<style>
	h1 {
		margin-bottom: 5px;
	}

	.sideBySide {
		display: flex;
	}

	.grading {
	}

	.card {
		width: fit-content;
		position: relative;
		border-radius: 8px;
		margin-left: auto;
		margin-right: auto;
	}

	/* Add this media query
	@media (max-width: 600px) {
		.card {
			width: 95%; 
		}

		.grading {
			max-height: 200vh; 
			overflow: auto; 
		}
	} */

	button {
		width: 90px;
		height: 40px;
		border: 2px solid black;
		margin: 10px;
		font-size: 22px;
		border-radius: 10px;
		font-weight: bold;
	}

	button:hover {
		cursor: pointer;
	}
</style>
