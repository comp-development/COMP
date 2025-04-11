<script lang="ts">
  import MathJax from "$lib/components/MathJax.svelte";
  import { onMount } from "svelte";

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

  let container: HTMLDivElement;

  let { clarification = null, problem, log }: Props = $props();

  onMount(() => {
    container.addEventListener("keydown", (e) => {
      if (["Meta", "Alt", "Shift", "Control"].find((k) => k == e.key)) {
        return;
      }
      log("keypress", (e.shiftKey ? "Shift+" : "") + (e.metaKey ? "Meta+" : "") + (e.ctrlKey ? "Ctrl+" : "") + (e.altKey ? "Alt+" : "") + e.key);
    });
    container.addEventListener("paste", (e) => {
      log("paste", e.clipboardData?.getData("text") ?? "unknown");
    });
  });

</script>

<p bind:this={container} style="margin-bottom: 5px;">
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
