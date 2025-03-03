<script lang="ts">
  import { page } from "$app/stores";
  import Loading from "$lib/components/Loading.svelte";
  import { user } from "$lib/sessionStore";
  import { Button } from "flowbite-svelte";
  import {
    getHostInformation,
    getHostEvents,
    getStudentHostEvents,
  } from "$lib/supabase";
  import EventDisplay from "$lib/components/EventDisplay.svelte";

  let my_events: {
    event_id: string;
    event_name: string;
    event_date: string;
  }[] = $state([]);
  let my_event_ids: Set<string> = new Set();
  let all_events: {
    event_id: number;
    event_name: string;
    event_date: string;
  }[] = $state([]);
  let loading = $state(true);
  let host: any = $state();
  const host_id = parseInt($page.params.host_id);

  (async () => {
    host = await getHostInformation(host_id);

    my_events = (await getStudentHostEvents($user!.id, host_id)).map((e) => ({
      event_id: e.event_id.toString(),
      event_name: e.event.event_name ?? "Unnamed Event",
      event_date: e.event.event_date ?? "Missing Date",
    }));
    // TODO: include events where the student joined with an org
    // but is not yet in a team
    my_events.sort((a, b) => (a.event_date < b.event_date ? -1 : 1));
    for (const e of my_events) {
      my_event_ids.add(e.event_id.toString());
    }

    all_events = (await getHostEvents(host_id)).filter(
      (event) => !my_event_ids.has(event.event_id.toString()),
    );

    loading = false;
  })();
</script>

{#if loading}
  <Loading />
{:else}
  <EventDisplay
    id={host_id}
    host={host}
    editable={false}
  />
  <br />
  <h2 style="text-align: center;">My Events</h2>
  <br />

  <div class="buttonContainer">
    {#each my_events as event}
      <div>
        <div class="problemContainer">
          <div style="align-items: left">
            <h4>
              {event.event_name}
            </h4>
            <p>{event.event_date}</p>
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
  {#if my_events.length == 0}
    <p style="text-align: center;">No events found</p>
  {/if}
  <br />
  <br />
  <h2 style="text-align: center;">Other Events</h2>
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
              >{my_event_ids.has(event.event_id.toString())
                ? "Go to Event"
                : "Sign Up"}</Button
            >
          </div>
        </div>
      </div>
    {/each}
  </div>
  {#if all_events.length == 0}
    <p style="text-align: center;">No events found</p>
  {/if}
{/if}