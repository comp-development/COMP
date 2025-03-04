<script lang="ts">
  import CustomForm from "$lib/components/CustomForm.svelte";
  import { handleError } from "$lib/handleError";
  import { user } from "$lib/sessionStore";
  import { addOrganization, editOrganization } from "$lib/supabase";
  import toast from "$lib/toast.svelte";

  let {
    initial = { name: "", address: "" },
    org_id = null,
    typeOrgForm = "add",
  } = $props();
  let newResponses = $state({});
  let validationErrors = $state([]);

  async function handleAddOrganization() {
    try {
      const organization = await addOrganization(newResponses, $user.id);
      window.location.href = `/coach/${organization.org.org_id}`;
    } catch (e) {
      handleError(e);
    }
  }

  async function handleEditOrganization() {
    try {
      await editOrganization(newResponses, org_id);
      toast.success("Successfully updated organization.");
      document.location.reload();
    } catch (e) {
      handleError(e);
    }
  }
</script>

<CustomForm
  fields={[
    {
      name: "name",
      label: "Organization Name",
      type: "text",
      required: true,
      editable: true,
      value: initial.name,
    },
    {
      name: "address",
      label: "Address",
      type: "text",
      required: true,
      editable: true,
      value: initial.address,
    },
  ]}
  handleSubmit={typeOrgForm == "add"
    ? handleAddOrganization
    : handleEditOrganization}
  custom_fields={[]}
  bind:newResponses
  bind:validationErrors
/>
