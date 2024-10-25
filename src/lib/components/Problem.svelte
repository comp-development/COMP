<script lang="ts">
    import MathJax from "$lib/components/MathJax.svelte";

    export let clarification: string | null = null;
    export let problem;
    export let classs = "";
</script>

<div class={classs}>
    <p style="margin-bottom: 5px;">
        <span style="font-size: 20px; font-weight: bold;">
            {problem.name && problem.name != "" ? problem.name : "Problem "+problem.problem_number}
        </span>
        {#if problem.points}
            ({problem.points} {problem.points == 1 ? "pt" : "pts"})
        {/if}
    </p>
    <br />
    <MathJax math={problem.problems.problem_latex} />
    {#if clarification}
        <br />
        <div class="clarification">
            <p>
                <span style="font-weight: bold; color: var(--error-dark); padding: 10px;">!</span>
                <span style="display: inline-block; vertical-align: middle;">
                    <MathJax math={clarification}/>
                </span>
            </p>
        </div>
    {/if}
</div>

<style>
    .clarification {
		border: 2px solid var(--error-light);
		background-color: var(--error-tint);
		padding: 10px;
	}

    .blurred {
        filter: blur(5px); /* Adjust the blur intensity */
        pointer-events: none; /* Prevent interaction */
        }
</style>