<script>
  import { Tabs, TabItem } from "flowbite-svelte";
  import CustomForm from "$lib/components/CustomForm.svelte";
  import { getEventCustomFields, upsertEventCustomFields } from "$lib/supabase";
  import EditableCustomForm from "$lib/components/EditableCustomForm.svelte";
  import { page } from "$app/stores";

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
  const event_id = parseInt($page.params.event_id);
  const host_id = parseInt($page.params.host_id);

  const MAX_NAME_LENGTH = 50;

  const studentFields = [
    {
      key: "first_name",
      label: "First Name",
      custom_field_type: "text",
      required: true,
      regex: null,
      placeholder: null,
      value: null,
      choices: null,
      editable: false,
      hidden: false,
    },
    {
      key: "last_name",
      label: "Last Name",
      custom_field_type: "text",
      required: true,
      regex: null,
      placeholder: null,
      value: null,
      choices: null,
      editable: false,
      hidden: false,
    },
    {
      key: "email",
      label: "Email Address",
      custom_field_type: "email",
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
      key: "org_name",
      label: "Organization Name",
      required: true,
      regex: new RegExp(`^.{1,${MAX_NAME_LENGTH}}$`),
      regex_error_message: `Organization name must be ${MAX_NAME_LENGTH} characters or less`,
      placeholder: "Enter organization name (max 50 characters)",
      value: null,
      choices: null,
      editable: false,
      hidden: false,
      help_text: `Maximum ${MAX_NAME_LENGTH} characters`
    },
    {
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
      key: "team_name",
      label: "Team Name",
      required: true,
      regex: new RegExp(`^.{1,${MAX_NAME_LENGTH}}$`),
      regex_error_message: `Team name must be ${MAX_NAME_LENGTH} characters or less`,
      placeholder: "Enter team name (max 50 characters)",
      value: null,
      choices: null,
      editable: true,
      hidden: false,
      help_text: `Maximum ${MAX_NAME_LENGTH} characters`
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
    onclick={() => (selectedTab = "student")}
  >
    <div class="grid">
      <div>
        <EditableCustomForm
          bind:custom_fields={studentCustomFields}
          table="students"
          editableHostFields={false}
          action={async () => {
            await upsertEventCustomFields(
              studentCustomFields,
              "students",
              event_id,
            );
          }}
          {host_id}
        />
      </div>
      <div>
        <CustomForm
          title="Registration Form Preview"
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
    onclick={() => (selectedTab = "organization")}
  >
    <div class="grid grid-cols-2 gap-4">
      <div>
        <EditableCustomForm
          bind:custom_fields={orgCustomFields}
          table="orgs"
          editableHostFields={false}
          action={async () => {
            await upsertEventCustomFields(orgCustomFields, "orgs", event_id);
          }}
          {host_id}
        />
      </div>
      <div>
        <CustomForm
          title="Registration Form Preview"
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
    onclick={() => (selectedTab = "team")}
  >
    <div class="grid grid-cols-2 gap-4">
      <div>
        <EditableCustomForm
          bind:custom_fields={teamCustomFields}
          table="teams"
          editableHostFields={false}
          action={async () => {
            await upsertEventCustomFields(teamCustomFields, "teams", event_id);
          }}
          {host_id}
        />
      </div>
      <div>
        <CustomForm
          title="Registration Form Preview"
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

  @media only screen and (max-width: 900px) {
    .grid {
      grid-template-columns: auto;
    }
  }

  :global([role="tabpanel"]) {
    background-color: transparent;
  }
</style>