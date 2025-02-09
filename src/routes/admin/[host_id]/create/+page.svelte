<script lang="ts">
    import CustomForm from '$lib/components/CustomForm.svelte';
    import { supabase } from '$lib/supabaseClient';
    import { page } from '$app/stores';
    import { handleError } from '$lib/handleError';
    import toast from '$lib/toast.svelte';

    let newResponses = $state({});
    let validationErrors = $state({});

    const host_id = parseInt($page.params.host_id);

    const fields = [
        {
            name: "event_name",
            label: "Event Name",
            required: true,
            editable: true,
            custom_field_type: "text",
            placeholder: "Enter event name",
        },
        {
            name: "event_date",
            label: "Event Date",
            required: true,
            editable: true,
            custom_field_type: "date",
            placeholder: "Select event date",
        },
        {
            name: "ticket_price",
            label: "Ticket Price",
            required: true,
            editable: true,
            custom_field_type: "number",
            placeholder: "Enter ticket price",
        },
        {
            name: "max_team_size",
            label: "Maximum Team Size",
            required: true,
            editable: true,
            custom_field_type: "number",
            placeholder: "Enter maximum team size",
        },
        {
            name: "email",
            label: "Contact Email",
            required: true,
            editable: true,
            custom_field_type: "email",
            placeholder: "Enter contact email",
        },
        {
            name: "logo",
            label: "Logo URL",
            required: true,
            editable: true,
            custom_field_type: "text",
            placeholder: "Enter logo URL",
        },
        {
            name: "summary",
            label: "Event Summary",
            required: true,
            editable: true,
            custom_field_type: "paragraph",
            placeholder: "Enter event summary",
        },
    ];

    async function handleSubmit() {
        try {
            // Validate number fields
            const ticketPrice = parseFloat(newResponses.ticket_price);
            const maxTeamSize = parseInt(newResponses.max_team_size);

            if (isNaN(ticketPrice) || ticketPrice < 0) {
                validationErrors.ticket_price = "Ticket price must be a valid non-negative number";
                return;
            }

            if (isNaN(maxTeamSize) || maxTeamSize < 1) {
                validationErrors.max_team_size = "Maximum team size must be a positive number";
                return;
            }

            const { data, error } = await supabase
                .from('events')
                .insert({
                    event_name: newResponses.event_name,
                    event_date: newResponses.event_date,
                    ticket_price: ticketPrice,
                    max_team_size: maxTeamSize,
                    email: newResponses.email,
                    logo: newResponses.logo,
                    summary: newResponses.summary,
                    host_id: host_id,
                    published: false
                })
                .select()
                .single();

            if (error) throw error;

            toast.success("Tournament created successfully!");
            // Redirect to the event page
            window.location.href = `/admin/${host_id}/${data.event_id}`;
        } catch (error) {
            handleError(error);
        }
    }
</script>

<div class="container mx-auto p-4">
    <h1>Create Tournament</h1>
    <CustomForm
        title="Tournament Details"
        {fields}
        bind:newResponses
        bind:validationErrors
        {handleSubmit}
    />
</div>
