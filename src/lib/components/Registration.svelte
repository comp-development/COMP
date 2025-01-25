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
    } from "flowbite-svelte";
    import { EnvelopeSolid } from "flowbite-svelte-icons";
    import toast from "$lib/toast.svelte";
    import { getEventCustomFields } from "$lib/supabase";
    import { handleError } from "$lib/handleError";

    let { userType, user, event_id } = $props();

    let token: string | null = null;

    let selectedOption = $state("create_team");
    let firstName = $state("");
    let lastName = $state("");
    let email = $state("");
    let input_team_join_code = $state("");
    let input_org_join_code = $state("");
    let student_responses_custom = $state({});
    let validation_errors = $state({});
    let event_custom_fields = $state(null);

    function validateInput(key, value, regex) {
        if (regex) {
        const pattern = new RegExp(regex);
        validation_errors[key] = !pattern.test(value)
            ? "Invalid input. Please follow the format."
            : null;
        } else {
        validation_errors[key] = null;
        }
    }

    function hovered(is_disabled: boolean) {
        if (is_disabled) {
        toast.warning("This field is disabled since it cannot be edited after being submitted.");
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
        firstName = user?.first_name;
        lastName = user?.last_name;
        email = user?.email;

        event_custom_fields = await getEventCustomFields(event_id, getUserTypeDatabase(userType));

        for (var custom_field in event_custom_fields) {
            student_responses_custom[custom_field?.key] = null;
        }

        token = data.session?.access_token ?? null;
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
        <h2>Student Registration Form</h2>
      </TabItem>
    </Tabs>

    <br />

    <form onsubmit={handleSubmit}>
      {#if selectedOption === "join_team"}
        <div class="text-left">
          <Label for="team-join-code" class="block mb-2">Team Join Code</Label
          >
          <Input
            id="team-join-code"
            bind:value={input_team_join_code}
            type="text"
            placeholder="Team Join Code"
            required
          /><br />
        </div>
      {:else if selectedOption === "join_org"}
        <div class="text-left">
          <Label for="org-join-code" class="block mb-2"
            >Organization Join Code</Label
          >
          <Input
            id="org-join-code"
            bind:value={input_org_join_code}
            type="text"
            placeholder="Organization Join Code"
            required
          /><br />
        </div>
      {/if}

      <div class="text-left" onmouseenter={() => hovered(true)} role="presentation">
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

      <div class="text-left" onmouseenter={() => hovered(true)}>
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

      <div class="text-left" onmouseenter={() => hovered(true)}>
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
          <div class="text-left mb-6" onmouseenter={() => hovered(!custom_field.editable)}>
            <Label
              for={custom_field.key}
              class="block mb-2"
              color={validation_errors[custom_field.key] ? "red" : null}
            >
              {custom_field.label}
              {#if custom_field.required}
                <span class="text-red-600">&nbsp;*</span>
              {/if}
            </Label>

            {#if validation_errors[custom_field.key]}
              <Helper class="mb-3" color="red"
                >Error: {validation_errors[custom_field.key]}</Helper
              >
            {/if}
            {#if custom_field.help_text !== null}
              <Helper class="mb-3">{custom_field.help_text}</Helper>
            {/if}

            {#if custom_field.choices !== null}
              <Select
                class="mt-2"
                required={custom_field.required}
                disabled={!custom_field.editable}
                items={custom_field.choices.map((choice) => ({
                  value: choice,
                  name: choice,
                }))}
                bind:value={student_responses_custom[custom_field.key]}
              />
            {:else}
              <Input
                id={custom_field.key}
                bind:value={student_responses_custom[custom_field.key]}
                type="text"
                required={custom_field.required}
                disabled={!custom_field.editable}
                pattern={custom_field.regex || undefined}
                color={validation_errors[custom_field.key] ? "red" : null}
                on:blur={() =>
                  validateInput(
                    custom_field.key,
                    student_responses_custom[custom_field.key],
                    custom_field.regex,
                  )}
              />
            {/if}
          </div>
        {/if}
      {/each}

      <Button type="submit" pill>Submit</Button>
    </form>
  </div>