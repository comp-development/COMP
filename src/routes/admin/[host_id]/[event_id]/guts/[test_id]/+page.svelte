<script lang="ts">
    import { supabase } from "$lib/supabaseClient";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import katex from "katex";
    import "katex/dist/katex.min.css";

    let testId = Number($page.params.test_id);
    let problems: { problem_id: number; problem_latex: string }[] = [];
    let loading = true;

    async function fetchProblems() {
        try {
            console.log(testId);
            // Fetch problem_id(s) from test_problems table
            const { data: testProblems, error: testProblemsError } = await supabase
                .from("test_problems")
                .select("problem_id")
                .eq("test_id", testId);
            
            console.log(testProblems);

            if (testProblemsError) throw testProblemsError;
            if (!testProblems || testProblems.length === 0) {
                console.log("No problems found for this test.");
                loading = false;
                return;
            }

            // Extract problem_ids
            const problemIds = testProblems.map((row: { problem_id: number }) => row.problem_id);

            // Fetch problem_latex from problems table
            const { data: problemData, error: problemError } = await supabase
                .from("problems")
                .select("problem_id, problem_latex")
                .in("problem_id", problemIds);

            if (problemError) throw problemError;
            problems = problemData || [];
        } catch (err) {
            console.error("Error fetching problems:", err);
        }
        loading = false;
    }

    function renderLatex(latexString: string) {
        return katex.renderToString(latexString, {
            throwOnError: false,
            displayMode: true
        });
    }

    onMount(fetchProblems);
</script>

<!-- Render Problems -->
<div class="container">
    <h1>Problems for Test {testId}</h1>

    {#if loading}
        <p>Loading problems...</p>
    {:else}
        {#if problems.length === 0}
            <p>No problems found for this test.</p>
        {:else}
            {#each problems as problem}
                <div class="problem-card">
                    <div class="problem-id">Problem ID: {problem.problem_id}</div>
                    <div class="problem-latex">
                        {@html renderLatex(problem.problem_latex)}
                    </div>
                </div>
            {/each}
        {/if}
    {/if}
</div>

<style>
    .container {
        max-width: 700px;
        margin: 0 auto;
        font-family: Arial, sans-serif;
    }
    .problem-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        margin: 10px 0;
        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
        background-color: #fff;
    }
    .problem-id {
        font-size: 1.1em;
        font-weight: bold;
        color: #333;
    }
    .problem-latex {
        margin-top: 10px;
        font-size: 1.2em;
        background-color: #f9f9f9;
        padding: 10px;
        border-radius: 5px;
        overflow-x: auto;
    }
</style>
