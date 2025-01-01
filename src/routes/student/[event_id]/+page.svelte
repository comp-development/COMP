<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/Button.svelte";
  import { user } from "$lib/sessionStore";
  import {
    getEventInformation,
    getStudentEvent,
    getStudentOrgEvent,
    getStudentTicketOrder,
  } from "$lib/supabase";
  import { Tag } from "carbon-components-svelte";
  import type { Tables } from "../../../../db/database.types";
  import { supabase } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";

  const event_id = parseInt($page.params.event_id);
  let student_event_details:
    | (Tables<"student_events_detailed"> & {
        teams: Tables<"teams"> & {
          student_events_detailed: Tables<"student_events_detailed">[];
        };
      })
    | null = null;
  let event_details: Tables<"events"> | null = null;
  let student_org_event:
    | (Tables<"student_org_events"> & { org_events: Tables<"org_events"> })
    | null = null;
  let team:
    | (Tables<"teams"> & {
        student_events_detailed: Tables<"student_events_detailed">[];
      })
    | undefined
    | null = null;
  let ticket_order: Tables<"ticket_orders"> | null = null;
  let in_team = false;
  let in_org = false;
  let transaction_stored = false;

  let loading = true;
  let token: string | null = null;

  let input_team_join_code = "";
  let input_org_join_code = "";

  (async () => {
    // Check if this student is registered in this event.
    student_event_details = await getStudentEvent($user!.id, event_id);
    student_org_event = await getStudentOrgEvent($user!.id, event_id);
    ticket_order = await getStudentTicketOrder($user!.id, event_id);
    in_team = student_event_details != null;
    in_org = student_org_event != null;
    console.log($user!.id)
    console.log("Ticket order", ticket_order)
    transaction_stored = ticket_order != null;

    team = student_event_details?.teams;
    // Sort team members by front_id (alphabetical descending).
    team?.student_events_detailed.sort((a, b) =>
      (a?.front_id ?? "") < (b?.front_id ?? "") ? -1 : 1,
    );

    console.log("student_event_details", student_event_details);
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
          <button on:click={purchase_ticket({creating_team: true})}>Create Independent Team</button>
        </div>
        <div>
          <form>
            <div>
              <label for="team-join-code">Team Join Code: </label>
              <input type="text" id="team-join-code" bind:value={input_team_join_code}/>
            </div>
            <br />
            <div>
              <button on:click={purchase_ticket({joining_team_code: input_org_join_code})}>Join Independent Team</button>
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
              <button on:click={join_org}>Join with Organization</button>
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
              <button on:click={join_org}>Join with Organization</button>
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
      <button on:click={purchase_ticket({})}>Purchase Individual Ticket (check with your organization if you need to do so)</button>
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
