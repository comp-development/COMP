<script lang="ts">
  import MathJax from "$lib/components/MathJax.svelte";
  import { onMount, onDestroy } from "svelte";

  import type { Database } from "../../../db/database.types";
  interface Props {
    clarification?: string | null;
    problem: any;
    log: (
      event_type: Database["public"]["Enums"]["test_event"],
      data: string,
      problem_id?: number
    ) => Promise<void>
  }

  let enterTime: number | null = null;

  let container: HTMLDivElement;

  let { clarification = null, problem, log }: Props = $props();

  onMount(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        enterTime = performance.now();
      } else {
        if(!enterTime) return;
        const duration = performance.now() - enterTime;
        if(duration > 20000) {
          log("problem_view", Math.round(duration).toString(), problem.problem_number);
        }
      }
    }, {
      threshold: 0.5
    });

    observer.observe(container);

    onDestroy(() => {
      observer.disconnect();
    });
  });


</script>

<div bind:this={container} style="margin-bottom: 5px;">
  <span style="font-size: 20px; font-weight: bold;">
    {problem.name && problem.name != ""
      ? problem.name
      : "Problem " + problem.problem_number}
  </span>
  {#if problem.points}
    ({problem.points} {problem.points == 1 ? "pt" : "pts"})
  {/if}
</div>
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
