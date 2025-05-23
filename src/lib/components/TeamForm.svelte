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
    upsertTeam,
  } from "$lib/supabase";
  import { handleError } from "$lib/handleError";

  // Maximum length for team name
  const MAX_TEAM_NAME_LENGTH = 40;

  let {
    team = $bindable(),
    event_id,
    title = null,
    org_id = null,
    afterSubmit = async () => {},
    editing=false
  } = $props();

  let token: string | null = null;

  let newResponses = $state({});
  let initialResponses = $state({});
  let validationErrors = $state({});
  let custom_fields = $state([]);

  async function handleSubmit(event: Event) {
    try {
      if (team) {
        team = await upsertTeam(event_id, {
          team_id: team.team_id,
          team_name: newResponses.team_name,
        });
      } else {
        team = await upsertTeam(event_id, {
          team_name: newResponses.team_name,
          org_id,
        });
      }
    } catch (error) {
      console.log("TeamSubmitError", error);
      if (error.code === "23505") {
        validationErrors["team_name"] = "Team name already exists.";
        return;
      } else {
        error.message = `Error upserting team: ${error.message}`;
        handleError(error);
      }
    }
    console.log("team", team);
    const customFieldResponses = Object.fromEntries(
      Object.entries(newResponses).filter(([key]) => !isNaN(Number(key))),
    );

    try {
      await upsertCustomFieldResponses(
        customFieldResponses,
        team.team_id,
        "teams",
      );
    } catch (error) {
      error.message = `Error saving team custom field responses: ${error.message}`;
      handleError(error);
      return;
    }
    await afterSubmit(team);
    //document.location.reload();
    return;
  }

  (async () => {
    custom_fields = await getEventCustomFields(event_id, "teams");
    custom_fields = await getCustomFieldResponses(
      custom_fields,
      team?.team_id,
      "teams",
    );
    //token = data.session?.access_token ?? null;
  })();
</script>

<CustomForm
  title={title ?? (editing ? "Edit Team" : "Create Team")}
  fields={[
    {
      event_custom_field_id: "team_name",
      key: "team_name",
      label: "Team Name",
      required: true,
      regex: new RegExp(`^.{1,${MAX_TEAM_NAME_LENGTH}}$`),
      regex_error_message: `Team name must be ${MAX_TEAM_NAME_LENGTH} characters or less`,
      placeholder: "Enter team name",
      value: team?.team_name ?? null,
      choices: null,
      editable: true,
      hidden: false,
    },
  ]}
  {custom_fields}
  bind:newResponses
  bind:validationErrors
  {handleSubmit}
  buttonText={editing ? "Save" : "Submit"}
/>
