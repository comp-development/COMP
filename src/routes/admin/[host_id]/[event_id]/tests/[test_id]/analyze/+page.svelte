<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import CheatingMetricsTable from '$lib/components/CheatingMetricsTable.svelte';
    import {
      fetchAllTakerInfo,
      fetchTestAnswers,
      fetchPasteEvents,
      calculateAllCheatMetrics
    } from '$lib/supabase/cheating';
  
    let test_id  = 0;
    let event_id = 0;
    $: test_id  = Number($page.params.test_id);
    $: event_id = Number($page.params.event_id);
  
    let metrics = [];
    let loading = true;
  
    onMount(async () => {
      loading = true;
  
      // 1) Pull in our enriched taker info
      const takerInfo = await fetchAllTakerInfo(event_id, test_id);
  
      // 2) Grab answers & paste events
      const takerIds = takerInfo.map(t => t.test_taker_id);
      const [answers, pasteEvents] = await Promise.all([
        fetchTestAnswers(takerIds),
        fetchPasteEvents(takerIds)
      ]);
  
      // 3) Compute your seven cheating metrics
      metrics = calculateAllCheatMetrics(
        takerInfo,
        answers,
        pasteEvents,
        event_id
      );
  
      loading = false;
    });
  </script>
  
  {#if loading}
    <div class="flex justify-center p-8">Loading…</div>
  {:else}
    <CheatingMetricsTable
      {metrics}
      event_id={event_id}
      event_name="Test Metrics"
    />
  {/if}
  