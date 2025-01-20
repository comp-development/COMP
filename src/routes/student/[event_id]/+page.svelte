<script lang="ts">
  import { page } from "$app/stores";
  import { Button, Badge, Input, Label } from 'flowbite-svelte';
  import Loading from "$lib/components/Loading.svelte";
  import { user } from "$lib/sessionStore";
  import {
    getEventInformation,
    getStudentEvent,
    getStudentOrgEvent,
    getStudentTicketOrder,
  } from "$lib/supabase";
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
  let event_details: Tables<"events"> | null = $state(null);
  let student_org_event:
    | (Tables<"student_org_events"> & { org_events: Tables<"org_events"> })
    | null = null;
  let team:
    | (Tables<"teams"> & {
        student_events_detailed: Tables<"student_events_detailed">[];
      })
    | undefined
    | null = $state(null);
  let ticket_order: Tables<"ticket_orders"> | null = null;
  let in_team = $state(false);
  let in_org = $state(false);
  let transaction_stored = $state(false);

  let loading = $state(true);
  let token: string | null = null;

  let input_team_join_code = $state("");
  let input_org_join_code = $state("");

  (async () => {
    student_event_details = await getStudentEvent($user!.id, event_id);
    student_org_event = await getStudentOrgEvent($user!.id, event_id);
    ticket_order = await getStudentTicketOrder($user!.id, event_id);
    in_team = student_event_details != null;
    in_org = student_org_event != null;

    team = student_event_details?.teams;
    team?.student_events_detailed.sort((a, b) =>
      (a?.front_id ?? "") < (b?.front_id ?? "") ? -1 : 1
    );

    event_details = await getEventInformation(event_id);

    const { data, error } = await supabase.auth.getSession();
    if (error != null) {
      handleError(error);
    }
    token = data.session?.access_token ?? null;

    loading = false;
  })();

  function purchase_ticket(options: { creating_team?: boolean; joining_team_code?: string }) {
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
  <Loading />
{:else}
  <br />
  <h1>{event_details?.event_name}</h1>
  <br />

  {#if !in_org && !in_team}
    {#if !transaction_stored}
      <Button pill onclick={purchase_ticket({ creating_team: true })}>Create Independent Team</Button>
      <br /> <br />
      <div class="flex">
        <div class="formBox">
          <div class="mb-4">
            <Label for="team-join-code" value="Team Join Code" />
            <Input id="team-join-code" bind:value={input_team_join_code} type="text" placeholder="Enter team join code" />
          </div>
          <div>
            <Button pill onclick={purchase_ticket({ joining_team_code: input_team_join_code })}>
              Join Independent Team
            </Button>
          </div>
        </div>
        <div class="formBox">
          <div class="mb-4">
            <Label for="org-join-code" value="Org Join Code" />
            <Input id="org-join-code" bind:value={input_org_join_code} type="text" placeholder="Enter org join code" />
          </div>
          <div>
            <Button pill onclick={join_org}>Join with Organization</Button>
          </div>
        </div>
      </div>
    {:else}
      <p>Payment found but registration not complete</p>
      <div class="grid-thirds">
        <div>
          <a href={`/student/${event_id}/create-team`}>Create Independent Team</a>
        </div>
        <div>
          <div class="mb-4">
            <Label for="team-join-code" value="Team Join Code" />
            <Input id="team-join-code" bind:value={input_team_join_code} type="text" placeholder="Enter team join code" />
          </div>
          <div>
            <a href={`/student/${event_id}/join-team/${input_team_join_code}`}>Join Independent Team</a>
          </div>
        </div>
        <div>
          <div class="mb-4">
            <Label for="org-join-code" value="Org Join Code" />
            <Input id="org-join-code" bind:value={input_org_join_code} type="text" placeholder="Enter org join code" />
          </div>
          <div>
            <button onclick={join_org}>Join with Organization</button>
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Additional conditions for team and org information -->
  {#if in_team}
    <p>Team information...</p>
  {:else if in_org}
    <p>Org information...</p>
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

  .formBox {
		border: 3px solid var(--primary-tint);
		padding: 20px;
		margin: 10px;
		border-radius: 20px;
  }
</style>
