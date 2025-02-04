<script lang="ts">
  import CustomForm from "$lib/components/CustomForm.svelte";
  import {
    getEventCustomFields,
    getCustomFieldResponses,
    upsertCustomFieldResponses,
    upsertOrgEvent,
  } from "$lib/supabase";
  import { handleError } from "$lib/handleError";

  let {
    org = $bindable(null),
    event_id,
    title = null,
    org_id = null,
  } = $props();

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
      event.preventDefault();

      org = await upsertOrgEvent(event_id, org_id);

      const customFieldResponses = Object.fromEntries(
        Object.entries(newResponses).filter(([key]) => !isNaN(Number(key))),
      );

      await upsertCustomFieldResponses(
        customFieldResponses,
        org.org_event_id,
        "orgs",
      );

      //Handle payment

      document.location.reload();
      return;
    } catch (error) {
      handleError(error);
    }
  }

  (async () => {
    custom_fields = await getEventCustomFields(event_id, "orgs");

    custom_fields = await getCustomFieldResponses(
      custom_fields,
      org_id,
      "orgs",
    );

    //fix this component to use event_custom_fields

    token = data.session?.access_token ?? null;
  })();
</script>

<CustomForm
  {title}
  fields={[]}
  {custom_fields}
  bind:initialResponses
  bind:newResponses
  bind:validationErrors
  {handleSubmit}
/>
