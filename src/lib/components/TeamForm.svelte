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

    let { team = $bindable(null), event_id, title = null, org_id = null } = $props();

    let token: string | null = null;

    let newResponses = $state({});
    let initialResponses = $state({});
    let validationErrors = $state({});
    let custom_fields = $state([]);

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
      error.message = `Error adding student to org in event: ${error.message}`
      handleError(error);
    }

    const customFieldResponses = Object.fromEntries(
        Object.entries(newResponses).filter(([key]) => !isNaN(Number(key)))
    );

    try {
      await upsertCustomFieldResponses(customFieldResponses, team.team_id, 'teams');
    } catch (error) {
      error.message = `Error saving student custom field responses: ${error.message}`
      handleError(error);
      return
    }
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