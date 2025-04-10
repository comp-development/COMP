<script lang="ts">
  import { page } from "$app/stores";
  import toast from "$lib/toast.svelte";
  import { TextArea, TextInput } from "carbon-components-svelte";
  import MathJax from "$lib/components/MathJax.svelte";
  import Button from "$lib/components/Button.svelte";
  import { handleError } from "$lib/handleError";
  import {
    getThisUser,
    getTest,
    updateTest,
    getTestProblems,
    updateTestProblems,
    getAllProblems,
    addNewTestProblem,
    deleteTestProblem,
    replaceTestProblem,
    getAllProblemClarifications,
    updateProblemClarifications,
    updateTestProblem,
    updateClarification,
    getAllPuzzles,
    insertPuzzle,
    updateTestPuzzle,
    replaceTestPuzzle,
  } from "$lib/supabase";
  import Problem from "$lib/components/Problem.svelte";
  import SelectProblem from "$lib/components/SelectProblem.svelte";
  import CreateProblemModal from "$lib/components/CreateProblemModal.svelte";
  import CustomForm from "$lib/components/CustomForm.svelte";
  import { Modal } from "flowbite-svelte";
  import Puzzle from "$lib/components/Puzzle.svelte";
  import ConfirmationModal from "$lib/components/ConfirmationModal.svelte";
  import EditPuzzle from "$lib/components/EditPuzzle.svelte";

  // Define interfaces for our data structures
  interface TestProblem {
    test_problem_id: number;
    problem_id: number;
    test_id: number;
    page_number: number;
    problem_number: number;
    points: number;
    name: string;
    problems: {
      problem_id: number;
      problem_latex: string;
      answer_latex: string;
    };
    edits?: boolean;
  }

  interface Test {
    test_id: number;
    test_name: string;
    length: number;
    buffer_time: number;
    instructions: string;
    division?: string;
    settings: {
      pages: string[];
    };
    [key: string]: any; // Allow string indexing for dynamic properties
  }

  interface Clarification {
    test_problem_id: number;
    clarification_latex: string | null;
  }

  let loading = $state(true);

  let instructionsEditable = false;

  let modalProblem: number | null = $state(null);
  let curPage: number | null = $state(null);
  let openAddProblemModal: boolean = $state(false);
  let newProblemModal: boolean = $state(false);

  let host_id = Number($page.params.host_id);
  let test_id = Number($page.params.test_id);
  let is_team = $page.params.test_id.charAt(0) == "t" ? true : false;

  let user: any;
  let test = $state<Test | undefined>();
  let problems = $state<TestProblem[]>([]);
  let test_taker: any;
  let clarifications = $state<Record<number, Clarification>>({});
  let allProblems: any[] = $state([]);

  let showDeleteModal = $state(false);
  let fieldToDelete: number | null = $state(null);
  let showDeletePageModal = $state(false);
  let pageToDelete: number | null = $state(null);

  let typeProblem = $state("problem");

  let createModal = $state(false);
  let newResponses = $state({
    puzzle: "",
    solution: "",
  });

  (async () => {
    user = await getThisUser();
    test = await getTest(test_id);
    await getNewValues();
    clarifications = await getAllProblemClarifications(problems);
    loading = false;
  })();

  async function getNewValues() {
    if (test.test_mode == "Puzzle") {
      problems = (await getTestProblems(test_id, null, "*, puzzles(*)")) || [];
      allProblems = await getAllPuzzles(host_id);
      allProblems.forEach((problem) => {
        problem.id = problem.puzzle_id;
      });
      typeProblem = "Puzzle";
    } else {
      problems = (await getTestProblems(test_id, null, "*, problems(*)")) || [];
      allProblems = await getAllProblems(host_id);
      allProblems.forEach((problem) => {
        problem.id = problem.problem_id;
      });
    }
  }

  function confirmDelete(index: number) {
    fieldToDelete = index;
    showDeleteModal = true;
  }

  type PuzzleElement =
    | { loc: number[][]; type: "point"; state: "true" }
    | { loc: number[][]; type: "edge"; state: "-" }
    | { loc: number[][]; type: "surface"; state: string }
    | { loc: number[][]; type: "text"; state: string };

  export function parsePuzzleGrid(grid: string): PuzzleElement[] {
    const lines = grid.trim().split("\n");
    const result: PuzzleElement[] = [];

    const height = lines.length;
    const width = lines[0].length;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const ch = lines[r][c];

        // Points at even rows and even columns
        if (r % 2 === 0 && c % 2 === 0 && ch === ".") {
          result.push({
            loc: [[r, c]],
            type: "point",
            state: "true",
          });
        }

        // Horizontal edges: underscore between two points
        if (r % 2 === 0 && c % 2 === 1 && ch === "_") {
          result.push({
            loc: [
              [r, c - 1],
              [r, c + 1],
            ],
            type: "edge",
            state: "-",
          });
        }

        // Vertical edges: pipe between two points
        if (r % 2 === 1 && c % 2 === 0 && ch === "|") {
          result.push({
            loc: [
              [r - 1, c],
              [r + 1, c],
            ],
            type: "edge",
            state: "-",
          });
        }

        // Surfaces: empty space between four points
        if (r % 2 === 1 && c % 2 === 1 && ch === " ") {
          result.push({
            loc: [
              [r - 1, c - 1],
              [r - 1, c + 1],
              [r + 1, c + 1],
              [r + 1, c - 1],
            ],
            type: "surface",
            state: "",
          });
        }

        // Text inside a surface cell (numbers)
        if (r % 2 === 1 && c % 2 === 1 && /\d/.test(ch)) {
          result.push({
            loc: [[r, c]],
            type: "text",
            state: ch,
          });
          result.push({
            loc: [
              [r - 1, c - 1],
              [r - 1, c + 1],
              [r + 1, c + 1],
              [r + 1, c - 1],
            ],
            type: "surface",
            state: "",
          });
        }
      }
    }

    const typeOrder = { surface: 0, edge: 1, point: 2, text: 3 };
    result.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

    return result;
  }

  async function handleCreatePuzzle() {
    try {
      // Retrieve the puzzle and solution from newResponses
      const puzzleGrid = newResponses.puzzle;
      const solutionGrid = newResponses.solution;

      // Convert both puzzle and solution grids into the required format
      const puzzleLocations = parsePuzzleGrid(puzzleGrid);
      const solutionLocations = parsePuzzleGrid(solutionGrid);

      // Add the puzzle and solution to the puzzles array
      const puzzle = await insertPuzzle(
        puzzleLocations,
        solutionLocations,
        host_id
      );

      await addNewProblemToTest(puzzle);

      // Reset modal and responses
      createModal = false;
      newResponses = { puzzle: "", solution: "" };
    } catch (e) {
      handleError(e);
    }
  }

  // Function to move the problem up (and across pages if necessary)
  function moveUp(index: number) {
    if (index > 0) {
      const currentProblem = problems[index];
      const previousProblem = problems[index - 1];

      // Swap problem_number and page_number if on different pages
      if (currentProblem.page_number !== previousProblem.page_number) {
        const tempPageNumber = currentProblem.page_number;
        currentProblem.page_number = previousProblem.page_number;
        previousProblem.page_number = tempPageNumber;
      }

      // Swap problem_number
      [currentProblem.problem_number, previousProblem.problem_number] = [
        previousProblem.problem_number,
        currentProblem.problem_number,
      ];

      // Swap positions in the array
      problems[index - 1] = currentProblem;
      problems[index] = previousProblem;

      // Resort problems after the swap
      problems.sort(
        (a: TestProblem, b: TestProblem) =>
          a.page_number - b.page_number || a.problem_number - b.problem_number
      );
    }
  }

  // Function to move the problem down (and across pages if necessary)
  function moveDown(index: number) {
    if (index < problems.length - 1) {
      const currentProblem = problems[index];
      const nextProblem = problems[index + 1];

      // Swap problem_number and page_number if on different pages
      if (currentProblem.page_number !== nextProblem.page_number) {
        const tempPageNumber = currentProblem.page_number;
        currentProblem.page_number = nextProblem.page_number;
        nextProblem.page_number = tempPageNumber;
      }

      // Swap problem_number
      [currentProblem.problem_number, nextProblem.problem_number] = [
        nextProblem.problem_number,
        currentProblem.problem_number,
      ];

      // Swap positions in the array
      problems[index + 1] = currentProblem;
      problems[index] = nextProblem;

      // Resort problems after the swap
      problems.sort(
        (a: TestProblem, b: TestProblem) =>
          a.page_number - b.page_number || a.problem_number - b.problem_number
      );
    }
  }

  async function updateTestWithKey(
    event: { target: { value: any } },
    key: string,
    autoUpdate = false
  ) {
    if (test) {
      test[key] = event.target.value;
      if (autoUpdate) {
        await updateTest(test.test_id, test);
      }
    }
  }

  async function saveTest() {
    try {
      if (test) {
        await updateTest(test.test_id, test);
        await updateTestProblems(
          test.test_id,
          problems,
          test.test_mode == "Puzzle"
        );
        clarifications = await updateProblemClarifications(clarifications);
        toast.success("Successfully saved");
      }
    } catch (e) {
      handleError(e as Error);
    }
  }

  async function addNewProblemPage() {
    if (test) {
      test.settings.pages.push("Page " + (test.settings.pages.length + 1));
      await updateTest(test.test_id, test);
    }
  }

  // Group problems by page_number
  const groupByPageNumber = (problems: TestProblem[], totalPages: number) => {
    const grouped: TestProblem[][] = Array.from(
      { length: totalPages },
      () => []
    );

    problems.forEach((problem: TestProblem) => {
      const pageNumber = problem.page_number - 1;
      if (grouped[pageNumber]) {
        grouped[pageNumber].push(problem);
      } else {
        problem.page_number = 1;
        grouped[0].push(problem);
      }
    });

    return grouped;
  };

  async function addNewProblemToTest(row: {}) {
    try {
      if (!test) return;

      const groupedProblems = groupByPageNumber(
        problems,
        test.settings.pages.length
      );
      let prob_number = 0;
      const idx = curPage !== null ? curPage : test.settings.pages.length - 1;

      if (groupedProblems[idx] && groupedProblems[idx].length > 0) {
        prob_number =
          groupedProblems[idx][groupedProblems[idx].length - 1].problem_number;
      } else {
        if (groupedProblems[idx - 1] && groupedProblems[idx - 1].length > 0) {
          prob_number =
            groupedProblems[idx - 1][groupedProblems[idx - 1].length - 1]
              .problem_number;
        } else if (groupedProblems[0] && groupedProblems[0].length > 0) {
          prob_number =
            groupedProblems[0][groupedProblems[0].length - 1].problem_number;
        }
      }

      let newProblem;

      if (test.test_mode == "Puzzle") {
        newProblem = await addNewTestProblem(
          {
            puzzle_id: row.puzzle_id,
            test_id: test.test_id,
            page_number: idx + 1,
            points: 1,
            problem_number: prob_number + 1,
          },
          "*, puzzles(*)"
        );
      } else {
        newProblem = await addNewTestProblem(
          {
            problem_id: row.problem_id,
            test_id: test.test_id,
            page_number: idx + 1,
            points: 1,
            problem_number: prob_number + 1,
          },
          "*, problems(*)"
        );
      }

      problems.push(newProblem);

      if (curPage !== null) {
        for (var i = curPage + 1; i < test.settings.pages.length; i++) {
          groupedProblems[i].forEach((problem) => {
            problem.problem_number += 1;
          });
        }
      }

      clarifications[newProblem.test_problem_id] = {
        test_problem_id: newProblem.test_problem_id,
        clarification_latex: null,
      };

      problems = [...problems];
      clarifications = { ...clarifications };

      curPage = null;
      await saveTest();
    } catch (e) {
      handleError(e as Error);
    }
  }
</script>

{#if loading}
  <p>Loading...</p>
{:else}
  <br />
  <h1>
    {test?.test_name}
  </h1>
  {#if test?.division}
    <h2>{test.division}</h2>
  {/if}
  <br />
  <Button title="Grade Test" href={$page.url.pathname + "/grade"} />
  <br /><br />
  <Button
    title="Save Test"
    action={async () => {
      await saveTest();
    }}
  />
  <br />
  <div class="box box-basic">
    <p style="font-weight: bold; font-size: 24px;">Test Instructions</p>
    <div class="row">
      <div>
        <h4>Editable</h4>
        <TextArea
          class="textArea"
          bind:value={test.instructions}
          on:input={(e) => updateTestWithKey(e, "instructions", true)}
          required={true}
        />
      </div>
      <div>
        <h4>Display</h4>
        <MathJax math={test.instructions} />
      </div>
    </div>
    <br />
  </div>

  <div class="box-basic">
    <p style="font-weight: bold; font-size: 24px;">
      {typeProblem} Rearrangement
    </p>
    <div>
      {#each groupByPageNumber(problems, test.settings.pages.length) as pageProblems, pageNumber}
        <div class="page-container">
          <div class="flex">
            <TextInput
              labelText="Page Title"
              bind:value={test.settings.pages[pageNumber]}
              style="width: 500px"
              on:blur={(e) => {
                test.settings.pages[pageNumber] = e.target.value;
              }}
            />
            <button
              class="arrow-button"
              onclick={() => {
                pageToDelete = pageNumber;
                showDeletePageModal = true;
              }}>🗑️</button
            >
          </div>
          <br />
          {#each pageProblems as problem, index}
            <div class="container">
              <div class="row">
                <div>
                  <h4>Editable</h4>
                  <div class="arrows">
                    <p style="margin: 0; padding: 0">
                      {problem.problem_number}.
                    </p>
                    <button
                      class="arrow-button"
                      onclick={() => {
                        modalProblem = problems.indexOf(problem);
                      }}>🔁</button
                    >
                    <button
                      class="arrow-button"
                      onclick={() => moveUp(problems.indexOf(problem))}
                      disabled={problems.indexOf(problem) === 0}>⬆️</button
                    >

                    <button
                      class="arrow-button"
                      onclick={() => moveDown(problems.indexOf(problem))}
                      disabled={problems.indexOf(problem) ===
                        problems.length - 1}>⬇️</button
                    >

                    <button
                      class="arrow-button"
                      onclick={async () => {
                        confirmDelete(index);
                      }}>🗑️</button
                    >
                  </div>
                  <br />
                  <TextInput
                    labelText="Name"
                    bind:value={problem.name}
                    on:input={(e) => {
                      problem.edits = true;
                      problems[problems.problem_number - 1]["name"] =
                        e.target.value;
                    }}
                  />

                  <br />
                  <div class="row">
                    <TextInput
                      labelText="Page Number"
                      bind:value={problem.page_number}
                      on:input={(e) => {
                        problem.edits = true;
                        problems[problems.indexOf(problem)]["page_number"] =
                          e.target.value;
                      }}
                    />
                    <TextInput
                      labelText="Points"
                      bind:value={problem.points}
                      on:input={(e) => {
                        problem.edits = true;
                        problems[problems.indexOf(problem)]["points"] =
                          e.target.value;
                      }}
                    />
                  </div>
                  <br />
                  <TextArea
                    labelText="Clarification Latex"
                    bind:value={
                      clarifications[problem.test_problem_id]
                        .clarification_latex
                    }
                    on:input={(e) => {
                      problem.edits = true;
                      clarifications[
                        problem.test_problem_id
                      ].clarification_latex = e.target.value;
                    }}
                  />
                  <br />
                  {#if test.test_mode != "Puzzle"}
                    <TextArea
                      labelText="Problem Latex"
                      bind:value={problem.problems.problem_latex}
                      on:input={(e) => {
                        problem.edits = true;
                        problems[problems.indexOf(problem)]["problems"][
                          "problem_latex"
                        ] = e.target.value;
                      }}
                    />
                    <br />
                    <TextInput
                      labelText="Answer Latex"
                      bind:value={problem.problems.answer_latex}
                      on:input={(e) => {
                        problem.edits = true;
                        problems[problems.indexOf(problem)]["problems"][
                          "answer_latex"
                        ] = e.target.value;
                      }}
                    />
                  {/if}
                  <br />
                  {#if problem.edits}
                    <Button
                      title="Save Changes"
                      action={async () => {
                        try {
                          delete problem.edits;
                          if (test.test_mode == "Puzzle") {
                            await updateTestPuzzle(
                              test.test_id,
                              problems[problems.indexOf(problem)]
                            );
                          } else {
                            await updateTestProblem(
                              test.test_id,
                              problems[problems.indexOf(problem)]
                            );
                          }
                          clarifications[problem.test_problem_id] =
                            await updateClarification({
                              ...clarifications[problem.test_problem_id],
                            });
                          toast.success("Saved problem");
                        } catch (e) {
                          await handleError(e);
                        }
                      }}
                    />
                  {/if}
                  <br />
                </div>
                <div>
                  {#if test.test_mode == "Puzzle"}
                    <h4>Edit Puzzle</h4>
                    <EditPuzzle bind:puzzle={problem.puzzles.puzzle} />
                    <br /><br />
                    <h4>Edit Solution</h4>
                    <EditPuzzle
                      bind:puzzle={problem.puzzles.solution}
                      is_solution={true}
                      handleReplaceSolution={() => {
                        problem.puzzles.solution = problem.puzzles.puzzle;
                        problems[index] = { ...problem };
                      }}
                    />
                  {:else}
                    <h4>Display</h4>
                    <Problem
                      {problem}
                      clarification={clarifications[problem.test_problem_id]
                        .clarification_latex}
                    />
                    <br /><br />
                    <MathJax
                      math={"Answer: " + problem.problems.answer_latex}
                    />
                  {/if}
                </div>
              </div>
            </div>
            <br />
          {/each}

          <br />
          <Button
            title="Add New {typeProblem}"
            action={async () => {
              loading = true;
              curPage = pageNumber;
              openAddProblemModal = true;
              loading = false;
            }}
          />
          <br /><br />
        </div>
        <br />
      {/each}
      <Button
        title="Add New Page"
        action={async () => {
          loading = true;
          await addNewProblemPage();
          loading = false;
        }}
      />
      <br />
    </div>
  </div>

  <SelectProblem
    open={modalProblem != null}
    changeNewProblem={() => {
      modalProblem = null;
      if (test.test_mode == "Puzzle") {
        createModal = true;
      } else {
        newProblemModal = true;
      }
    }}
    {allProblems}
    {host_id}
    closeModal={() => (modalProblem = null)}
    onSelect={async (row) => {
      try {
        let newProblem;

        if (test.test_mode == "Puzzle") {
          newProblem = await replaceTestPuzzle(
            problems[modalProblem].test_problem_id,
            row.puzzle_id,
            "*, puzzles(*)"
          );
        } else {
          newProblem = await replaceTestProblem(
            problems[modalProblem].test_problem_id,
            row.problem_id,
            "*, problems(*)"
          );
        }

        problems[modalProblem] = newProblem;
        problems = [...problems];

        toast.success("Problem successfully replaced");
        modalProblem = null;
      } catch (e) {
        handleError(e);
      }
    }}
    {typeProblem}
  />

  <SelectProblem
    open={openAddProblemModal}
    {allProblems}
    changeNewProblem={() => {
      openAddProblemModal = false;
      if (test.test_mode == "Puzzle") {
        createModal = true;
      } else {
        newProblemModal = true;
      }
    }}
    closeModal={() => {
      openAddProblemModal = false;
    }}
    {host_id}
    onSelect={async (row) => {
      console.log("ROW", row);
      await addNewProblemToTest(row);
      openAddProblemModal = false;
    }}
    {typeProblem}
  />

  <CreateProblemModal
    open={newProblemModal}
    {host_id}
    changeNewProblem={() => {
      newProblemModal = true;
    }}
    closeModal={() => {
      newProblemModal = false;
    }}
    addProblemFunction={async (problem) => {
      console.log("PROBLEM", problem);
      await addNewProblemToTest(problem);
      newProblemModal = false;
    }}
  />

  <ConfirmationModal
    isShown={showDeletePageModal}
    actionName="delete this page"
    warning="Deleting this page will remove all problems on it."
    onCancel={() => {
      showDeletePageModal = false;
      pageToDelete = null;
    }}
    onConfirm={async () => {
      try {
        if (pageToDelete !== null) {
          test.settings.pages.splice(pageToDelete, 1);

          let problem_number_decrease = 0;

          // Filter out problems on the deleted page and count them
          problems = problems.filter(async (problem) => {
            console.log(problem.page_number + " " + (pageToDelete + 1));
            if (problem.page_number == pageToDelete + 1) {
              problem_number_decrease++;
              const testProblemId = problem.test_problem_id;
              await deleteTestProblem(testProblemId);
              return false; // Remove the problem
            }
            return true; // Keep the problem
          });

          // Adjust the page_number and problem_number for remaining problems
          problems.forEach((problem) => {
            if (problem.page_number > pageToDelete + 1) {
              problem.page_number -= 1;
              problem.problem_number -= problem_number_decrease;
            }
          });

          await saveTest();
          await getNewValues();
        }

        showDeletePageModal = false;
        pageToDelete = null;
      } catch (e) {
        handleError(e);
      }
    }}
  />

  <ConfirmationModal
    isShown={showDeleteModal}
    actionName="delete this custom field"
    warning="It may delete existing user registration data"
    onCancel={() => {
      showDeleteModal = false;
      fieldToDelete = null;
    }}
    onConfirm={async () => {
      try {
        const testProblemId = problems[fieldToDelete].test_problem_id;
        await deleteTestProblem(testProblemId);

        problems.splice(fieldToDelete, 1);

        for (let i = fieldToDelete; i < problems.length; i++) {
          problems[i].problem_number -= 1;
        }

        await saveTest();

        if (test.test_mode == "Puzzle") {
          problems =
            (await getTestProblems(test_id, null, "*, puzzles(*)")) || [];
        } else {
          problems =
            (await getTestProblems(test_id, null, "*, problems(*)")) || [];
        }

        showDeleteModal = false;
        fieldToDelete = null;
      } catch (e) {
        handleError(e);
      }
    }}
  />

  <div class="modalExterior">
    <Modal bind:open={createModal}>
      <div class="specificModalMax">
        <h3
          class="text-xl font-medium text-gray-900 dark:text-white text-center"
        >
          Create Puzzle
        </h3>
        <p class="italic text-gray-500 text-center text-sm">
          Input the puzzle and solution in text format
        </p>
        <CustomForm
          fields={[
            {
              event_custom_field_id: "puzzle",
              key: "puzzle",
              label: "Puzzle",
              required: true,
              editable: true,
              custom_field_type: "paragraph",
              value: newResponses.puzzle,
            },
            {
              event_custom_field_id: "solution",
              key: "solution",
              label: "Solution",
              required: true,
              editable: true,
              custom_field_type: "paragraph",
              value: newResponses.solution,
            },
          ]}
          bind:newResponses
          handleSubmit={handleCreatePuzzle}
          showBorder={false}
          buttonText="Create"
        />
      </div>
    </Modal>
  </div>
{/if}

<style>
  h1 {
    text-align: center;
  }

  :global(.specificModalMax) {
    max-height: 400px !important;
  }

  :global(.specificModalMax .registrationForm) {
    padding: 0px;
  }

  .box {
    border: 1px solid black;
    padding: 10px;
  }

  .box-basic {
    margin: 20px;
    text-align: left;
  }

  .container {
    border: 2px solid #000000;
    align-items: center;
    padding: 10px;
    margin-bottom: 10px;
  }

  .arrows {
    display: flex;
    align-items: center;
    margin-top: 7px;
  }

  .arrow-button {
    padding: 5px;
    cursor: pointer;
    width: 40px;
    margin-left: 10px;
  }

  button {
    border: none;
    outline: none;
    background-color: none;
  }

  .page-container {
    border: 3px solid var(--primary);
    padding: 10px;
    margin-bottom: 20px;
  }
</style>
