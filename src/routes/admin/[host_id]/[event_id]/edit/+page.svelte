<script lang="ts">
    import { page } from "$app/stores";
    import { handleError } from "$lib/handleError";
    import Loading from "$lib/components/Loading.svelte";
    import TournamentForm from "$lib/components/TournamentForm.svelte";
    import { getEventInformation, updateEvent } from "$lib/supabase";
    import toast from "$lib/toast.svelte";

    const host_id = parseInt($page.params.host_id);
    const event_id = parseInt($page.params.event_id);
    let loading = $state(true);
    let newResponses = $state({});
    let validationErrors = $state({});

    async function handleSubmit() {
        try {
            await updateEvent(event_id, newResponses);
            toast.success("Event information updated successfully");
        } catch (error) {
            handleError(error);
        }
    }

    async function handleSummaryUpdate() {
        try {
            await updateEvent(event_id, { summary: newResponses.summary });
            toast.success("Event summary updated successfully");
        } catch (error) {
            handleError(error);
        }
    }

    (async () => {
        try {
            const event = await getEventInformation(event_id);
            newResponses = {
                event_name: event.event_name,
                event_date: new Date(event.event_date),
                logo: event.logo,
                email: event.email,
                ticket_price_cents: event.ticket_price_cents,
                max_team_size: event.max_team_size,
                summary: event.summary || "",
            };
            loading = false;
        } catch (error) {
            handleError(error);
        }
    })();
</script>

{#if loading}
    <Loading />
{:else}
    <h1>Edit Event Information</h1>
    <TournamentForm
        bind:newResponses
        bind:validationErrors
        {handleSubmit}
        {handleSummaryUpdate}
    />
{/if}

<style>
    .grid {
        display: grid;
        grid-template-columns: 49% 50%;
        gap: 20px;
        padding: 30px;
    }
</style>
