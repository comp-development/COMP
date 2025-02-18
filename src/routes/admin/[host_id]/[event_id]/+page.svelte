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
  import { Button, Modal, TabItem, Tabs } from "flowbite-svelte";
  import StudentForm from "$lib/components/StudentForm.svelte";

  let hostId = Number($page.params.host_id);
  let eventId = Number($page.params.event_id);
  let teams = $state([]);
  let students = $state([]);
  let host = $state([]);
  let event_information = $state({});
  let loading = $state(true);
  let organizations = $state([]);
  let independentTeams = $state([]);
  let selectedTab = $state("student");

  let isEditModalOpen = $state(false);
  let letEditableStudent = $state(null);

  async function loadInformation() {
    try {
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
  <EventDisplay
    id={eventId}
    name={event_information.event_name}
    date={event_information.event_date}
    logo={event_information.logo != "" ? event_information.logo : host.logo}
    email={event_information.email ?? host.email}
    markdown={event_information.summary}
    editable={true}
  />

  <Tabs tabStyle="pill">
    <TabItem
      open={selectedTab === "student"}
      title="Student"
      on:click={() => (selectedTab = "student")}
    >
      <div>
        <h2 class="text-2xl font-bold mb-4">Registered Students</h2>
        <div class="tableMax">
          <TableName
            actionType="edit"
            items={students}
            action={(e, student) => {
              letEditableStudent = student;
              isEditModalOpen = true;
            }}
          />
        </div>
        {#if students.length === 0}
          <p class="text-center text-gray-500 mt-4">
            No students registered yet
          </p>
        {/if}
      </div>
    </TabItem>
    <TabItem
      open={selectedTab === "teams"}
      title="Teams"
      on:click={() => (selectedTab = "teams")}
    >
      <div>
        <h2 class="text-2xl font-bold mb-4">Independent Teams</h2>
        <!-- <Button pill href={`/admin/${hostId}/${eventId}/team`}
          >Create Team</Button
        > -->
        <div class="tableMax">
          <TableName
            actionType="edit"
            items={independentTeams}
            action={(e, team) => {
              window.location.href = `/admin/${hostId}/${eventId}/team/${team.team_id}`;
            }}
            columns={[
              {
                label: "Name",
                value: (item) => item.team_name,
                sortable: true,
              },
              {
                label: "Front ID",
                value: (item) => item.front_id,
                sortable: true,
              },
              {
                label: "Join Code",
                value: (item) => item.join_code,
                sortable: true,
              },
            ]}
          />
        </div>
        {#if teams.length === 0}
          <p class="text-center text-gray-500 mt-4">
            No independent teams registered yet
          </p>
        {/if}
      </div>
    </TabItem>
    <TabItem
      open={selectedTab === "orgs"}
      title="Organizations"
      on:click={() => (selectedTab = "orgs")}
    >
      <div>
        <h2 class="text-2xl font-bold mb-4">Registered Organizations</h2>
        <div class="tableMax">
          <TableName
            actionType="edit"
            items={organizations}
            action={(e, org) => {
              window.location.href = `/admin/${hostId}/${eventId}/org/${org.org_id}`;
            }}
            columns={[
              {
                label: "Name",
                value: (item) => item.org.name,
                sortable: true,
              },
              {
                label: "Address",
                value: (item) => item.org.address,
                sortable: true,
              },
              {
                label: "Join Code",
                value: (item) => item.join_code,
                sortable: true,
              },
            ]}
          />
        </div>
        {#if organizations.length === 0}
          <p class="text-center text-gray-500 mt-4">
            No organizations registered yet
          </p>
        {/if}
      </div>
    </TabItem>
  </Tabs>
{/if}

<div class="modalExterior">
  <Modal bind:open={isEditModalOpen} size="md" autoclose={true}>
    <h3 class="text-xl font-medium text-gray-900 dark:text-white">
      Edit Student
    </h3>
    <StudentForm
      title=""
      student_event={letEditableStudent}
      user={letEditableStudent.person}
      event_id={eventId}
    />
  </Modal>
</div>

<style>
  .tableMax {
    max-width: 800px;
    margin: 0 auto;
  }

  :global([role="tabpanel"]) {
    background-color: transparent;
  }
</style>
