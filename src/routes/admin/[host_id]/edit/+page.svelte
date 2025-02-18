<script lang="ts">
  import { page } from "$app/stores";
  import { handleError } from "$lib/handleError";
  import Loading from "$lib/components/Loading.svelte";
  import CustomForm from "$lib/components/CustomForm.svelte";
  import MarkdownRender from "$lib/components/MarkdownRender.svelte";
  import {
    getHostInformation,
    updateHost
  } from "$lib/supabase";
  import toast from "$lib/toast.svelte";
  import { Textarea, Button } from "flowbite-svelte";

  const host_id = parseInt($page.params.host_id);
  let loading = $state(true);
  let newResponses = $state({});
  let validationErrors = $state({});
  let summary = $state("");

  async function fetchHost() {
    try {
      const host = await getHostInformation(host_id);
      newResponses = {
        host_name: host.host_name,
        logo: host.logo,
        email: host.email,
      };
      summary = host.summary || "";
      loading = false;
    } catch (error) {
      handleError(error);
    }
  }

  let hostFields = $derived([
    {
      name: "host_name",
      label: "Host Name",
      required: true,
      editable: true,
      custom_field_type: "text",
      value: newResponses.host_name,
    },
    {
      name: "logo",
      label: "Logo URL",
      required: true,
      editable: true,
      custom_field_type: "text",
      value: newResponses.logo,
    },
    {
      name: "email",
      label: "Email",
      required: true,
      editable: true,
      custom_field_type: "email",
      value: newResponses.email,
    },
  ]);

  async function handleSubmit() {
    try {
      await updateHost(host_id, newResponses);
      toast.success("Host information updated successfully");
    } catch (error) {
      handleError(error);
    }
  }

  async function handleSummaryUpdate() {
    try {
      await updateHost(host_id, { summary });
      toast.success("Host summary updated successfully");
    } catch (error) {
      handleError(error);
    }
  }

  fetchHost();
</script>

{#if loading}
  <Loading />
{:else}
  <div class="p-4">
    <h1>Edit Host Information</h1>

    <CustomForm
      fields={hostFields}
      bind:newResponses
      bind:validationErrors
      {handleSubmit}
      showBorder={true}
    />

    <div class="grid">
      <div class="flex flex-col">
        <Textarea
          rows={20}
          bind:value={summary}
          class="mb-2"
          placeholder="Enter host summary in markdown format..."
        />
        <Button pill color="primary" class="mt-2" onclick={handleSummaryUpdate}>
          Update Summary
        </Button>
      </div>

      <div>
        <h3 class="text-lg mb-2">Preview</h3>
        <MarkdownRender source={summary} />
      </div>
    </div>
  </div>
{/if}

<style>
  :global(textarea) {
    font-family: monospace;
  }

  .grid {
    display: grid;
    grid-template-columns: 49% 50%;
    gap: 20px;
    padding: 30px;
  }
</style>
