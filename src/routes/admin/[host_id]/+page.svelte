<script lang="ts">
  import { page } from "$app/stores";
  import Loading from "$lib/components/Loading.svelte";
  import { Button, ButtonGroup, Modal } from "flowbite-svelte";
  import {
    getHostInformation,
    getAllHostEvents,
    createEvent,
    getAdminHosts,
  } from "$lib/supabase";
  import EventDisplay from "$lib/components/EventDisplay.svelte";
  import TournamentForm from "$lib/components/TournamentForm.svelte";
  import toast from "$lib/toast.svelte";
  import { handleError } from "$lib/handleError";
  import { user } from "$lib/sessionStore";
  import type { Tables } from "../../../../db/database.types";

  let all_events: {
    event_id: number;
    event_name: string;
    event_date: string;
  }[] = $state([]);
  let loading = $state(true);
  let host: any = $state();
  let admin: null | (Tables<"hosts"> & {host_admins: Tables<"host_admins">[]}) = $state(null);
  const host_id = parseInt($page.params.host_id);

  let newResponses = $state({
    ticket_price_cents: 0,
    max_team_size: 1,
    summary: null
  });
  let validationErrors = $state({});
  let isModalOpen = $state(false);

  (async () => {
    host = await getHostInformation(host_id);
    admin = (await getAdminHosts($user!.id)).find(h => h.host_id == host_id)!;
    all_events = await getAllHostEvents(host_id);

    loading = false;
  })();

  async function handleSubmit() {
    try {
      const data = await createEvent({
        ...newResponses,
        host_id: host_id,
      });

      toast.success("Tournament created successfully!");
      window.location.href = `/admin/${host_id}/${data.event_id}`;
    } catch (error) {
      handleError(error);
    }
  }
</script>

{#if loading}
  <Loading />
{:else}
  <EventDisplay
    id={host_id}
    host={host}
    editable={ admin?.host_admins.find(ha => ha.host_id == host_id)?.owner }
  />

  <div class="mb-4">
    <ButtonGroup>
      <Button
        outline
        pill
        color="primary"
        onclick={() => {
          window.location.href = `/admin/${host_id}/custom_fields`;
        }}>Edit Custom Fields</Button
      >
      <Button
        outline
        pill
        color="primary"
        onclick={() => {
          window.location.href = `/admin/${host_id}/users`;
        }}>View Users</Button
      >
      <Button
        outline
        pill
        color="primary"
        onclick={() => {
          isModalOpen = true;
        }}>Create Event</Button
      >
    </ButtonGroup>
  </div>
  <br />

  <h2 style="text-align: center;">Host Events</h2>
  <br />
  <div class="buttonContainer">
    {#each all_events as event}
      <div>
        <div class="problemContainer">
          <div style="align-items: left">
            <h4>
              {event.event_name}
            </h4>
            <div class="grouped" style="display: inline-block">
              <p style="display: inline-block">
                {event.event_date}
              </p>
            </div>
          </div>
          <br />
          <div>
            <Button size="sm" href={`./${host_id}/${event.event_id}`} pill
              >Go to Event</Button
            >
          </div>
        </div>
      </div>
    {/each}
  </div>
  {#if all_events.length == 0}
    <p style="text-align: center;">No events found</p>
  {/if}
  <br /><br />
{/if}

<div class="modalExterior">
  <Modal bind:open={isModalOpen} size="md" autoclose={false}>
    <div class="specificModalMax">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">
        Create Event
      </h3>
      <TournamentForm bind:newResponses bind:validationErrors {handleSubmit} newForm={true} />
    </div>
  </Modal>
</div>
