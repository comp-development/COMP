<script lang="ts">
  import { page } from "$app/stores";
  import { handleError } from "$lib/handleError";
  import Loading from "$lib/components/Loading.svelte";
  import CustomForm from "$lib/components/CustomForm.svelte";
  import MarkdownRender from "$lib/components/MarkdownRender.svelte";
  import {
    getHostInformation,
    updateHost,
    getHostAdmins,
    getAllAdminsOutsideHost,
    addAdminToHost,
    removeAdminFromHost,
  } from "$lib/supabase";
  import toast from "$lib/toast.svelte";
  import { Textarea, Button } from "flowbite-svelte";
  import TableName from "$lib/components/TableName.svelte";
  import { Modal } from "flowbite-svelte";
  import { CirclePlusSolid } from "flowbite-svelte-icons";

  const host_id = parseInt($page.params.host_id);
  let loading = $state(true);
  let newResponses = $state({});
  let validationErrors = $state({});
  let summary = $state("");
  let isAdminModalOpen = $state(false);
  let hostAdmins = $state([]);
  let availableAdmins = $state([]);
  let deleteUserId = $state(false);
  let updateTrigger = $state(0);

  async function fetchHost() {
    try {
      const host = await getHostInformation(host_id);
      newResponses = {
        host_name: host.host_name,
        logo: host.logo,
        email: host.email,
      };
      summary = host.summary || "";
      await loadHostAdmins();
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

  async function loadHostAdmins() {
    try {
      hostAdmins = await getHostAdmins(host_id);
    } catch (error) {
      handleError(error);
    }
  }

  async function openAdminModal() {
    try {
      availableAdmins = await getAllAdminsOutsideHost(host_id);
      isAdminModalOpen = true;
    } catch (error) {
      handleError(error);
    }
  }

  async function selectAdmin(e, admin) {
    try {
      await addAdminToHost(admin.admin_id, host_id);

      hostAdmins = [
        ...hostAdmins,
        {
          person: {
            first_name: admin.person.first_name,
            last_name: admin.person.last_name,
            email: admin.person.email,
          },
          admin_id: admin.admin_id,
        },
      ];

      availableAdmins = [
        ...availableAdmins.filter((admin) => admin.admin_id !== deleteUserId),
      ];

      updateTrigger += 1;
      toast.success("Added admin to this host");
      isAdminModalOpen = false;
    } catch (error) {
      handleError(error);
    }
  }

  async function handleDeleteAdmin() {
    try {
      await removeAdminFromHost(deleteUserId, host_id);

      const removedAdmin = hostAdmins.find(
        (admin) => admin.admin_id === deleteUserId,
      );

      hostAdmins = [
        ...hostAdmins.filter((admin) => admin.admin_id !== deleteUserId),
      ];

      if (removedAdmin) {
        availableAdmins = [
          ...availableAdmins,
          {
            person: {
              first_name: removedAdmin.person.first_name,
              last_name: removedAdmin.person.last_name,
              email: removedAdmin.person.email,
            },
            admin_id: removedAdmin.admin_id,
          },
        ];
      }

      updateTrigger += 1;
      toast.success("Successfully removed admin from host");
      window.location.reload();
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

    <div class="mt-8">
      <h2 class="mb-4">Manage Host Admins</h2>
      <Button outline pill color="primary" on:click={openAdminModal}>
        <CirclePlusSolid class="w-4 h-4 me-2" />
        Add Admin
      </Button>

      <div class="tableMax">
        {#key updateTrigger}
          <TableName
            actionType="delete"
            items={hostAdmins}
            action={handleDeleteAdmin}
            bind:deleteUserId
          />
        {/key}
      </div>
    </div>
  </div>
  <br />
{/if}

<Modal bind:open={isAdminModalOpen} size="md" autoclose={false}>
  <h3 class="text-xl font-medium text-gray-900 dark:text-white">
    Select Admin
  </h3>
  <div class="tableMaxHeight">
    {#key updateTrigger}
      <TableName
        actionType="select_student"
        items={availableAdmins}
        action={selectAdmin}
        {host_id}
      />
    {/key}
  </div>
</Modal>

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

  .tableMax {
    max-width: 800px;
    margin: 0 auto;
  }

  .tableMaxHeight {
    max-height: 500px;
    overflow-y: scroll;
  }
</style>
