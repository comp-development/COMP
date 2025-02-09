<script>
    import { Tabs, TabItem } from "flowbite-svelte";
    import CustomForm from "$lib/components/CustomForm.svelte";
    import {
        getEventCustomFields,
        getCustomFieldResponses,
    } from "$lib/supabase";

    let selectedTab = "student";
    let studentResponses = $state({});
    let orgResponses = $state({});
    let teamResponses = $state({});
    let studentValidationErrors = $state({});
    let orgValidationErrors = $state({});
    let teamValidationErrors = $state({});
    let studentCustomFields = $state([]);
    let orgCustomFields = $state([]);
    let teamCustomFields = $state([]);

    // Get the event_id from the URL
    const event_id = parseInt(window.location.pathname.split("/")[3]);

    const studentFields = [
        {
            event_custom_field_id: "first_name",
            key: "first_name",
            label: "First Name",
            required: true,
            regex: null,
            placeholder: null,
            value: null,
            choices: null,
            editable: false,
            hidden: false,
        },
        {
            event_custom_field_id: "last_name",
            key: "last_name",
            label: "Last Name",
            required: true,
            regex: null,
            placeholder: null,
            value: null,
            choices: null,
            editable: false,
            hidden: false,
        },
        {
            event_custom_field_id: "email",
            key: "email",
            label: "Email Address",
            required: true,
            regex: null,
            placeholder: null,
            value: null,
            choices: null,
            editable: false,
            hidden: false,
        },
    ];

    const orgFields = [
        {
            event_custom_field_id: "org_name",
            key: "org_name",
            label: "Organization Name",
            required: true,
            regex: null,
            placeholder: null,
            value: null,
            choices: null,
            editable: false,
            hidden: false,
        },
        {
            event_custom_field_id: "org_address",
            key: "org_address",
            label: "Organization Address",
            required: true,
            regex: null,
            placeholder: null,
            value: null,
            choices: null,
            editable: false,
            hidden: false,
        },
    ];

    const teamFields = [
        {
            event_custom_field_id: "team_name",
            key: "team_name",
            label: "Team Name",
            required: true,
            regex: null,
            placeholder: null,
            value: null,
            choices: null,
            editable: true,
            hidden: false,
        },
    ];

    (async () => {
        studentCustomFields = await getEventCustomFields(event_id, "students");
        orgCustomFields = await getEventCustomFields(event_id, "orgs");
        teamCustomFields = await getEventCustomFields(event_id, "teams");
    })();
</script>

<Tabs tabStyle="pill">
    <TabItem
        open={selectedTab === "student"}
        title="Student"
        on:click={() => (selectedTab = "student")}
    >
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h2>Student Registration</h2>
            </div>
            <div>
                <CustomForm
                    title="Registration Form"
                    fields={studentFields}
                    custom_fields={studentCustomFields}
                    bind:newResponses={studentResponses}
                    bind:validationErrors={studentValidationErrors}
                    handleSubmit={() => {}}
                />
            </div>
        </div>
    </TabItem>
    <TabItem
        open={selectedTab === "organization"}
        title="Organization"
        on:click={() => (selectedTab = "organization")}
    >
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h2>Organization Registration</h2>
            </div>
            <div>
                <CustomForm
                    title="Registration Form"
                    fields={orgFields}
                    custom_fields={orgCustomFields}
                    bind:newResponses={orgResponses}
                    bind:validationErrors={orgValidationErrors}
                    handleSubmit={() => {}}
                />
            </div>
        </div>
    </TabItem>
    <TabItem
        open={selectedTab === "team"}
        title="Team"
        on:click={() => (selectedTab = "team")}
    >
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h2>Team Registration</h2>
            </div>
            <div>
                <CustomForm
                    title="Registration Form"
                    fields={teamFields}
                    custom_fields={teamCustomFields}
                    bind:newResponses={teamResponses}
                    bind:validationErrors={teamValidationErrors}
                    handleSubmit={() => {}}
                />
            </div>
        </div>
    </TabItem>
</Tabs>

<style>
    .grid {
        grid-template-columns: 49% 50%;
    }

    :global([role=tabpanel]) {
        background-color: transparent;
    }
</style>
