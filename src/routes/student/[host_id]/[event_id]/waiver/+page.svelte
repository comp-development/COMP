<script>
  import Loading from "$lib/components/Loading.svelte";
  import MarkdownRenderForm from "$lib/components/MarkdownRenderForm.svelte";
  import { getEventInformation } from "$lib/supabase";
  import { page } from "$app/stores";
  import { handleError } from "$lib/handleError";

  let event = $state();
  let loading = $state(true);
  let newResponses = $state({});
  const event_id = parseInt($page.params.event_id);

  function handleSubmit(pdf) {
    try {
      // To be implemented -> save to supabase
    } catch (e) {
      handleError(e);
    }
  }

  (async () => {
    event = await getEventInformation(event_id);
    loading = false;
  })();
</script>

{#if loading}
  <Loading />
{:else}
  <h1>Waiver</h1>
  <div class="pt-4" style="width: 900px; margin: 0 auto;">
    <MarkdownRenderForm
      source={event.waivers?.waiver}
      bind:newResponses
      {handleSubmit}
    />
  </div>
{/if}
