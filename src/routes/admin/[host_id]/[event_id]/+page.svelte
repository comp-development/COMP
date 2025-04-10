<script lang="ts">
  import { page } from "$app/stores";
  import {
    getEventInformation,
    getEventTeams,
    getEventOrganizations,
    getEventIndependentTeams,
    getEventStudents,
    getHostInformation,
    getAdminHosts,
  } from "$lib/supabase";
  import { handleError } from "$lib/handleError";
  import Loading from "$lib/components/Loading.svelte";
  import EventDisplay from "$lib/components/EventDisplay.svelte";
  import TableName from "$lib/components/TableName.svelte";
  import { Button, Modal, TabItem, Tabs } from "flowbite-svelte";
  import StudentForm from "$lib/components/StudentForm.svelte";
  import EventRegistrationsTable from "$lib/components/EventRegistrationsTable.svelte";
  import { user } from "$lib/sessionStore";
  import { type Tables } from "../../../../../db/database.types";
  let hostId = Number($page.params.host_id);
  let eventId = Number($page.params.event_id);
  let teams = $state([]);
  let students = $state([]);
  let host = $state([]);
  let admin: null | (Tables<"hosts"> & {host_admins: Tables<"host_admins">[]}) = $state(null);
  let event_information = $state({});
  let loading = $state(true);
  let organizations = $state([]);
  let independentTeams = $state([]);
  let selectedTab = $state("student");

  let isEditModalOpen = $state(false);
  let letEditableStudent = $state(null);

  async function loadInformation() {
    try {
      admin = (await getAdminHosts($user!.id)).find(ha => ha.host_id == hostId)!;
      teams = await getEventTeams(eventId);
      host = await getHostInformation(hostId);
      teams = teams.map(({ team_id: id, ...rest }) => ({ id, ...rest }));
      event_information = await getEventInformation(eventId);
      organizations = await getEventOrganizations(eventId);
      students = await getEventStudents(eventId);
      independentTeams = await getEventIndependentTeams(eventId);

      loading = false;
    } catch (error) {
      handleError(error);
    }
  }

  loadInformation();
</script>

{#if loading}
  <Loading />
{:else}
  <EventDisplay id={eventId} {host} event={event_information} editable={ admin?.host_admins.find(ha => ha.host_id == hostId)?.owner } />

  <hr />

  <div class="mt-4">
    <EventRegistrationsTable
      event_id={eventId}
      host_id={hostId}
      event_name={event_information.event_name}
    />
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
