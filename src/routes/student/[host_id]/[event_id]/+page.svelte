<script lang="ts">
  import { page } from "$app/stores";
  import { Button, Badge, Tabs, TabItem } from "flowbite-svelte";
  import StudentForm from "$lib/components/StudentForm.svelte";
  import TeamForm from "$lib/components/TeamForm.svelte";
  import Loading from "$lib/components/Loading.svelte";
  import { Alert } from "flowbite-svelte";
  import { InfoCircleSolid } from "flowbite-svelte-icons";
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
    updateStudentOrgEvent,
    type Student,
  } from "$lib/supabase";
  import type { Tables } from "../../../../../db/database.types";
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
  let student: Student = $state(null);
  let purchase_ticket = $state(true);
  let teamJoinFormResponses: any = $state({});
  let teamJoinFormErrors: any = $state({});
  let orgJoinFormResponses: any = $state({});
  let orgJoinFormErrors: any = $state({});
  let selectedOption: "join_org" | "join_team" | "create_team" = $state("join_org");

  const afterTeamSubmit = async () => {
    // If this callback is called, then the student must've been in the event => student_event is non-null.
    // Also, we assume the TeamForm component created a team => team is not null.
    await updateStudentTeam(
      student_event!.student_event_id,
      team!.team_id,
      team!.org_id,
    );
    student_event!.team = team!;
  };

  const teamJoinSubmit = async (_: Event) => {
    try {
      team = await getTeamByJoinCode(
        event_id,
        teamJoinFormResponses.team_join_code.toUpperCase(),
      );
    } catch (e) {
      const error = e as any;
      if (error.code === "PGRST116") {
        teamJoinFormErrors["team_join_code"] = "No team with code";
        return;
      } else {
        error.message = `Error getting team: ${error.message}`;
        handleError(error);
      }
    }
    console.log("team", team);
    if (team) {
      await updateStudentTeam(
        student_event!.student_event_id,
        team.team_id,
        team.org_id,
      );
      student_event!.team = team;
    } else {
      throw new Error(
        "An unknown error has occurred. Please email the tournament organizers.",
      );
    }
  };

  const orgJoinSubmit = async (_: Event) => {
    try {
      org_event = await getOrgEventByJoinCode(
        event_id,
        orgJoinFormResponses.org_join_code.toUpperCase(),
      );
    } catch (e) {
      const error: any = e;
      if (error.code === "PGRST116") {
        orgJoinFormErrors["org_join_code"] = "No organization with code";
        return;
      } else {
        error.message = `Error getting org: ${error.message}`;
        handleError(error);
      }
    }
    if (org_event) {
      await updateStudentOrgEvent(
        student_event!.student_event_id,
        org_event.org_id,
      );
      student_event!.org_event = org_event;
    } else {
      throw new Error(
        "An unknown error has occurred. Please email the tournament organizers.",
      );
    }
  };

  (async () => {
    // Check if this student is registered in this event.
    // NOTE: only student accounts can view this page (because of the student/layout.svelte)
    // Therefore, getStudent always returns non-null.
    student = await getStudent($user!.id)!;
    student_event = await getStudentEvent($user!.id, event_id);
    ticket_order = await getStudentTicketOrder($user!.id, event_id);
    transaction_stored = ticket_order != null;
    team = student_event?.team;
    org_event = student_event?.org_event;
    team?.student_event.sort((a, b) => {
      const aValues = [
        a?.front_id ?? "",
        a?.student?.first_name ?? "",
        a?.student?.last_name ?? "",
      ];
      const bValues = [
        b?.front_id ?? "",
        b?.student?.first_name ?? "",
        b?.student?.last_name ?? "",
      ];
      return aValues < bValues ? 1 : -1;
    });

    console.log("student_event", student_event);
    event_details = await getEventInformation(event_id);

    loading = false;
  })();
</script>

{#if loading}
  <Loading />
{:else}
  <br />
  <h1>{event_details?.event_name}</h1>
  <h2 style="font-weight: 500">{event_details?.event_date}</h2>
  <!-- Add something about cost per student Here -->
  {#if !student_event}
    {#if transaction_stored}
      <p>
        Payment found, but registration is not complete. Please fill out the
        following form to proceed.
      </p>
      <br />
    {/if}
  {/if}

  <!-- Additional conditions for team and org information -->
  {#if student_event}
    <!-- EESHA PLEASE HELP
     MAKE THIS PRETTIER
     MAKE IT MATCH THE WAY YOU SET UP ORGS
     IF !org_event, make it so the student can edit the team with a popup modal
     Thank you <3
    -->
    {#if team || org_event}
      <div class="team_info">
        <p style="font-weight: bold; font-size: 20px; align-items: left">
          {#if team?.front_id}
            <Badge color={"green"}>
              {team.front_id}
            </Badge>&nbsp
          {/if}
          {team?.team_name}
        </p>
        <p style="font-weight: bold; font-size: 16px; align-items: left">
          {#if org_event}
            {org_event.org.name}
          {:else}
            Join Code: {team?.join_code}
          {/if}
        </p>
        {#each team?.student_event ?? [] as teamMember}
          <!--EESHA PLEASE MAKE THIS PRETTIER I BEG YOU TYY-->
          <div style="display: flex; align-items: center;">
            {#if teamMember.front_id}
              <Badge
                color={teamMember.student_id == $user?.id ? "green" : "dark"}
                >{teamMember.front_id}</Badge
              >&nbsp
            {/if}
            <div style="display:flex">
              <p>
                {teamMember.student.first_name}
                {teamMember.student.last_name}
              </p>
              <!-- email field does not exist
              <p style="margin-left: 10px">
                <em>{teamMember.student.email}</em>
              </p>
              -->
            </div>
          </div>
        {/each}
        {#if !team}
          <Alert border color="red">
            <InfoCircleSolid slot="icon" class="w-5 h-5" />
            <span class="font-medium">Not assigned to a team!</span>
            You cannot take tests until you are assigned to a team - reach out to
            your coach if you believe this is in error.
          </Alert>
        {:else}
          <div class="flex">
            <Button
              href={`/student/${$page.params.host_id}/${$page.params.event_id}/tests`}
              pill>Take Tests</Button
            >
          </div>
        {/if}
      </div>
    {:else}
      <div class="registrationForm">
        <Tabs tabStyle="pill">
          <TabItem
            on:click={() => (selectedOption = "join_org")}
            open={selectedOption === "join_org"}
            title="Join Organization"
          >
            <h2>Join Organization</h2>
            <p>
              Get your organization join code from your organization's coach.
            </p>
            <CustomForm
              fields={[
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
                  hidden: false,
                },
              ]}
              custom_fields={[]}
              bind:newResponses={orgJoinFormResponses}
              bind:validationErrors={orgJoinFormErrors}
              handleSubmit={orgJoinSubmit}
            />
          </TabItem>
          <TabItem
            on:click={() => (selectedOption = "join_team")}
            open={selectedOption === "join_team"}
            title="Join Team"
          >
            <h2>Join Team</h2>
            <p>
              Get the code from your coach if you're a part of an org, or an
              already registered team member for independent teams.
            </p>
            <CustomForm
              fields={[
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
                  hidden: false,
                },
              ]}
              custom_fields={[]}
              bind:newResponses={teamJoinFormResponses}
              bind:validationErrors={teamJoinFormErrors}
              handleSubmit={teamJoinSubmit}
            />
          </TabItem>
          <TabItem
            on:click={() => (selectedOption = "create_team")}
            open={selectedOption === "create_team"}
            title="Create Independent Team"
          >
            <div class="flex">
              <Button href={`/student/${$page.params.host_id}/${$page.params.event_id}/create-team`} pill>
                Create Team!
              </Button>
            </div>
          </TabItem>
        </Tabs>
        <br />
      </div>
    {/if}
    <!--
    {#if org_event != null}
      {#if !purchase_ticket}
        <button onclick={purchase_ticket({})}
          >Purchase Individual Ticket (check with your organization if you need to
          do so)</button
        >
      {/if}
    {/if}
    -->
  {/if}
  <StudentForm
    title={student_event ? "Update Information" : "Register"}
    bind:student_event
    user={{ ...student, ...$user }}
    {event_id}
  />
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
