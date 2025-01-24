<script lang="ts">
  import { page } from "$app/stores";
  import {
    Button,
    Badge,
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
  import Loading from "$lib/components/Loading.svelte";
  import { user } from "$lib/sessionStore";
  import {
    getEventInformation,
    getStudentEvent,
    getStudentOrgEvent,
    getStudentTicketOrder,
    getStudent,
    getEventCustomFields,
  } from "$lib/supabase";
  import type { Tables } from "../../../../db/database.types";
  import { supabase } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";

  const event_id = parseInt($page.params.event_id);
  let student_event_details:
    | (Tables<"student_events_detailed"> & {
        teams: Tables<"teams"> & {
          student_events_detailed: Tables<"student_events_detailed">[];
        };
      })
    | null = null;
  let event_details: Tables<"events"> | null = $state(null);
  let student_org_event:
    | (Tables<"student_org_events"> & { org_events: Tables<"org_events"> })
    | null = null;
  let team:
    | (Tables<"teams"> & {
        student_events_detailed: Tables<"student_events_detailed">[];
      })
    | undefined
    | null = $state(null);
  let ticket_order: Tables<"ticket_orders"> | null = null;
  let in_team = $state(false);
  let in_org = $state(false);
  let transaction_stored = $state(false);
  let event_custom_fields = $state(null);

  let loading = $state(true);
  let token: string | null = null;

  let selectedOption = $state("create_team");
  let firstName = $state("");
  let lastName = $state("");
  let email = $state("");
  let input_team_join_code = $state("");
  let input_org_join_code = $state("");
  let student_responses_custom = $state({});
  let validation_errors = $state({});

  (async () => {
    student_event_details = await getStudentEvent($user!.id, event_id);
    student_org_event = await getStudentOrgEvent($user!.id, event_id);
    ticket_order = await getStudentTicketOrder($user!.id, event_id);
    in_team = student_event_details != null;
    in_org = student_org_event != null;

    let student = await getStudent($user!.id);
    firstName = student?.first_name;
    lastName = student?.last_name;
    email = $user?.email;

    event_custom_fields = await getEventCustomFields(event_id, "students");

    for (var custom_field in event_custom_fields) {
      student_responses_custom[custom_field?.key] = null;
    }

    console.log(event_custom_fields);

    team = student_event_details?.teams;
    team?.student_events_detailed.sort((a, b) =>
      (a?.front_id ?? "") < (b?.front_id ?? "") ? -1 : 1,
    );

    event_details = await getEventInformation(event_id);

    const { data, error } = await supabase.auth.getSession();
    if (error != null) {
      handleError(error);
    }
    token = data.session?.access_token ?? null;

    loading = false;
  })();

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

  function hovered(is_disabled: boolean) {
    if (is_disabled) {
      toast.warning("This field is disabled since it cannot be edited after being submitted.");
    }
  }
</script>

{#if loading}
  <Loading />
{:else}
  <br />
  <h1>{event_details?.event_name}</h1>
  <h2 style="font-weight: 500">{event_details?.event_date}</h2>

  {#if !in_org && !in_team}
    <div class="registrationForm">
      {#if transaction_stored}
        <p>
          Payment found, but registration is not complete. Please fill out the
          following form to proceed.
        </p>
        <br />
      {/if}

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
  {/if}

  <!-- Additional conditions for team and org information -->
  {#if in_team}
    <br />
    <p style="text-align: center;">
      Welcome to this tournament! Below is the information for the team you are
      registered in. If there is an issue, update the team information on
      ContestDojo or email <a href="mailto:tournament@mustangmath.com"
        >tournament@mustangmath.com</a
      >
    </p>
    <br />
    <div class="flex">
      <Button href={"/student/" + event_id + "/tests"} pill>Take Tests</Button>
    </div>
    <br />

    <div class="team_info">
      <p style="font-weight: bold; font-size: 20px; align-items: left">
        {team?.team_name}
      </p>
      {#if team?.division}<p>{team?.division} Division</p>{/if}

      {#each team?.student_events_detailed ?? [] as teamMember}
        <div style="display: flex; align-items: center;">
          {#if teamMember.front_id}
            <Badge color={teamMember.student_id == $user?.id ? "green" : "dark"}
              >{teamMember.front_id}</Badge
            >
          {/if}
          <div style="display:flex">
            <p>
              {teamMember.first_name}
              {teamMember.last_name}
            </p>
            <p style="margin-left: 10px">
              <em>{teamMember.email}</em>
            </p>
          </div>
        </div>
      {/each}
    </div>
  {:else if in_org}
    <p>Not yet assigned team by org</p>
  {/if}
  {#if in_org}
    <!-- TODO: org info -->
    {#if !purchase_ticket}
      <button onclick={purchase_ticket({})}
        >Purchase Individual Ticket (check with your organization if you need to
        do so)</button
      >
    {/if}
  {/if}
{/if}

<style>
  h1 {
    text-align: center;
  }

  .team_info {
    padding: 10px;
    margin: 20px;
    border: 2px solid var(--primary-light);
    border-radius: 10px;
  }

  .registrationForm {
    padding: 30px;
  }

  form {
    border: 3px solid var(--primary-tint);
		padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    border-radius: 20px;
  }
</style>
