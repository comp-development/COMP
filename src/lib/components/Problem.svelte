<script lang="ts">
  import MathJax from "$lib/components/MathJax.svelte";

  interface Props {
    clarification?: string | null;
    problem: any;
  }

  let { clarification = null, problem }: Props = $props();
</script>

<p style="margin-bottom: 5px;">
  <span style="font-size: 20px; font-weight: bold;">
    {problem.name && problem.name != ""
      ? problem.name
      : "Problem " + problem.problem_number}
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
      <span style="font-weight: bold; color: var(--error-dark); padding: 10px;"
        >!</span
      >
      <span style="display: inline-block; vertical-align: middle;">
        <MathJax math={clarification} />
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
