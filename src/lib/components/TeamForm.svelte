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
        Tooltip
    } from "flowbite-svelte";
    import { EnvelopeSolid, InfoCircleSolid } from "flowbite-svelte-icons";
    import toast from "$lib/toast.svelte";
    import CustomForm from "$lib/components/CustomForm.svelte";
    import { getEventCustomFields, getCustomFieldResponses, upsertCustomFieldResponses, getStudentEvent, getOrgEventByJoinCode, upsertStudentEvent } from "$lib/supabase";
    import { handleError } from "$lib/handleError";

    let { team = $bindable(null), title, userType, user, event_id } = $props();

    let token: string | null = null;

    let selectedOption = $state("create_team");
    let firstName = $state("");
    let lastName = $state("");
    let email = $state("");
    let input_team_join_code = $state("");
    let input_org_join_code = $state("");
    let newResponses = $state({});
    let initialResponses = $state({});
    let validationErrors = $state({});
    let custom_fields = $state([]);
    let org_event = $state(null);

    function purchase_ticket(options: {
    creating_team?: boolean;
    joining_team_code?: string;
    }) {
      return async () => {
        let body = {
          event_id,
          token,
          quantity: 1,
          creating_team: options.creating_team ?? false,
          joining_team_code: options.joining_team_code ?? null,
          is_coach: false,
        };
        const response = await fetch("/api/purchase-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const text = await response.text();
        if (response.ok) {
          document.location.assign(text);
        } else {
          handleError(new Error(text));
        }
      };
    }

  async function handleSubmit(event) {
    let student_event;
    try {
      student_event = await upsertStudentEvent(user?.id, event_id);
    } catch (error) {
      error.message = `Error adding student to org in event: ${error.message}`
      handleError(error);
    }

    const customFieldResponses = Object.fromEntries(
        Object.entries(newResponses).filter(([key]) => !isNaN(Number(key)))
    );

    try {
      await upsertCustomFieldResponses(customFieldResponses, student_event.student_event_id, 'students');
    } catch (error) {
      error.message = `Error saving student custom field responses: ${error.message}`
      handleError(error);
      return
    }

    document.location.reload();
    return
  }

    (async () => {
        console.log("user", user)
        firstName = user?.first_name;
        lastName = user?.last_name;
        email = user?.email;
        console.log("user", user)

        custom_fields = await getEventCustomFields(event_id, "teams");
        console.log("event_id", event_id);
        console.log("event_custom_fields", custom_fields);

        custom_fields = await getCustomFieldResponses(custom_fields, student_event?.student_event_id)
        console.log("custom_fields", custom_fields);
        //token = data.session?.access_token ?? null;
    })();
</script>


<!--
<div class="registrationForm">
    <Tabs tabStyle="pill">
      <TabItem
        on:click={() => (selectedOption = "create_team")}
        open={selectedOption === "create_team"}
        title="Create or Join Independent Team"
      >
        <h2>Register with Independent Team</h2>
        <CustomForm fields={[]} custom_fields={custom_fields} bind:initialResponses={initialResponses} bind:newResponses={newResponses} bind:validationErrors={validationErrors} handleSubmit={handleSubmit}/>
      </TabItem>
      <TabItem
        on:click={() => (selectedOption = "join_team")}
        open={selectedOption === "join_team"}
        title="Join Independent Team"
      >
        <h2>Student Registration Form</h2>
      </TabItem>
      <TabItem
        on:click={() => (selectedOption = "join_org")}
        open={selectedOption === "join_org"}
        title="Register With Organization"
      >
      </TabItem>
    </Tabs>
    <br />
  </div>
-->
<CustomForm {title} fields={
  [
    {
        custom_field_id: "team_name", 
        label: "Team Name",
        required: true,
        regex: null,
        key: "team_name",
        placeholder: null,
        value: null,
        choices: null,
        editable: true,
        hidden: false
    }
  ]
} {custom_fields} bind:initialResponses bind:newResponses bind:validationErrors handleSubmit={handleSubmit}/>