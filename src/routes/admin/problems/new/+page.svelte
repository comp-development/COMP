<script lang="ts">
    import MathJax from "$lib/components/MathJax.svelte";
    import Button from "$lib/components/Button.svelte";

    import { addProblem } from "$lib/supabase";
    import { TextArea, TextInput } from "carbon-components-svelte";
    import { handleError } from "$lib/handleError";

    let problem = $state({
        problem_latex: "",
        answer_latex: "",
    });

    async function onSubmit() {
        try {
            await addProblem(problem);
            window.location.replace("/admin/events");
        } catch (e) {
            await handleError(e);
        }
    }
</script>

<br />
<h1>Create New Problem</h1>
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

<style>
    .row {
        padding: 20px;
        text-align: left;
    }

    p {
        font-weight: bold;
    }
</style>