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

    let { title = "Registration Form", student_event = $bindable(null), user, event_id } = $props();

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

  async function join_org() {
    input_org_join_code = newResponses["org_join_code"].toUpperCase();
    let org_event;
    try {
      org_event = await getOrgEventByJoinCode(event_id, input_org_join_code);
    } catch (error) {
      validationErrors["org_join_code"] = "Invalid Org Join Code."
      return
    }
    
    
    console.log("ORG_EVENT", org_event)
    try {
      student_event = await upsertStudentEvent(user?.id, event_id, null, org_event.org_id);
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
    
    /**
    let body = {
      token,
      join_code: input_org_join_code,
    };
    const response = await fetch(`./${event_id}/join-org`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (response.ok) {
      document.location.reload();
    } else {
      handleError(new Error(text));
    }
    */
  }

  async function handleSubmit(event) {
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
    //document.location.reload();
    return
    event.preventDefault();

    if (selectedOption === "create_team") {
      if (!transaction_stored) {
        purchase_ticket({ creating_team: true });
      } else {
        /*LOGIC NEEDS TO BE IMPLEMENTED*/
      }
    } else if (selectedOption === "join_team") {
      purchase_ticket({ joining_team_code: input_team_join_code });
    } else if (selectedOption === "join_org") {
      join_org();
    }
  }

    (async () => {
        console.log("user", user)
        firstName = user?.first_name;
        lastName = user?.last_name;
        email = user?.email;

        custom_fields = await getEventCustomFields(event_id);
        console.log("event_id", event_id);
        console.log("event_custom_fields", custom_fields);

        custom_fields = await getCustomFieldResponses(custom_fields, student_event?.student_event_id, "students")
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
          event_custom_field_id: "first_name",
          key: "first_name",
          label: "First Name",
          required: true,
          regex: null,
          placeholder: null,
          value: firstName,
          choices: null,
          editable: false,
          hidden: false
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
          hidden: false
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
          hidden: false
      }
    ]
  } {custom_fields} bind:newResponses bind:validationErrors handleSubmit={handleSubmit}/>
