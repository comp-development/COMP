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
    import { getEventCustomFields, getCustomFieldResponses, upsertCustomFieldResponses, upsertTeam } from "$lib/supabase";
    import { handleError } from "$lib/handleError";

    let { team = $bindable(), event_id, title = null, org_id = null, afterSubmit = async () => {} } = $props();

    let token: string | null = null;

    let newResponses = $state({});
    let initialResponses = $state({});
    let validationErrors = $state({});
    let custom_fields = $state([]);

  async function handleSubmit(event) {
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
      console.log("TeamSubmitError", error)
      if (error.code === "23505") {
        validationErrors["team_name"] = "Team name already exists.";
        return
      } else {
        error.message = `Error upserting team: ${error.message}`
        handleError(error);
      }
    }
    console.log("team", team)
    const customFieldResponses = Object.fromEntries(
        Object.entries(newResponses).filter(([key]) => !isNaN(Number(key)))
    );

    try {
      await upsertCustomFieldResponses(customFieldResponses, team.team_id, 'teams');
    } catch (error) {
      error.message = `Error saving team custom field responses: ${error.message}`
      handleError(error);
      return
    }
    await afterSubmit(team);
    //document.location.reload();
    return
  }

    (async () => {
        custom_fields = await getEventCustomFields(event_id, "teams");
        custom_fields = await getCustomFieldResponses(custom_fields, team?.team_id, "teams")
        //token = data.session?.access_token ?? null;
    })();
</script>

<CustomForm {title} fields={
  [
    {
        event_custom_field_id: "team_name", 
        key: "team_name",
        label: "Team Name",
        required: true,
        regex: null,
        placeholder: null,
        value: team?.team_name ?? null,
        choices: null,
        editable: true,
        hidden: false
    }
  ]
} {custom_fields} bind:newResponses bind:validationErrors handleSubmit={handleSubmit}/>