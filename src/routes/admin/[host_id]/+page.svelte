<script lang="ts">
    import { page } from "$app/stores";
    import Loading from "$lib/components/Loading.svelte";
    import { Button } from "flowbite-svelte";
    import { getHostInformation, getAllHostEvents } from "$lib/supabase";
    import EventDisplay from "$lib/components/EventDisplay.svelte";

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
        all_events = await getAllHostEvents(host_id);

        loading = false;
    })();
</script>

{#if loading}
    <Loading />
{:else}
    <EventDisplay
        name={host?.host_name}
        logo={host?.logo}
        email={host?.email}
        markdown={host?.summary}
        id={host_id}
        editable={true}
    />
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
                        <Button
                            size="sm"
                            href={`./${host_id}/${event.event_id}`}
                            pill>Go to Event</Button
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

<style>
    .container {
        max-width: 768px;
    }

    .summary {
        border: 3px solid var(--primary-tint);
        padding: 10px;
        margin: 10px;
        border-radius: 15px;
    }
</style>
