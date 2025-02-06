<script lang="ts">
  import { page } from "$app/stores";
  import { Button, Badge, Tabs, TabItem} from "flowbite-svelte";
  import StudentForm from "$lib/components/StudentForm.svelte";
  import TeamForm from "$lib/components/TeamForm.svelte";
  import Loading from "$lib/components/Loading.svelte";
  import { user } from "$lib/sessionStore";
  import {
    getEventInformation,
    getStudentEvent,
    getStudentTicketOrder,
    updateStudentTeam,
    getOrgEventByJoinCode,
    getTeamByJoinCode,
    type StudentEvent,
    getStudent,
    updateStudentOrgEvent
  } from "$lib/supabase";
  import type { Tables } from "../../../../db/database.types";
  import { supabase, type Get } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";

  const event_id = parseInt($page.params.event_id);
  let student_event: StudentEvent = $state(null);
  let event_details: Tables<"events"> | null = $state(null);
  import CustomForm from "$lib/components/CustomForm.svelte";
  let team: Get<StudentEvent, "team"> | undefined = $state(null);
  let org_event: Get<StudentEvent, "org_event"> | undefined = $state(null);
  let ticket_order: Tables<"ticket_orders"> | null = null;
  let transaction_stored = $state(false);
  let loading = $state(true);
  let student = $state(null);
  let purchase_ticket = $state(true);
  let teamJoinFormResponses = $state({});
  let teamJoinFormErrors = $state({});
  let orgJoinFormResponses = $state({});
  let orgJoinFormErrors = $state({});
  let selectedOption = $state("join_org");

  const afterTeamSubmit = async () => {
    await updateStudentTeam(student_event.student_event_id, team.team_id, team.org_id);
    student_event.team = team;
  }

  const teamJoinSubmit = async (event: Event) => {
    try {
      team = await getTeamByJoinCode(event_id, teamJoinFormResponses.team_join_code.toUpperCase());
    } catch (error) {
      if (error.code === "PGRST116") {
        teamJoinFormErrors["team_join_code"] = "No team with code";
        return
      } else {
        error.message = `Error getting team: ${error.message}`
        handleError(error);
      }
    }
    console.log("team", team)
    if (team) {
      await updateStudentTeam(student_event.student_event_id, team.team_id, team.org_id);
      student_event.team = team;
    } else {
      throw new Error("An unknown error has occurred. Please email the tournament organizers.");
    }
  }

  const orgJoinSubmit = async (event: Event) => {
    try {
      org_event = await getOrgEventByJoinCode(event_id, orgJoinFormResponses.org_join_code.toUpperCase());
    } catch (error) {
      if (error.code === "PGRST116") {
        orgJoinFormErrors["org_join_code"] = "No organization with code";
        return
      } else {
        error.message = `Error getting org: ${error.message}`
        handleError(error);
      }
    }
    if (org_event) {
      await updateStudentOrgEvent(student_event.student_event_id, org_event.org_id);
      student_event.team = team;
    } else {
      throw new Error("An unknown error has occurred. Please email the tournament organizers.");
    }

  }

  (async () => {
    // const a = (b: any) => b + 1;
    // debug_log("bonjour", a(3), {woah: "no shot"});

    // Check if this student is registered in this event.
    console.log("user3", $user)
    student = await getStudent($user!.id);
    student = {...student, ...$user}
    student_event = await getStudentEvent($user!.id, event_id);
    console.log("student_event", student_event);
    ticket_order = await getStudentTicketOrder($user!.id, event_id);
    console.log($user!.id)
    console.log("Ticket order", ticket_order)
    transaction_stored = ticket_order != null;


    team = student_event?.team;
    org_event = student_event?.org_event;
    // Sort team members by front_id (alphabetical descending).
    /**
    team?.student_events.sort((a, b) => {
      const aValues = [a?.front_id ?? "", a?.students?.first_name ?? "", a?.students?.last_name ?? ""];
      const bValues = [b?.front_id ?? "", b?.students?.first_name ?? "", b?.students?.last_name ?? ""];
      return aValues < bValues ? 1 : -1;
    });
    */

    console.log("student_event", student_event);
    event_details = await getEventInformation(event_id);

    const { data, error } = await supabase.auth.getSession();
    if (error != null) {
      handleError(error);
    }

    loading = false;
  })();
</script>

{#if loading}
  <Loading />
{:else}
  <br />
  <h1>{event_details?.event_name}</h1>
  <h2 style="font-weight: 500">{event_details?.event_date}</h2>
  Add something about cost per student Here
  {#if !student_event}
    {#if transaction_stored}
      <p>
        Payment found, but registration is not complete. Please fill out the
        following form to proceed.
      </p>
      <br />
    {/if}
    <StudentForm bind:student_event={student_event} userType="student" user={student} event_id={event_id} />
  

  <!-- Additional conditions for team and org information -->
  {:else if team != null}
    <br />
    <p style="text-align: center;">
      Welcome to this tournament! Below is the information for the team you are
      registered in. If there is an issue, update the team information on
      ContestDojo or email <a href="mailto:tournament@mustangmath.com"
        >tournament@mustangmath.com</a
      >
    </p>
    <br />
    <div class="flex">
      <Button href={`/student/${$page.params.host_id}/${$page.params.event_id}/tests`} pill>Take Tests</Button>
    </div>
    <br />

    <div class="team_info">
      <p style="font-weight: bold; font-size: 20px; align-items: left">
        {team?.team_name}
      </p>

      {#each team?.student_events_detailed ?? [] as teamMember}
        <div style="display: flex; align-items: center;">
          {#if teamMember.front_id}
            <Badge color={teamMember.student_id == $user?.id ? "green" : "dark"}
              >{teamMember.front_id}</Badge
            >
          {/if}
          <div style="display:flex">
            <p>
              {teamMember.first_name}
              {teamMember.last_name}
            </p>
            <p style="margin-left: 10px">
              <em>{teamMember.email}</em>
            </p>
          </div>
        </div>
      {/each}
    </div>
  {:else if org_event != null}
    <p>Not yet assigned team by org. Contact your organization coach if you believe this is in error.</p>
  {:else}
    <div class="registrationForm">
      <Tabs tabStyle="pill">
        <TabItem
          on:click={() => (selectedOption = "join_org")}
          open={selectedOption === "join_org"}
          title="Join Organization"
        >
          <h2>Join Organization</h2>
          <p>Get your organization join code from your organization's coach.</p>
          <CustomForm fields={[
            {
              event_custom_field_id: "org_join_code",
              key: "org_join_code",
              label: "Organization Join Code",
              required: true,
              regex: /^[A-Za-z0-9]{6}$/,
              placeholder: "ABC123",
              value: null,
              choices: null,
              editable: true,
              hidden: false
            }
          ]} custom_fields={[]} bind:newResponses={orgJoinFormResponses} bind:validationErrors={orgJoinFormErrors} handleSubmit={orgJoinSubmit}/>
        </TabItem>
        <TabItem
          on:click={() => (selectedOption = "join_team")}
          open={selectedOption === "join_team"}
          title="Join Team"
        >
          <h2>Join Team</h2>
          <p>Get the code from your coach if you're a part of an org, or an already registered team member for independent teams.</p>
          <CustomForm fields={[
            {
              event_custom_field_id: "team_join_code",
              key: "team_join_code",
              label: "Team Join Code",
              required: true,
              regex: /^[A-Za-z0-9]{6}$/,
              placeholder: "ABC123",
              value: null,
              choices: null,
              editable: true,
              hidden: false
            }
          ]} custom_fields={[]} bind:newResponses={teamJoinFormResponses} bind:validationErrors={teamJoinFormErrors} handleSubmit={teamJoinSubmit}/>
        </TabItem>
        <TabItem
          on:click={() => (selectedOption = "create_team")}
          open={selectedOption === "create_team"}
          title="Create Independent Team"
        >
          <TeamForm bind:team={team} title="Create Independent Team" userType="student" user={student} event_id={event_id} afterSubmit={afterTeamSubmit} />
        </TabItem>
      </Tabs>
      <br />
    </div>
  {/if}
  {#if org_event != null}
    <!-- TODO: org info -->
    {#if !purchase_ticket}
      <button onclick={purchase_ticket({})}
        >Purchase Individual Ticket (check with your organization if you need to
        do so)</button
      >
    {/if}
  {/if}
{/if}

<style>
  h1 {
    text-align: center;
  }

  .team_info {
    padding: 10px;
    margin: 20px;
    border: 2px solid var(--primary-light);
    border-radius: 10px;
  }

  

  form {
    border: 3px solid var(--primary-tint);
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    border-radius: 20px;
  }
</style>
