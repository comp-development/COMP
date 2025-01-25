<script lang="ts">
  import { page } from "$app/stores";
  import { Button, Badge } from "flowbite-svelte";
  import Registration from "$lib/components/Registration.svelte";
  import Loading from "$lib/components/Loading.svelte";
  import { user } from "$lib/sessionStore";
  import {
    getEventInformation,
    getStudentEvent,
    getStudentTicketOrder,
    type StudentEvent,
    getStudent,
  } from "$lib/supabase";
  import type { Tables } from "../../../../db/database.types";
  import { supabase, type Get } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";

  const event_id = parseInt($page.params.event_id);
  let student_event: StudentEvent = null;
  let event_details: Tables<"events"> | null = $state(null);
  
  let team: Get<StudentEvent, "teams"> = $state(null);
  let ticket_order: Tables<"ticket_orders"> | null = null;
  let in_team = $state(false);
  let in_org = $state(false);
  let transaction_stored = $state(false);
  let loading = $state(true);
  let student = $state(null);

  (async () => {
    // Check if this student is registered in this event.
    student_event = await getStudentEvent($user!.id, event_id);
    console.log("student_event", student_event);
    ticket_order = await getStudentTicketOrder($user!.id, event_id);
    in_team = student_event?.teams != null;
    in_org = student_event?.org_events != null;
    console.log($user!.id)
    console.log("Ticket order", ticket_order)
    transaction_stored = ticket_order != null;

    team = student_event?.teams;
    // Sort team members by front_id (alphabetical descending).
    team?.student_events.sort((a, b) => {
      const aValues = [a?.front_id ?? "", a?.students?.first_name ?? "", a?.students?.last_name ?? ""];
      const bValues = [b?.front_id ?? "", b?.students?.first_name ?? "", b?.students?.last_name ?? ""];
      return aValues < bValues ? 1 : -1;
    });

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

  {#if !in_org && !in_team}
    {#if transaction_stored}
      <p>
        Payment found, but registration is not complete. Please fill out the
        following form to proceed.
      </p>
      <br />
    {/if}
    <Registration userType="student" user={student} event_id={event_id} />
  {/if}

  <!-- Additional conditions for team and org information -->
  {#if in_team}
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
      <Button href={"/student/" + event_id + "/tests"} pill>Take Tests</Button>
    </div>
    <br />

    <div class="team_info">
      <p style="font-weight: bold; font-size: 20px; align-items: left">
        {team?.team_name}
      </p>
      {#if team?.division}<p>{team?.division} Division</p>{/if}

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
  {:else if in_org}
    <p>Not yet assigned team by org</p>
  {/if}
  {#if in_org}
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

  .registrationForm {
    padding: 30px;
  }

  form {
    border: 3px solid var(--primary-tint);
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    border-radius: 20px;
  }
</style>
