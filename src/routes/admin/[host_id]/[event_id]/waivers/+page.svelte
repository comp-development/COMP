<script>
  import { Label, Select } from "flowbite-svelte";
  import { getEventInformation, updateEvent } from "$lib/supabase";
  import { page } from "$app/stores";
  import ConfirmationModal from "$lib/components/ConfirmationModal.svelte";
  import { handleError } from "$lib/handleError";
  import Loading from "$lib/components/Loading.svelte";
  import toast from "$lib/toast.svelte";
  import CustomForm from "$lib/components/CustomForm.svelte";

  const event_id = parseInt($page.params.event_id);
  let event = $state({});
  let waiverType = $state(null);
  let newWaiverType = $state(null);
  let showDeleteModal = $state(false);
  let loading = $state(false);

  let externalResponses = $state({});
  let externalValidationErrors = $state({});

  const externalFields = [
    {
      key: "instructions",
      label: "Instructions",
      custom_field_type: "paragraph",
      required: true,
      regex: null,
      placeholder: null,
      value: null,
      choices: null,
      editable: true,
      hidden: false,
    },
  ];

  (async () => {
    event = await getEventInformation(event_id);
    waiverType = event.waivers?.type || "none";
    loading = false;
  })();

  async function handleWaiverChange() {
    loading = true;
    try {
      waiverType = newWaiverType;

      event = await updateEvent(event_id, {
        waivers: { type: waiverType },
      });

      newWaiverType = null;
      toast.success("Waiver type updated successfully");
    } catch (e) {
      handleError(e);
    }
    showDeleteModal = false;
    loading = false;
  }

  async function handleSubmit() {
    try {
      console.log(externalResponses);

      event = await updateEvent(event_id, {
        waivers: { type: waiverType, ...externalResponses },
      });
      
      toast.success("Waiver type updated successfully");
    } catch (e) {
      handleError(e);
    }
  }
</script>

{#if loading}
  <Loading />
{:else}
  <h1>Waivers</h1>

  <div class="waiverDropdown flex items-start">
    <Label class="mr-2">Waiver Type</Label>
    <Select
      class="mt-2 w-auto"
      required
      items={[
        { value: "none", name: "No Waiver" },
        { value: "external", name: "External Waiver" },
        { value: "comp", name: "COMP Waiver" },
      ]}
      value={waiverType}
      on:change={(event) => {
        newWaiverType = event.target.value;
        event.target.value = waiverType;
        showDeleteModal = true;
      }}
    />
  </div>

  {#if waiverType == "none"}
    <div style="padding: 20px;">
      <p style="text-align: left;">No waiver is required for this event</p>
    </div>
  {:else if waiverType == "external"}
    <CustomForm
      fields={externalFields}
      bind:newResponses={externalResponses}
      bind:validationErrors={externalValidationErrors}
      {handleSubmit}
      showBorder={true}
    />
  {:else}
    <p>COMP Waiver is required for this event</p>
  {/if}
{/if}

<ConfirmationModal
  isShown={showDeleteModal}
  actionName="change the waiver"
  warning="This can have unintended consequences if students have already filled out waivers"
  onCancel={() => {
    showDeleteModal = false;
    newWaiverType = null;
  }}
  onConfirm={handleWaiverChange}
/>

<style>
  .waiverDropdown {
    align-items: center;
    justify-content: left;
    padding: 0px 20px;
  }

  :global(.waiverDropdown select) {
    margin-top: 0px;
  }
</style>
