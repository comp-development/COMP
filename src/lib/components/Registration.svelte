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
    import { getEventCustomFields, getCustomFieldResponses, upsertCustomFieldResponses, getStudentEvent, getOrgEventByJoinCode, addStudentToEvent } from "$lib/supabase";
    import { handleError } from "$lib/handleError";

    let { userType, user, event_id } = $props();

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
    let student_event = $state(null);
    let org_event = $state(null);

    function validateOrgJoinCode() {
      const regex = /^[a-zA-Z0-9]{6}$/;
      validationErrors["org_join_code"] = !regex.test(input_org_join_code) ? "Join Code must be 6 characters long and contain only letters and numbers" : null;
    }

    function validateInput(key, value, regex) {
        if (regex) {
          const pattern = new RegExp(regex);
          validationErrors[key] = !pattern.test(value)
            ? "Invalid input. Please follow the format."
            : null;
        } else {
          validationErrors[key] = null;
        }
    }

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
    let student_event;
    try {
      student_event = await addStudentToEvent(user?.id, event_id, null, org_event.org_id);
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

  function handleSubmit(event) {
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
        console.log("user", user)
        student_event = await getStudentEvent(user!.id, event_id);
        console.log("student_event", student_event);

        custom_fields = await getEventCustomFields(event_id);
        console.log("event_id", event_id);
        console.log("event_custom_fields", custom_fields);

        custom_fields = await getCustomFieldResponses(custom_fields, student_event?.student_event_id)
        console.log("custom_fields", custom_fields);
        //token = data.session?.access_token ?? null;
    })();
</script>



<div class="registrationForm">
    <Tabs tabStyle="pill">
      <TabItem
        on:click={() => (selectedOption = "create_team")}
        open={selectedOption === "create_team"}
        title="Create Independent Team"
      >
        <h2>Student Registration Form</h2>
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
        title="Join Organization"
      >
        <h2>Register with Organization</h2>
        <CustomForm fields={
          [
            {
                custom_field_id: "org_join_code", 
                label: "Organization Join Code",
                help_text: "Enter the join code provided to you by your coach.",
                required: true,
                regex: "^[a-zA-Z0-9]{6}$",
                key: "org_join_code",
                placeholder: "ABC123",
                value: null,
                choices: null,
                editable: true,
                hidden: false
            },
            {
                custom_field_id: "first_name", 
                label: "First Name",
                required: true,
                regex: null,
                key: "first_name",
                placeholder: null,
                value: firstName,
                choices: null,
                editable: false,
                hidden: false
            },
            {
                custom_field_id: "last_name", 
                label: "Last Name",
                required: true,
                regex: null,
                key: "last_name",
                placeholder: null,
                value: lastName,
                choices: null,
                editable: false,
                hidden: false
            },
            {
                custom_field_id: "email", 
                label: "Email Address",
                required: true,
                regex: null,
                key: "email",
                placeholder: null,
                value: email,
                choices: null,
                editable: false,
                hidden: false
            }
          ]
        } {custom_fields} bind:initialResponses bind:newResponses bind:validationErrors handleSubmit={handleSubmit}/>
      </TabItem>
    </Tabs>

    <br />

    
    <!--
    <form onsubmit={handleSubmit}>
      {#if selectedOption === "join_team"}
        <div class="text-left">
          <Label for="team-join-code" class="block mb-2">Team Join Code<span class="text-red-600">&nbsp;*</span></Label>
          <Input
            id="team-join-code"
            bind:value={input_team_join_code}
            type="text"
            placeholder="ABC123"
            required
          /><br />
        </div>
      {:else if selectedOption === "join_org"}
        <div class="text-left">
          <Label for="org-join-code" class="block mb-2" color={validationErrors["org_join_code"] ? "red" : "base"}>Organization Join Code<span class="text-red-600">&nbsp;*</span></Label>
          <Input
            id="org-join-code"
            bind:value={input_org_join_code}
            type="text"
            placeholder="ABC123"
            required
            on:blur={() =>
              validateOrgJoinCode()}
          />
          {#if validationErrors["org_join_code"]}
            <Helper class="mb-3" color="red"
              >{validationErrors["org_join_code"]}</Helper
            >
          {/if}
          <br>
        </div>
      {/if}


      <div class="text-left" role="presentation">
        <Label for="first-name" class="block mb-2">First Name<span class="text-red-600">&nbsp;*</span></Label>
        <Input
          id="first-name"
          bind:value={firstName}
          type="text"
          placeholder="First Name"
          disabled
          required
        /><br />
      </div>

      <div class="text-left">
        <Label for="first-name" class="block mb-2">Last Name<span class="text-red-600">&nbsp;*</span></Label>
        <Input
          id="last-name"
          bind:value={lastName}
          type="text"
          placeholder="Last Name"
          disabled
          required
        /><br />
      </div>

      <div class="text-left">
        <Label for="email" class="block mb-2">Email<span class="text-red-600">&nbsp;*</span></Label>
        <ButtonGroup class="w-full">
          <InputAddon>
            <EnvelopeSolid class="w-4 h-4" />
          </InputAddon>
          <Input
            id="email"
            bind:value={email}
            type="email"
            placeholder="Email"
            disabled
            required
          />
        </ButtonGroup><br /><br />
      </div>

      {#each event_custom_fields ?? [] as custom_field}
        {#if !custom_field.hidden}
          <div class="text-left mb-6">
            <Label
              for={custom_field.custom_field_id}
              class="block mb-2"
              color={validationErrors[custom_field.custom_field_id] ? "red" : "base"}
            >
              {custom_field.label}
              {#if custom_field.required}
                <span class="text-red-600">*</span>
              {/if}
            </Label>

            {#if custom_field.help_text !== null}
              <Helper class="mb-3">{custom_field.help_text}</Helper>
            {/if}

            {#if custom_field.choices !== null}
              <Select
                class="mt-2"
                required={custom_field.required}
                disabled={!custom_field.editable && old_student_responses_custom[custom_field.custom_field_id]}
                items={custom_field.choices.map((choice) => ({
                  value: choice,
                  name: choice,
                }))}
                bind:value={student_responses_custom[custom_field.custom_field_id]}
              />
            {:else}
                <Input
                  id={custom_field.custom_field_id}
                  bind:value={student_responses_custom[custom_field.custom_field_id]}
                  type="text"
                  required={custom_field.required}
                  disabled={!custom_field.editable && old_student_responses_custom[custom_field.custom_field_id]}
                  pattern={custom_field.regex || undefined}
                  color={validationErrors[custom_field.custom_field_id] ? "red" : "base"}
                  on:blur={() =>
                    validateInput(
                      custom_field.custom_field_id,
                      student_responses_custom[custom_field.custom_field_id],
                      custom_field.regex,
                    )}
                />
            {/if}
            {#if validationErrors[custom_field.custom_field]}
              <Helper class="mb-3" color="red"
                >Error: {validationErrors[custom_field.custom_field_id]}</Helper
              >
            {/if}
          </div>
        {/if}
      {/each}

      <Button type="submit" pill>Submit</Button>
    </form>
  -->
  </div>