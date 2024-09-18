<script lang="ts">
    import MathJax from "$lib/components/MathJax.svelte";

    export let clarification: string | null = null;
    export let problem;
</script>

<p style="margin-bottom: 5px;">
    <span style="font-size: 20px; font-weight: bold;">
        Problem {problem.name ?? problem.problem_order}
    </span>
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

<style>
    .clarification {
		border: 2px solid var(--error-light);
		background-color: var(--error-tint);
		padding: 10px;
	}
</style>