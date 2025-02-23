<script lang="ts">
  import CustomForm from "$lib/components/CustomForm.svelte";
  import MarkdownRender from "$lib/components/MarkdownRender.svelte";
  import { Textarea, Button } from "flowbite-svelte";

  let {
    newResponses = $bindable({}),
    validationErrors = $bindable({}),
    handleSubmit = () => {},
    handleSummaryUpdate = null,
    newForm = false,
  } = $props();

  let fields = $state([
    {
      name: "event_name",
      label: "Event Name",
      required: true,
      editable: true,
      custom_field_type: "text",
      placeholder: "Enter event name",
      value: newResponses.event_name || "",
    },
    {
      name: "event_date",
      label: "Event Date",
      required: true,
      editable: true,
      custom_field_type: "date",
      placeholder: "Select event date",
      value: newResponses.event_date || "",
    }
  ]);

  const editableFields = [
    {
      name: "ticket_price_cents",
      label: "Ticket Price (Cents)",
      required: true,
      editable: true,
      custom_field_type: "number",
      placeholder: "Enter ticket price",
      value: newResponses.ticket_price_cents || "",
    },
    {
      name: "max_team_size",
      label: "Maximum Team Size",
      required: true,
      editable: true,
      custom_field_type: "number",
      placeholder: "Enter maximum team size",
      value: newResponses.max_team_size || "",
    },
    {
      name: "email",
      label: "Contact Email",
      required: false,
      editable: true,
      custom_field_type: "email",
      placeholder: "Enter contact email",
      value: newResponses.email || "",
    },
    {
      name: "logo",
      label: "Logo URL",
      required: false,
      editable: true,
      custom_field_type: "text",
      placeholder: "Enter logo URL",
      value: newResponses.logo || "",
    },
  ];

  if (!newForm) {
    fields = [...fields, editableFields];
  }
</script>

<CustomForm
  {fields}
  bind:newResponses
  bind:validationErrors
  {handleSubmit}
  showBorder={true}
/>

{#if !newForm}
  <div class="grid">
    <div class="flex flex-col">
      <Textarea
        rows={20}
        bind:value={newResponses.summary}
        class="mb-2"
        placeholder="Enter event summary in markdown format..."
      />
      {#if handleSummaryUpdate}
        <Button pill color="primary" class="mt-2" onclick={handleSummaryUpdate}>
          Update Summary
        </Button>
      {/if}
    </div>

    <div>
      <h3 class="text-lg mb-2">Preview</h3>
      <MarkdownRender source={newResponses.summary || ""} />
    </div>
  </div>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: 49% 50%;
    gap: 20px;
    padding: 30px;
  }
</style>
