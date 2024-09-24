<script lang="ts">
    import { page } from "$app/stores";
    import MathJax from "$lib/components/MathJax.svelte";
    import {
        getGradedAnswers,
        getTestProblems,
        updateGradedAnswers,
    } from "$lib/supabase";
    import Button from "$lib/components/Button.svelte";
    import toast from "svelte-french-toast";
    import { handleError } from "$lib/handleError";

    let test_id = Number($page.params.test_id);
    let problems: [];
    let problem_list: [];
    let loading = true;
    let selectedProblem = 0;
    let gradedAnswers: [] = [];

    $: selectedProblem,
        async () => {
            await recieveGradedAnswers();
        };

    function sortedGradedAnswers() {
        console.log(gradedAnswers);
        return gradedAnswers.slice().sort((a, b) => {
            if (a.correct === b.correct) return 0;
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
        await recieveGradedAnswers();
        loading = false;
    })();

    async function recieveGradedAnswers() {
        try {
            loading = true;
            gradedAnswers = await getGradedAnswers(
                problems[selectedProblem].problem_id,
            );
            gradedAnswers = sortedGradedAnswers(gradedAnswers);
            loading = false;
        } catch (e) {
            await handleError(e);
        }
    }

    async function submitUpdatedGrades() {
        try { 
            await updateGradedAnswers(gradedAnswers);
            toast.success("Successfully saved");
        } catch (e) {
            await handleError(e);
        }
    }

    function markRestIncorrect() {
        gradedAnswers.forEach((gradedAnswer) => {
            if (gradedAnswer.correct != true) {
                gradedAnswer.correct = false;
            }
        });

        gradedAnswers = sortedGradedAnswers([...gradedAnswers]);
    }
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
                    on:click={() => {
                        selectedProblem = index;
                    }}>{Number(problem) + 1}</button
                >
                <br />
            {/each}
        </div>
        <div>
            <div
                style="border: 1px solid gray; border-radius: 10px; padding: 10px;"
            >
                <h3>Problem {selectedProblem + 1}</h3>
                <p>Problem</p>
                <MathJax
                    math={problems[selectedProblem].problems.problem_latex}
                />
                <br />
                <p>Answer</p>
                <MathJax
                    math={problems[selectedProblem].problems.answer_latex}
                />
            </div>
            <br /><br />
            <div>
                <h3>Answers</h3>
                <br />
                <Button title="Save Grades" action={submitUpdatedGrades} />
                <br /><br />
                <Button title="Mark Rest Incorrect" action={markRestIncorrect} />
                <br /><br />
                <div class="grid">
                    {#each gradedAnswers as answer, index}
                        <div
                            class="answerbox"
                            style="background-color: {answer.correct != null
                                ? answer.correct == true
                                    ? 'var(--primary-tint)'
                                    : 'var(--error-tint)'
                                : 'rgb(220, 220, 220)'}"
                        >
                            <div class="answer">
                                <MathJax math={answer.answer_latex} />
                            </div>
                            <div style="display: flex;">
                                <button
                                    class="arrow-button"
                                    on:click={() => {
                                        if (
                                            gradedAnswers[index].correct == true
                                        ) {
                                            gradedAnswers[index].correct = null;
                                        } else {
                                            gradedAnswers[index].correct = true;
                                        }
                                        gradedAnswers = sortedGradedAnswers([...gradedAnswers]);
                                    }}>✅</button
                                >
                                <button
                                    class="arrow-button"
                                    on:click={() => {
                                        if (
                                            gradedAnswers[index].correct ==
                                            false
                                        ) {
                                            gradedAnswers[index].correct = null;
                                        } else {
                                            gradedAnswers[index].correct =
                                                false;
                                        }
                                        gradedAnswers = sortedGradedAnswers([...gradedAnswers]);
                                    }}>❌</button
                                >
                            </div>
                        </div>
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
    }

    .answerbox {
        padding: 10px;
        border-radius: 5px;
        display: grid;
        grid-template-columns: 80% 20%;
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
