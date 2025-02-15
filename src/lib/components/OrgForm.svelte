<script lang="ts">
  import {
    Button,
    Input,
    InputAddon,
    ButtonGroup,
    Tabs,
    TabItem,
    Helper,
    Select,
    Label,
    Tooltip,
  } from "flowbite-svelte";
  import { EnvelopeSolid, InfoCircleSolid } from "flowbite-svelte-icons";
  import toast from "$lib/toast.svelte";
  import CustomForm from "$lib/components/CustomForm.svelte";
  import {
    getEventCustomFields,
    getCustomFieldResponses,
    upsertCustomFieldResponses,
    getStudentEvent,
    getOrgEventByJoinCode,
    upsertStudentEvent,
    upsertOrgEvent,
  } from "$lib/supabase";
  import { handleError } from "$lib/handleError";

  let {
    org = $bindable(null),
    event_id,
    title = null,
    org_id = null,
    student_event = $bindable(null),
  } = $props();

  let token: string | null = null;

  let selectedOption = $state("create_team");
  let input_team_join_code = $state("");
  let input_org_join_code = $state("");
  let newResponses = $state({});
  let validationErrors = $state({});
  let custom_fields = $state([]);
  let org_event = $state(null);

  async function handleSubmit(event) {
    try {
      org = await upsertOrgEvent(event_id, org_id);
      console.log("ORG", org);

      const customFieldResponses = Object.fromEntries(
        Object.entries(newResponses).filter(([key]) => !isNaN(Number(key))),
      );

      await upsertCustomFieldResponses(
        customFieldResponses,
        org.org_event_id,
        "orgs",
      );
      window.location.reload();

      return;
    } catch (error) {
      handleError(error);
    }
  }

  (async () => {
    custom_fields = await getEventCustomFields(event_id, "orgs");
    console.log("event_id", event_id);
    console.log("event_custom_fields", custom_fields);

    custom_fields = await getCustomFieldResponses(
      custom_fields,
      org_event?.org_event_id,
      "orgs",
    );
    console.log("custom_fields", custom_fields);
    //token = data.session?.access_token ?? null;
  })();
</script>

<CustomForm
  title="Registration Form"
  fields={[
    {
      event_custom_field_id: "org_name",
      key: "org_name",
      label: "Organization Name",
      required: true,
      regex: null,
      placeholder: null,
      value: org?.orgs.name ?? null,
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
      value: org?.orgs.address ?? null,
      choices: null,
      editable: false,
      hidden: false,
    }
  ]}
  {custom_fields}
  bind:newResponses
  bind:validationErrors
  {handleSubmit}
/>
