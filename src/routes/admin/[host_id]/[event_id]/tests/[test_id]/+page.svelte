<script lang="ts">
  import { page } from "$app/stores";
  import toast from "$lib/toast.svelte";
  import { TextArea, TextInput } from "carbon-components-svelte";
  import {} from "carbon-components-svelte";
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
  } from "$lib/supabase";
  import Problem from "$lib/components/Problem.svelte";
  import SelectProblem from "$lib/components/SelectProblem.svelte";
  import CreateProblemModal from "$lib/components/CreateProblemModal.svelte";

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
  let allProblems: any[];

  (async () => {
    user = await getThisUser();
    test = await getTest(test_id);
    problems = await getTestProblems(test_id, null, "*, problems(*)") || [];
    allProblems = await getAllProblems(host_id);
    allProblems.forEach((problem) => {
      problem.id = problem.problem_id;
    });
    clarifications = await getAllProblemClarifications(problems);
    loading = false;
  })();

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
          a.page_number - b.page_number || a.problem_number - b.problem_number,
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
          a.page_number - b.page_number || a.problem_number - b.problem_number,
      );
    }
  }

  async function updateTestWithKey(event: { target: { value: any } }, key: string, autoUpdate = false) {
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
        await updateTestProblems(test.test_id, problems);
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
    const grouped: TestProblem[][] = Array.from({ length: totalPages }, () => []);

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

  async function addNewProblemToTest(row: { problem_id: number }) {
    try {
      if (!test) return;
      
      const groupedProblems = groupByPageNumber(
        problems,
        test.settings.pages.length,
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

      const newProblem = await addNewTestProblem(
        {
          problem_id: row.problem_id,
          test_id: test.test_id,
          page_number: idx + 1,
          points: 1,
          problem_number: prob_number + 1,
        },
        "*, problems(*)",
      );

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

  {#if test.test_mode != "Puzzle"}
    <div class="box-basic">
      <p style="font-weight: bold; font-size: 24px;">Problem Rearrangement</p>
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
                onclick={async () => {
                  test.settings.pages.splice(pageNumber, 1);
                  test = { ...test };
                  await saveTest();
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
                          await deleteTestProblem(problem.test_problem_id);

                          const curIndex = problems.indexOf(problem);

                          problems.splice(curIndex, 1);

                          for (let i = curIndex; i < problems.length; i++) {
                            problems[curIndex].problem_number -= 1;
                          }

                          problems = [...problems];

                          await saveTest();
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
                    <br />
                    {#if problem.edits}
                      <Button
                        title="Save Changes"
                        action={async () => {
                          try {
                            delete problem.edits;
                            await updateTestProblem(
                              test.test_id,
                              problems[problems.indexOf(problem)],
                            );
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
                    <h4>Display</h4>
                    <Problem
                      {problem}
                      clarification={clarifications[problem.test_problem_id]
                        .clarification_latex}
                    />
                    <br /><br />
                    <MathJax math={"Answer: " + problem.problems.answer_latex} />
                  </div>
                </div>
              </div>
              <br />
            {/each}

            <br />
            <Button
              title="Add New Problem"
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
            await addNewProblemPage(
              problems[problems.length - 1].page_number + 1,
            );
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
        newProblemModal = true;
      }}
      host_id={host_id}
      closeModal={() => (modalProblem = null)}
      onSelect={async (row) => {
        try {
          const newProblem = await replaceTestProblem(
            problems[modalProblem].test_problem_id,
            row.problem_id,
            "*, problems(*)",
          );
          problems[modalProblem] = newProblem;
          problems = [...problems];

          modalProblem = null;
        } catch (e) {
          handleError(e);
        }
      }}
    />

    <SelectProblem
      open={openAddProblemModal}
      changeNewProblem={() => {
        openAddProblemModal = false;
        newProblemModal = true;
      }}
      closeModal={() => {
        openAddProblemModal = false;
      }}
      host_id={host_id}
      onSelect={async (row) => {
        console.log("ROW", row);
        await addNewProblemToTest(row);
      }}
    />

    <CreateProblemModal
      open={newProblemModal}
      host_id={host_id}
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
  {:else}
    <PuzzleNavigation />
  {/if}
{/if}

<style>
  h1 {
    text-align: center;
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
