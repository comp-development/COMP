<script lang="ts">
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

  interface Event {
    event_id: number;
    event_name: string;
    logo?: string;
    waivers?: {
      type: string;
      waiver?: string;
      requireWaivers?: boolean;
    };
    [key: string]: any;
  }

  interface Host {
    host_id: number;
    host_name: string;
    logo?: string;
    [key: string]: any;
  }

  interface StudentEvent {
    student_event_id: number;
    student_id: string;
    waiver?: string;
    student: {
      first_name: string;
      last_name: string;
      [key: string]: any;
    };
    [key: string]: any;
  }

  let event = $state<Event | null>(null);
  let host = $state<Host | null>(null);
  let student_event = $state<StudentEvent | null>(null);

  let logo = $state<string | null>(null);
  let loading = $state(true);
  let newResponses = $state({});

  const event_id = parseInt($page.params.event_id);
  const host_id = parseInt($page.params.host_id);

  async function handleSubmit(pdf: Blob) {
    try {
      if (!student_event) return;
      
      console.log("UPLOADING WAIVER");
      console.log(student_event.student_id);
      const fileUrl = await uploadWaiver(
        pdf,
        event_id,
        student_event.student_id +
          "_" +
          student_event.student.first_name +
          "_" +
          student_event.student.last_name + 
          "_" + 
          new Date().toISOString(),
      );
      console.log("UPDATING STUDENT EVENT");
      await updateStudentEvent(student_event.student_event_id, {
        waiver: fileUrl,
      });
      console.log("SUCCESS");
      toast.success("Waiver submitted successfully");
      document.location.href = `/student/${host_id}/${event_id}`;
    } catch (e: unknown) {
      handleError(e as Error);
    }
  }

  (async () => {
    event = await getEventInformation(event_id);
    host = await getHostInformation(host_id);
    if (!$user) {
      toast.error("You must be logged in to view this page");
      document.location.href = "/login";
      return;
    }
    student_event = await getStudentEvent($user.id, event_id);

    if (!event?.waivers || event.waivers.type != "comp" || student_event?.waiver) {
      toast.success("Waiver is already completed or should not be completed on COMP");
      document.location.href = `/student/${host_id}/${event_id}`;
      return;
    }

    logo = event.logo ?? host?.logo ?? null;
    loading = false;
  })();
</script>

{#if loading}
  <Loading />
{:else}
  <h1>Waiver</h1>
  <div class="pt-4" style="width: 900px; margin: 0 auto;">
    <MarkdownRenderForm
      source={event?.waivers?.waiver}
      bind:newResponses
      {logo}
      {handleSubmit}
    />
  </div>
{/if}
