<script>
  import Loading from "$lib/components/Loading.svelte";
  import MarkdownRenderForm from "$lib/components/MarkdownRenderForm.svelte";
  import {
    getEventInformation,
    getHostInformation,
    getStudentEvent,
    updateStudentEvent,
  } from "$lib/supabase";
  import { page } from "$app/stores";
  import { handleError } from "$lib/handleError";
  import { user } from "$lib/sessionStore";
  import { uploadWaiver } from "$lib/supabase/bucket";
  import toast from "$lib/toast.svelte";

  let event = $state();
  let host = $state();
  let student_event = $state();

  let logo = $state();
  let loading = $state(true);
  let newResponses = $state({});

  const event_id = parseInt($page.params.event_id);
  const host_id = parseInt($page.params.host_id);

  async function handleSubmit(pdf) {
    try {
      const fileUrl = await uploadWaiver(
        pdf,
        event_id,
        student_event.front_id +
          "_" +
          student_event.student.first_name +
          "_" +
          student_event.student.last_name,
      );

      await updateStudentEvent(student_event.student_event_id, {
        waiver: fileUrl,
      });

      toast.success("Waiver submitted successfully");
      document.location.href = `/student/${host_id}/${event_id}`;
    } catch (e) {
      handleError(e);
    }
  }

  (async () => {
    event = await getEventInformation(event_id);
    host = await getHostInformation(host_id);
    student_event = await getStudentEvent($user.id, event_id);

    if (student_event.waiver) {
      toast.success("Waiver is already completed");
      document.location.href = `/student/${host_id}/${event_id}`;
      return;
    }

    logo = event.logo ?? host.logo;
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
      {logo}
      {handleSubmit}
    />
  </div>
{/if}
