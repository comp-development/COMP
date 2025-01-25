<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/Button.svelte";
  import { user } from "$lib/sessionStore";
  import {
    getEventInformation,
    getStudentEvent,
    getStudentTicketOrder,
    type StudentEvent,
  } from "$lib/supabase";
  import { Tag } from "carbon-components-svelte";
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
  let token: string | null = null;

  let input_team_join_code = $state("");
  let input_org_join_code = $state("");

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
    token = data.session?.access_token ?? null;

    loading = false;
  })();

  function purchase_ticket(options: {
    creating_team?: boolean;
    joining_team_code?: string;
  }) {
    return async () => {
      let body = {
        event_id,
        token,
        quantity: 1,
        creating_team: options.creating_team ?? false,
        joining_team_code: options.joining_team_code ?? null,
        is_coach: false,
      };
      const response = await fetch("/api/purchase-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      if (response.ok) {
        document.location.assign(text);
      } else {
        handleError(new Error(text));
      }
    };
  }

  async function join_org() {
    let body = {
      token,
      join_code: input_org_join_code,
    };
    const response = await fetch(`./${event_id}/join-org`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (response.ok) {
      document.location.reload();
    } else {
      handleError(new Error(text));
    }
  }

</script>

{#if loading}
  <p>Loading...</p>
{:else}
  <br />
  <h1>{event_details?.event_name}</h1>

  {#if !in_org && !in_team}
  	{#if !transaction_stored}
      <!-- default case -->
      <!-- TODO: custom fields -->
      <div class="grid-thirds">
        <div>
          <button onclick={purchase_ticket({creating_team: true})}>Create Independent Team</button>
        </div>
        <div>
          <form>
            <div>
              <label for="team-join-code">Team Join Code: </label>
              <input type="text" id="team-join-code" bind:value={input_team_join_code}/>
            </div>
            <br />
            <div>
              <button onclick={purchase_ticket({joining_team_code: input_org_join_code})}>Join Independent Team</button>
            </div>
          </form>
        </div>
        <div>
          <form>
            <div>
              <label for="org-join-code">Org Join Code: </label>
              <input type="text" id="org-join-code" bind:value={input_org_join_code}/>
            </div>
            <br />
            <div>
              <button onclick={join_org}>Join with Organization</button>
            </div>
          </form>
        </div>
      </div>
  	{:else}
  	  <p>Payment found but registration not complete</p>
      <div class="grid-thirds">
        <div>
          <a href={`/student/${event_id}/create-team`}>Create Independent Team</a>
        </div>
        <div>
          <form>
            <div>
              <label for="team-join-code">Team Join Code: </label>
              <input type="text" id="team-join-code" bind:value={input_team_join_code}/>
            </div>
            <br />
            <div>
              <a href={`/student/${event_id}/join-team/${input_team_join_code}`}>Join Independent Team</a>
            </div>
          </form>
        </div>
        <div>
          <form>
            <div>
              <label for="org-join-code">Org Join Code: </label>
              <input type="text" id="org-join-code" bind:value={input_org_join_code}/>
            </div>
            <br />
            <div>
              <button onclick={join_org}>Join with Organization</button>
            </div>
          </form>
        </div>
      </div>
  	{/if}
  {/if}
  <!-- TODO: custom fields -->
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
  {:else}
    {#if in_org}
      <p>Not yet assigned team by org</p>
    {/if}
  {/if}
  {#if in_org}
    <!-- TODO: org info -->
    {#if !purchase_ticket}
      <button onclick={purchase_ticket({})}>Purchase Individual Ticket (check with your organization if you need to do so)</button>
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
</style>
