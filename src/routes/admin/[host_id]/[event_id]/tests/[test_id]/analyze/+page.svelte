<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import CheatingMetricsTable from "$lib/components/CheatingMetricsTable.svelte";
  import {
    fetchAllTakerInfo,
    fetchTestAnswers,
    fetchPasteEvents,
    calculateAllCheatMetrics,
  } from "$lib/supabase/cheating";
  import { getGradedTestAnswers } from "$lib/supabase";

  let test_id = 0;
  let event_id = 0;
  $: test_id = Number($page.params.test_id);
  $: event_id = Number($page.params.event_id);

  let metrics = [];
  let loading = true;

  export async function fetchCheatMetrics(
    event_id: number,
    test_id: number
  ): Promise<CheatMetrics[]> {
    // 1) pull in all the raw data
    const takers = await fetchAllTakerInfo(event_id, test_id);
    const answers = await fetchTestAnswers(takers.map((t) => t.test_taker_id));
    const pasteEvents = await fetchPasteEvents(
      takers.map((t) => t.test_taker_id)
    );
    // 2) compute the “cheat metrics” you already have
    const metrics = calculateAllCheatMetrics(takers, answers, pasteEvents);

    // 3) pull in graded answers & build a map test_taker_id → totalPoints
    const graded = await getGradedTestAnswers(test_id);
    const pointsByTaker = new Map<number, number>();
    for (const g of graded) {
      const id = g.test_taker_id;
      pointsByTaker.set(id, (pointsByTaker.get(id) || 0) + (g.points || 0));
    }

    // 4) merge them
    return metrics.map((m) => ({
      ...m,
      totalPoints: pointsByTaker.get(m.test_taker_id) ?? 0,
    }));
  }

  onMount(async () => {
    loading = true;

    // 1) Pull in our enriched taker info
    metrics = await fetchCheatMetrics(event_id, test_id);
    loading = false;
  });
</script>

{#if loading}
  <div class="flex justify-center p-8">Loading…</div>
{:else}
  <CheatingMetricsTable {metrics} {event_id} event_name="Test Metrics" />
{/if}
