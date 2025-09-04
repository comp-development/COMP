<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { user } from "$lib/sessionStore";
  import UploadedResultsTable from '$lib/components/UploadedResultsTable.svelte';
  import {
    supabase,
    type AsyncReturnType,
    type Get,
  } from "$lib/supabaseClient";
  import {
    getEventInformation,
    getStudentEvent,
    getStudentAvailableTickets,
    getStudentTicketOrder,
    updateStudentTeam,
    getOrgEventByJoinCode,
    getHostInformation,
    type StudentEvent,
    getStudent,
    updateStudentOrgEvent,
    type Student,
    getStudentTotalTickets,
    getUploadedResults,
  } from "$lib/supabase";

  const event_id = parseInt($page.params.event_id);
  
  let team: Get<StudentEvent, "team"> | undefined = $state(null);
  let org_event: Get<StudentEvent, "org_event"> | undefined = $state(null);
  let student: Student = $state(null);
  let student_event: StudentEvent = $state(null);
  let uploaded_results: AsyncReturnType<typeof getUploadedResults> | null = $state(null)
  let event_details: AsyncReturnType<typeof getEventInformation> | null = $state(null) 


  function toGoogleDriveDownloadLink(
      googleDriveLink: string
      ){
    //Basically turns a google drive view file link to an automatic download link
    let pattern = /\/file\/d\/(.+)\//;
    let googleDriveIdMatches = googleDriveLink.match(pattern);
    console.log("googleDriveIdMatches", googleDriveIdMatches);
    if (googleDriveIdMatches === null) return googleDriveLink;
    let googleDriveId = googleDriveIdMatches[1]
      return `https://drive.google.com/uc?export=download&id=${googleDriveId}`

  }
  (async () => {
    // Check if this student is registered in this event.
    // NOTE: only student accounts can view this page (because of the student/layout.svelte)
    // Therefore, getStudent always returns non-null.
    student = await getStudent($user!.id)!;
    student_event = await getStudentEvent($user!.id, event_id);
    uploaded_results = await getUploadedResults(student_event.student_event_id);
    team = student_event?.team;
    org_event = student_event?.org_event;
    event_details = await getEventInformation(event_id);
    console.log("Results Visible", event_details.results_visible);

  })();


    
  



</script>


{#if !event_details?.results_visible}
  <div class="container mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-md p-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">Results Unavailable</h1>
          <p class="text-gray-600">
              Results are not available yet
          </p>
      </div>
  </div>
{:else}
  <UploadedResultsTable
    student_event_ids = { [student_event.student_event_id] }
  />

{/if}

  <!-->
                <Button
                  href = {toGoogleDriveDownloadLink(uploaded_results.report_link)}
                  pill>Download Score Report</Button
                >
  </!-->
