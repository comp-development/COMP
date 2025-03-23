<script lang="ts">
  import { page } from "$app/stores";
  import {
    getEventInformation,
    getEventTeams,
    getEventOrganizations,
    getEventIndependentTeams,
    getEventStudents,
    getHostInformation,
  } from "$lib/supabase";
  import { handleError } from "$lib/handleError";
  import Loading from "$lib/components/Loading.svelte";
  import EventDisplay from "$lib/components/EventDisplay.svelte";
  import TableName from "$lib/components/TableName.svelte";
  import { Button, Modal, TabItem, Tabs, Badge } from "flowbite-svelte";
  import StudentForm from "$lib/components/StudentForm.svelte";
  import EventRegistrationsTable from "$lib/components/EventRegistrationsTable.svelte";
  let hostId = Number($page.params.host_id);
  let eventId = Number($page.params.event_id);
  let teams: Tables<"teams">[] = $state([]);
  let students: StudentEventWithPerson[] = $state([]);
  let host: Tables<"hosts"> = $state({
    email: null,
    host_id: 0,
    host_name: "",
    logo: null,
    styles: null,
    summary: null,
  });
  let event_information: Tables<"events"> = $state({} as Tables<"events">);
  let loading = $state(true);
  let organizations: (Tables<"org_events"> & {
    org?: Tables<"orgs"> & {
      ticket_orders?: Tables<"ticket_orders">[];
    };
  })[] = $state([]);
  let independentTeams: Tables<"teams">[] = $state([]);
  let selectedTab = $state("student");

  let isEditModalOpen = $state(false);
  let letEditableStudent = $state<StudentEventWithPerson | null>(null);

  async function loadInformation() {
    try {
      const fetchedTeams = await getEventTeams(eventId);
      teams = fetchedTeams.map(team => ({
        ...team,
        team_id: team.team_id,
      }));
      host = await getHostInformation(hostId);
      event_information = await getEventInformation(eventId);
      organizations = await getEventOrganizations(eventId);
      students = await getEventStudents(eventId);
      independentTeams = await getEventIndependentTeams(eventId);

      loading = false;
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error(String(error)));
      }
    }
  }

  loadInformation();
</script>

{#if loading}
  <Loading />
{:else}
  <EventDisplay
    id={eventId}
    host={host}
    event={event_information}
    editable={true}
  />

  <hr>
  <div class="flex justify-end mb-4 mt-4">
    <Button
      color="red"
      pill
      href={`/admin/${hostId}/${eventId}/refund-requests`}
    >
      View Refund Requests
      {#if organizations.some(org => org.org?.ticket_orders?.some(order => order.refund_status === "REQUESTED"))}
        <Badge color="red" class="ml-2">!</Badge>
      {/if}
    </Button>
  </div>

  <div class="mt-4">
    <EventRegistrationsTable event_id={eventId} host_id={hostId} event_name={event_information.event_name} />
  </div>
{/if}

<div class="modalExterior">
  <Modal bind:open={isEditModalOpen} size="md" autoclose={true}>
    <div class="specificModalMax">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">
        Edit Student
      </h3>
      <StudentForm
        title=""
        student_event={letEditableStudent}
        user={letEditableStudent.person}
        event_id={eventId}
      />
    </div>
  </Modal>
</div>

<style>
  .tableMax {
    max-width: 800px;
    margin: 0 auto;
  }

  .specificModalMax {
    max-height: 500px;
  }

  :global([role="tabpanel"]) {
    background-color: transparent !important;
  }
</style>
