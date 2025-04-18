<script>
  import { Tabs, TabItem } from "flowbite-svelte";
  import CustomForm from "$lib/components/CustomForm.svelte";
  import { getCustomFields, upsertHostCustomFields } from "$lib/supabase";
  import EditableCustomForm from "$lib/components/EditableCustomForm.svelte";
  import { page } from "$app/stores";

  let selectedTab = "waivers";
  let studentResponses = $state({});
  let orgResponses = $state({});
  let teamResponses = $state({});
  let studentValidationErrors = $state({});
  let orgValidationErrors = $state({});
  let teamValidationErrors = $state({});
  let studentCustomFields = $state([]);
  let orgCustomFields = $state([]);
  let teamCustomFields = $state([]);

  const host_id = parseInt($page.params.host_id);

  (async () => {
    studentCustomFields = await getCustomFields(host_id, "students");
    orgCustomFields = await getCustomFields(host_id, "orgs");
    teamCustomFields = await getCustomFields(host_id, "teams");
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
          editableHostFields={true}
          action={async () => {
            const results = await upsertHostCustomFields(
              studentCustomFields,
              "students",
              host_id,
            );
            return results;
          }}
          {host_id}
        />
      </div>
      <div>
        <CustomForm
          title="Custom Field Preview"
          fields={[]}
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
          editableHostFields={true}
          table="orgs"
          action={async () => {
            const results = await upsertHostCustomFields(orgCustomFields, "orgs", host_id);
            return results;
          }}
          {host_id}
        />
      </div>
      <div>
        <CustomForm
          title="Custom Field Preview"
          fields={[]}
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
          editableHostFields={true}
          table="teams"
          action={async () => {
            const results = await upsertHostCustomFields(teamCustomFields, "teams", host_id);
            return results;
          }}
          {host_id}
        />
      </div>
      <div>
        <CustomForm
          title="Custom Field Preview"
          fields={[]}
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
