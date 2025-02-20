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
  } from "$lib/supabase";
  import { handleError } from "$lib/handleError";

  let {
    title = "Registration Form",
    student_event = $bindable(null),
    user,
    event_id,
  } = $props();

  let token: string | null = null;

  let selectedOption = $state("create_team");
  let firstName = $state("");
  let lastName = $state("");
  let email = $state("");
  let input_team_join_code = $state("");
  let input_org_join_code = $state("");
  let newResponses = $state({});
  let validationErrors = $state({});
  let custom_fields = $state([]);
  let org_event = $state(null);

  async function handleSubmit(event) {
    try {
      student_event = await upsertStudentEvent(user?.id, event_id);
    } catch (error) {
      error.message = `Error adding student to org in event: ${error.message}`;
      handleError(error);
    }

    const customFieldResponses = Object.fromEntries(
      Object.entries(newResponses).filter(([key]) => !isNaN(Number(key))),
    );

    try {
      await upsertCustomFieldResponses(
        customFieldResponses,
        student_event.student_event_id,
        "students",
      );
      toast.success("Submitted!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      error.message = `Error saving student custom field responses: ${error.message}`;
      handleError(error);
      return;
    }
    //document.location.reload();
    return;
  }

  (async () => {
    console.log("user", user);
    firstName = user?.first_name;
    lastName = user?.last_name;
    email = user?.email;

    custom_fields = await getEventCustomFields(event_id);
    console.log("event_id", event_id);
    console.log("event_custom_fields", custom_fields);

    custom_fields = await getCustomFieldResponses(
      custom_fields,
      student_event?.student_event_id,
      "students",
    );
    console.log("custom_fields", custom_fields);
    //token = data.session?.access_token ?? null;
  })();
</script>

<CustomForm
  {title}
  fields={[
    {
      event_custom_field_id: "first_name",
      key: "first_name",
      label: "First Name",
      required: true,
      regex: null,
      placeholder: null,
      value: firstName,
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
      value: lastName,
      choices: null,
      editable: false,
      hidden: false,
    },
    {
      event_custom_field_id: "email",
      key: "email",
      custom_field_id: "email",
      label: "Email Address",
      required: true,
      regex: null,
      placeholder: null,
      value: email,
      choices: null,
      editable: false,
      hidden: false,
    },
  ]}
  {custom_fields}
  bind:newResponses
  bind:validationErrors
  {handleSubmit}
/>
