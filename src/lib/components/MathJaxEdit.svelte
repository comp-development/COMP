<script lang="ts">
	import { page } from "$app/stores";
	import toast from "svelte-french-toast";
	import { ExpandableTile } from "carbon-components-svelte";
	import { formatTime, addTime, subtractTime } from "$lib/dateUtils";
    //comment
	import TestView from "$lib/components/TestView.svelte";
	import MathJax from "$lib/components/MathJax.svelte";
	import Button from "$lib/components/Button.svelte";
	import { handleError } from "$lib/handleError";
	import {
		getThisUser,
		getTestTaker,
		getTest,
		getTeamId,
		getTestAnswers,
	} from "$lib/supabase";

    export let latex = ""
    export let clarification = true;

	console.log("SUP");
	let loading = true;
	let disallowed = false;

	let test_id = Number($page.params.test_id);
	let is_team = $page.params.test_id.charAt(0) == "t" ? true : false;

	let user;
	let test;
	let test_taker;
	(async () => {
		user = await getThisUser();
		test = await getTest(test_id);
		console.log("USER_ID", user.id);
		await getThisTestTaker();
		loading = false;
	})();


</script>

<div class="problem-container">
    <div class="problem-div">
        <p style="margin-bottom: 5px;">
            <span style="font-size: 20px; font-weight: bold;">
                Problem {problem.problem_number}
            </span>
        </p>
        <br />
        <MathJax math={problem.problems.problem_latex} />
        {#if clarifications[problem.test_problem_id]}
            <br />
            <div class="clarification">
                <p>
                    <span style="font-weight: bold; color: var(--error-dark); padding: 10px;">!</span>
                    <span style="display: inline-block; vertical-align: middle;">
                        <MathJax math={clarifications[problem.test_problem_id]}/>
                    </span>
                </p>
            </div>
        {/if}
        <div style="margin-top: 30px; width: 300px;">
            <TextInput
                labelText="Answer"
                bind:value={answersMap[problem.test_problem_id]}
                on:blur={(e) =>
                    changeAnswer(e, problem.test_problem_id)}
            />
            <br />
            <Katex
                value={answersMap[problem.test_problem_id]}
            />
            {#if saved[problem.test_problem_id]}
                <br />
                <p
                    style="color: green; margin-bottom: 0; font-size: 12px;"
                >
                    Saved {saved[problem.test_problem_id]}
                </p>
            {/if}
        </div>
        <br />
    </div>
</div>