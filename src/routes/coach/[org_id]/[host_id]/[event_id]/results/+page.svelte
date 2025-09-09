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
    getCoachOrganization,
    getStudent,
    updateStudentOrgEvent,
    getStudentTotalTickets,
    getCoach,
    getUploadedResults,
    type Student,
    type StudentEvent,
  } from "$lib/supabase";

  const event_id = parseInt($page.params.event_id);
  const org_id = parseInt($page.params.org_id);
  
  let team: Get<StudentEvent, "team"> | undefined = $state(null);
  let org_event: Get<StudentEvent, "org_event"> | undefined = $state(null);
  let student: Student = $state(null);
  let student_event: StudentEvent = $state(null);
  let coach: any = $state();
  let uploaded_results: AsyncReturnType<typeof getUploadedResults> | null = $state(null);
  let event_details: AsyncReturnType<typeof getEventInformation> | null = $state(null);
  let organizationDetails: any = $state(null);
  let studentEventIds: number[] = $state([]);

  (async () => {
    event_details = await getEventInformation(event_id);

    coach = await getCoach($user!.id);
    organizationDetails = await getCoachOrganization(
      coach.coach_id,
      event_id,
      org_id,
    );

    const teams : any[] = organizationDetails?.teams ?? [];  
    
    for (const team of teams){
      for (const team_member of team.teamMembers){
        studentEventIds.push(team_member.student_event_id);
      }

    }
    uploaded_results = await getUploadedResults(studentEventIds);
    console.log("Student Event Ids", studentEventIds);
    

    console.log("Results Visible", event_details?.results_visible);
    console.log("Uploaded Results", uploaded_results);

  })();


    
  



</script>


{#if !event_details?.results_visible || uploaded_results === null}
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
    student_event_ids = { studentEventIds }
    user_type = "coach"
  />

{/if}
