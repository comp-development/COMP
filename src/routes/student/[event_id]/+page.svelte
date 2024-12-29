<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/Button.svelte";
  import { user } from "$lib/sessionStore";
  import { getEventInformation, getStudentEvent } from "$lib/supabase";
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
  let team:
    | (Tables<"teams"> & {
        student_events_detailed: Tables<"student_events_detailed">[];
      })
    | undefined
    | null = null;
  let on_team = false;
  let loading = true;
  let event_details: Tables<"events"> | null = null;
  let token: string | null = null;

  (async () => {
    // Check if this student is registered in this event.
    student_event_details = await getStudentEvent($user!.id, event_id);
    on_team = student_event_details != null;

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

  async function handleCreateTeam() {
    // const { data, error } = await supabase
    //   .from("teams")
    //   .insert({
    //     event_id,
    //   })
    //   .select("team_id")
    //   .single();
    // if (error != null) {
    //   handleError({ name: "creating team", ...error });
    //   return;
    // }

    const response = await fetch("/api/purchase-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id,
        token,
        quantity: 1,
        creating_team: true,
      }),
    });
    const text = await response.text();
    if (response.ok) {
      document.location.assign(text);
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
  <!-- check code valid => redirect to stripe => redirect back => verify stripe paid and code valid => add to student_events -->
  {#if !on_team}
    <!-- TODO: if no student event details, but yes student_org_events, show diff page -->
    <div class="grid-thirds">
      <div>
        <button on:click={handleCreateTeam}>Create Independent Team</button>
      </div>
      <div>
        <form>
          <div>
            <label for="team-join-code">Team Join Code: </label>
            <!-- TODO: bind -->
            <input type="text" id="team-join-code" name="team-join-code" />
          </div>
          <br />
          <div>
            <button>Join Independent Team</button>
          </div>
        </form>
      </div>
      <div>
        <form>
          <div>
            <label for="org-join-code">Org Join Code: </label>
            <!-- TODO: bind -->
            <input type="text" id="org-join-code" name="org-join-code" />
          </div>
          <br />
          <div>
            <button>Join with Organization</button>
          </div>
        </form>
      </div>
    </div>
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
