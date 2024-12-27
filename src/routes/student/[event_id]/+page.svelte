<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/Button.svelte";
  import { user } from "$lib/sessionStore";
  import {
    getEventInformation,
    getStudentEvent,
    getTeam,
    getThisUser,
    getUser,
  } from "$lib/supabase";
  import { Tag } from "carbon-components-svelte";
  import type { Tables } from "../../../../db/database.types";

  const event_id = parseInt($page.params.event_id);
  let student_event_details:
    | (Tables<"student_events_detailed"> & {
        teams: Tables<"teams"> & {
          student_events_detailed: Tables<"student_events_detailed">[];
        };
      })
    | null = null;
  let team:
    | (Tables<"teams"> & {
        student_events_detailed: Tables<"student_events_detailed">[];
      })
    | undefined
    | null = null;
  let registered = true;
  let loading = true;
  let event_details: Tables<"events"> | null = null;

  (async () => {
    // Check if this student is registered in this event.
    student_event_details = await getStudentEvent($user!.id, event_id);

    team = student_event_details?.teams;
    console.log($user!.id, event_id);
    console.log("student_event_details", student_event_details);
    event_details = await getEventInformation(event_id);
    // team = await getTeam(student_event_details.team_id);
    // console.log(team);
    // team = student_event_details?.
    loading = false;
  })();
</script>

{#if loading}
  <p>Loading...</p>
{:else}
  <br />
  <h1>{event_details?.event_name}</h1>
  <!-- choice: create team, join a team (code), join an org (code) -->
  <!-- check code valid => redirect to stripe => redirect back => verify stripe paid and code valid => add to student_events -->
  {#if !student_event_details}
    <br />
  {:else}
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
      <Button title="Take Tests" href={"/student/" + event_id + "/tests"} />
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
            <Tag type={teamMember.student_id == $user?.id ? "green" : "gray"}
              >{teamMember.front_id}</Tag
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
</style>
