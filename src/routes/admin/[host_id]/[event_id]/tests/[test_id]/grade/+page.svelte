<script lang="ts">
  import { run } from "svelte/legacy";

  import { page } from "$app/stores";
  import MathJax from "$lib/components/MathJax.svelte";
  import {
    getGradedAnswers,
    getTestProblems,
    insertGradedAnswers,
    updateGradedAnswer,
    updateGradedAnswers,
  } from "$lib/supabase";
  import Button from "$lib/components/Button.svelte";
  import toast from "$lib/toast.svelte";
  import { handleError } from "$lib/handleError";
  import { supabase } from "$lib/supabaseClient";
  import AsciiMath from "$lib/components/AsciiMath.svelte";

  let test_id = Number($page.params.test_id);
  let problems: [] = $state();
  let problem_list: [] = $state();
  let loading = $state(true);
  let selectedProblem = $state();
  let gradedAnswers: any[] = $state([]);
  let gradedAnswersChannel;
  let gradedAnswerCountChannel;

  function sortedGradedAnswers() {
    return gradedAnswers.slice().sort((a, b) => {
      if (a.correct === b.correct) {
        return b.count - a.count;
      }
      if (a.correct === true) return -1;
      if (b.correct === true) return 1;
      if (a.correct === false) return -1;
      if (b.correct === false) return 1;
      return 0;
    });
  }

  (async () => {
    problems = await getTestProblems(test_id, null, "*, problems(*)");
    problem_list = Object.keys(problems);
    selectedProblem = 0;
    await recieveGradedAnswers();
    loading = false;
  })();

  async function recieveGradedAnswers() {
    try {
      loading = true;
      gradedAnswers = await getGradedAnswers(
        problems[selectedProblem].test_problem_id,
      );
      gradedAnswers = sortedGradedAnswers([...gradedAnswers]);

      subscribeToGradedAnswersChannel();

      loading = false;
    } catch (e) {
      handleError(e);
    }
  }

  async function markRestIncorrect() {
    try {
      gradedAnswers.forEach((gradedAnswer) => {
        if (gradedAnswer.correct != true) {
          gradedAnswer.correct = false;
        }
      });

      await updateGradedAnswers(gradedAnswers);
      gradedAnswers = sortedGradedAnswers([...gradedAnswers]);
      toast.success("Successfully saved");
    } catch (e) {
      handleError(e);
    }
  }

  function handleGradedAnswerChange(payload) {
    const updatedAnswer = payload.new;
    const existingIndex = gradedAnswers.findIndex(
      (answer) => answer.answer_latex === updatedAnswer.answer_latex,
    );

    if (existingIndex !== -1) {
      gradedAnswers[existingIndex].correct = updatedAnswer.correct;
    }

    gradedAnswers = [...gradedAnswers];
    gradedAnswers = sortedGradedAnswers([...gradedAnswers]);
  }

  async function handleTestAnswerNew(payload) {
    const updatedAnswer = payload.new;
    const existingIndex = gradedAnswers.findIndex(
      (answer) => answer.answer_latex === updatedAnswer.answer_latex,
    );

    const parameter = {
      problem_id: problems[selectedProblem]["problem_id"],
      ...updatedAnswer,
    };
    const newGradedAnswer = await insertGradedAnswers(parameter);

    if (existingIndex !== -1) {
      gradedAnswers[existingIndex].correct = newGradedAnswer.correct;
      gradedAnswers[existingIndex].count += 1;
    } else {
      gradedAnswers.push(newGradedAnswer);
    }

    gradedAnswers = [...gradedAnswers];
    gradedAnswers = sortedGradedAnswers([...gradedAnswers]);
  }

  async function handleTestAnswerChange(payload) {
    const oldAnswer = payload.old;
    const existingIndex = gradedAnswers.findIndex(
      (answer) => answer.answer_latex === oldAnswer.answer_latex,
    );

    gradedAnswers[existingIndex].count -= 1;
    if (gradedAnswers[existingIndex].count == 0) {
      gradedAnswers.splice(existingIndex, 1);
    }

    gradedAnswers = [...gradedAnswers];

    await handleTestAnswerNew(payload);
  }

  function subscribeToGradedAnswersChannel() {
    if (gradedAnswersChannel) {
      gradedAnswersChannel.unsubscribe();
    }

    if (gradedAnswerCountChannel) {
      gradedAnswerCountChannel.unsubscribe();
    }

    gradedAnswerCountChannel = supabase
      .channel(`test-answers-${problems[selectedProblem].test_problem_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "test_answers",
          filter: `test_problem_id=eq.${problems[selectedProblem].test_problem_id}`,
        },
        handleTestAnswerNew,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "test_answers",
          filter: `test_problem_id=eq.${problems[selectedProblem].test_problem_id}`,
        },
        handleTestAnswerChange,
      )
      .subscribe();

    gradedAnswersChannel = supabase
      .channel(`graded-answers-${problems[selectedProblem].problem_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "graded_answers",
          filter: `problem_id=eq.${problems[selectedProblem].problem_id}`,
        },
        handleGradedAnswerChange,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "graded_answers",
          filter: `problem_id=eq.${problems[selectedProblem].problem_id}`,
        },
        handleGradedAnswerChange,
      )
      .subscribe();
  }
  run(() => {
    if (selectedProblem !== undefined) {
      recieveGradedAnswers();
    }
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else}
  <br />
  <h1>Grade Test</h1>
  <br />
  <div class="row">
    <div>
      {#each problem_list as problem, index}
        <button
          class="problem_click"
          style="background-color: {problem == selectedProblem
            ? 'var(--secondary-light)'
            : 'var(--primary-light)'};"
          onclick={() => {
            selectedProblem = index;
          }}>{Number(problem) + 1}</button
        >
        <br />
      {/each}
    </div>
    <div>
      <div style="border: 1px solid gray; border-radius: 10px; padding: 10px;">
        <h3>Problem {selectedProblem + 1}</h3>
        <p>Problem</p>
        <MathJax math={problems[selectedProblem].problems.problem_latex} />
        <br />
        <p>Answer</p>
        <MathJax math={problems[selectedProblem].problems.answer_latex} />
      </div>
      <br /><br />
      <div>
        <h3>Answers</h3>
        <br />
        <Button title="Mark Rest Incorrect" action={markRestIncorrect} />
        <br /><br /><br />
        <div class="grid">
          {#each gradedAnswers as answer, index}
            {#if answer.answer_latex}
              <div
                class="answerbox"
                style="background-color: {answer.correct != null
                  ? answer.correct == true
                    ? 'var(--primary-tint)'
                    : 'var(--error-tint)'
                  : 'rgb(220, 220, 220)'}"
              >
                <div class="answer">
                  <AsciiMath value={answer.answer_latex} /><br />
                  {answer.answer_latex}
                </div>
                <div style="display: flex;">
                  <button
                    class="arrow-button"
                    onclick={async () => {
                      if (gradedAnswers[index].correct == true) {
                        gradedAnswers[index].correct = null;
                      } else {
                        gradedAnswers[index].correct = true;
                      }
                      await updateGradedAnswer(gradedAnswers[index]);
                    }}>✅</button
                  >
                  <button
                    class="arrow-button"
                    onclick={async () => {
                      if (gradedAnswers[index].correct == false) {
                        gradedAnswers[index].correct = null;
                      } else {
                        gradedAnswers[index].correct = false;
                      }
                      await updateGradedAnswer(gradedAnswers[index]);
                    }}>❌</button
                  >
                  <p style="margin: 2px;">
                    {answer.count ?? "0"}
                  </p>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .row {
    grid-template-columns: 10% auto;
    column-gap: 20px;
    padding: 20px;
    text-align: left;
  }

  .problem_click {
    width: 100%;
    border-radius: 50px;
    padding: 5px 10px;
    border: none;
    outline: none;
    margin-bottom: 10px;
  }

  h3,
  p {
    font-weight: bold;
  }

  h3 {
    font-size: 24px;
  }

  .grid {
    grid-template-columns: 24% 24% 24% 24%;
    column-gap: 10px;
    row-gap: 10px;
  }

  .answerbox {
    padding: 10px;
    border-radius: 5px;
    display: grid;
    grid-template-columns: 75% 25%;
    min-height: 50px;
  }

  .answer {
    overflow-x: scroll;
    overflow-y: hidden;
  }

  .arrow-button {
    padding: 0px;
    cursor: pointer;
    background-color: transparent;
    border: none;
    margin-left: 2px;
  }
</style>
