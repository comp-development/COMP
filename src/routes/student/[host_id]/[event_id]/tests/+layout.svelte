<script lang="ts">
  import { getEventInformation, getStudentEvent } from "$lib/supabase";
  import { page } from "$app/stores";
  import Loading from "$lib/components/Loading.svelte";
  import { user } from "$lib/sessionStore";
  import { handleError } from "$lib/handleError";

  const host_id = parseInt($page.params.host_id);
  const event_id = parseInt($page.params.event_id);

  let event_details: any = null;
  let student_event: any = null;
  let loading = $state(true);

  (async () => {
    try {
      event_details = await getEventInformation(event_id);
      student_event = await getStudentEvent($user?.id, event_id);

      if (
        !(
          !event_details.waivers.requireWaivers ||
          event_details.waivers.type == "none" ||
          student_event.waiver
        )
      ) {
        document.location.href = `/student/${host_id}/${event_id}`;
      }
    } catch (e) {
      handleError(e);
    }

    loading = false;
  })();
</script>

{#if loading}
  <Loading />
{:else}
  <slot />
{/if}
