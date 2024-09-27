<script lang="ts">
    import {
        TextArea,
        TextInput
    } from "carbon-components-svelte";
    import Button from "$lib/components/Button.svelte";
    import MathJax from "$lib/components/MathJax.svelte";
    import { addProblem, getAllProblems } from "$lib/supabase";

    export let open: boolean;
    export let closeModal;
    export let addProblemFunction;

    let allProblems;

    let pageSize = 25;
    let pageT = 1;

    let problem = {
        problem_latex: "",
        answer_latex: "",
    };

    async function onSubmit() {
        const newProblem = await addProblem(problem);
        await addProblemFunction(newProblem);
    }

    (async () => {
        allProblems = await getAllProblems();
        allProblems.forEach((problem) => {
            problem.id = problem.problem_id;
        });
    })();
</script>

{#if open}
    <div class="modal-overlay" on:click={closeModal}>
        <div class="modal" on:click|stopPropagation>
            <button class="close-button" on:click={closeModal}>✖</button>
            <h2>Write New Problem</h2>
            <br />
            <div class="row">
                <div>
                    <h4>Editable</h4>
                    <TextArea
                        labelText="Problem Latex"
                        bind:value={problem.problem_latex}
                        on:input={(e) => {
                            problem.problem_latex = e.target.value;
                        }}
                    />
                    <br />
                    <TextInput
                        labelText="Answer Latex"
                        bind:value={problem.answer_latex}
                        on:blur={(e) => {
                            problem.answer_latex = e.target.value;
                        }}
                    />
                </div>
                <div>
                    <h4>Display</h4>
                    <p>Problem:</p>
                    <MathJax math={problem.problem_latex} />
                    <br /><br />
                    <p>Answer:</p>
                    <MathJax math={problem.answer_latex} />
                </div>
            </div>
            <br /><br />
            <Button title="Submit" action={onSubmit} />
        </div>
    </div>
{/if}

<style>
    .cell-content {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal {
        background-color: white;
        padding: 20px;
        width: 600px;
        max-width: 90%;
        max-height: 500px;
        overflow-y: auto;
        border-radius: 8px;
        position: relative;
    }

    .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
    }

    button {
		border: none;
		outline: none;
		background-color: none;
	}
</style>
