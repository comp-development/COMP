<script lang="ts">
    import { page } from "$app/stores";
    import { handleError } from "$lib/handleError";
    import Loading from "$lib/components/Loading.svelte";
    import CustomForm from "$lib/components/CustomForm.svelte";
    import MarkdownRender from "$lib/components/MarkdownRender.svelte";
    import { getEventInformation, updateEvent } from "$lib/supabase";
    import toast from "$lib/toast.svelte";
    import { Textarea, Button } from "flowbite-svelte";

    const host_id = parseInt($page.params.host_id);
    const event_id = parseInt($page.params.event_id);
    let loading = $state(true);
    let event = $state({});
    let newResponses = $state({});
    let validationErrors = $state({});
    let summary = $state("");

    let eventFields = $state([]);

    async function fetchEvent() {
        try {
            event = await getEventInformation(event_id);
            newResponses = {
                event_name: event.event_name,
                event_date: new Date(event.event_date),
                logo: event.logo,
                email: event.email,
            };
            summary = event.summary || "";

            eventFields = [
                {
                    name: "event_name",
                    label: "Event Name",
                    required: true,
                    editable: true,
                    custom_field_type: "text",
                    value: newResponses.event_name,
                },
                {
                    name: "event_date",
                    label: "Event Date",
                    required: true,
                    editable: true,
                    custom_field_type: "date",
                    value: new Date(newResponses.event_date),
                },
                {
                    name: "logo",
                    label: "Logo URL",
                    required: true,
                    editable: true,
                    custom_field_type: "text",
                    value: newResponses.logo,
                },
                {
                    name: "email",
                    label: "Contact Email",
                    required: true,
                    editable: true,
                    custom_field_type: "email",
                    value: newResponses.email,
                },
            ];

            loading = false;
        } catch (error) {
            handleError(error);
        }
    }

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
            await updateEvent(event_id, { summary });
            event.summary = summary;
            toast.success("Event summary updated successfully");
        } catch (error) {
            handleError(error);
        }
    }

    fetchEvent();
</script>

{#if loading}
    <Loading />
{:else}
    <h1>Edit Event Information</h1>

    <CustomForm
        fields={eventFields}
        bind:newResponses
        bind:validationErrors
        {handleSubmit}
        showBorder={true}
    />

    <div class="grid">
        <div class="flex flex-col">
            <Textarea
                rows={20}
                bind:value={summary}
                class="mb-2"
                placeholder="Enter event summary in markdown format..."
            />
            <Button
                pill
                color="primary"
                class="mt-2"
                on:click={handleSummaryUpdate}
            >
                Update Summary
            </Button>
        </div>

        <div>
            <h3 class="text-lg mb-2">Preview</h3>
            <MarkdownRender source={summary} />
        </div>
    </div>
{/if}

<style>
    .grid {
        display: grid;
        grid-template-columns: 49% 50%;
        gap: 20px;
        padding: 30px;
    }
</style>
