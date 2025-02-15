<script lang="ts">
  import TournamentForm from "$lib/components/TournamentForm.svelte";
  import { createEvent } from "$lib/supabase/events";
  import { page } from "$app/stores";
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";

  let newResponses = $state({});
  let validationErrors = $state({});

  const host_id = parseInt($page.params.host_id);

  async function handleSubmit() {
    try {
      const data = await createEvent({
        ...newResponses,
        host_id: host_id,
      });

      toast.success("Tournament created successfully!");
      window.location.href = `/admin/${host_id}/${data.event_id}`;
    } catch (error) {
      handleError(error);
    }
  }
</script>

<div class="container mx-auto p-4">
  <h1>Create Tournament</h1>
  <TournamentForm bind:newResponses bind:validationErrors {handleSubmit} />
</div>
