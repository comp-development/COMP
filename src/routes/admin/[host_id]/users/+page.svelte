<script lang="ts">
  import { handleError } from "$lib/handleError";
  import { getHostAdmins, removeAdminFromHost, getHostInformation } from "$lib/supabase";
  import Loading from "$lib/components/Loading.svelte";
  import TableName from "$lib/components/TableName.svelte";
  import { page } from "$app/stores";
  import CustomForm from "$lib/components/CustomForm.svelte";
  import { Button, Modal } from "flowbite-svelte";
  import { CirclePlusSolid } from "flowbite-svelte-icons";
  import { hashString } from "$lib/encrypt";
  import toast from "$lib/toast.svelte";

  let host_id = Number($page.params.host_id);
  let loading = $state(true);
  let roles = $state([]);
  let deleteUserId = $state(null);
  let updateTrigger = $state(0);
  let isModalOpen = $state(false);
  let newResponses = $state({});
  let validationErrors = $state({});

  const fields = [
    {
      name: "email",
      label: "Admin Email",
      required: false,
      editable: true,
      custom_field_type: "email",
      placeholder: "Enter admin email",
      value: newResponses.email || "",
    },
  ];

  async function roleManager() {
    try {
      let users = await getHostAdmins(host_id);
      users.sort((a, b) => {
        return a.person.first_name
          .toLowerCase()
          .localeCompare(b.person.first_name.toLowerCase());
        });
      roles = users;
      loading = false;
    } catch (error) {
      handleError(error);
    }
  }

  async function handleDeleteAdmin() {
    try {
      roles = [
        ...roles.filter((admin) => admin.admin_id !== deleteUserId),
      ];
      await removeAdminFromHost(deleteUserId, host_id);
      updateTrigger += 1;
    } catch (error) {
      handleError(error);
    }
  }

  async function handleSubmit() {
    try {
      const encode = await hashString(host_id+"");
      const host = await getHostInformation(host_id);

      const response = await fetch('/api/sendmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newResponses.email,
          subject: `Join ${host.host_name} on COMP`,
          message: `You have been invited to join ${host.host_name} on COMP! To accept the invitation, click on <a href="https://comp.mt/join-host?hashed_host_id=${encode}&host_id=${host_id}&email=${newResponses.email}">the following link</a>.`
        })
      });

      const data = await response.json();
      if (data.error) { throw data.error; }

      toast.success("Email sent successfully");
      isModalOpen = false;
    } catch (e) {
      handleError(e);
    }
  }

  roleManager();
</script>

{#if loading}
  <Loading />
{:else}
  <br />
  <h1>Host Admins</h1>
  <br />
  <Button outline pill color="primary" onclick={() => (isModalOpen = true)}>
    <CirclePlusSolid class="w-4 h-4 me-2" />
    Add Admin
  </Button>

  <div style="max-width: 600px; margin: 10px auto;">
    {#key updateTrigger}
      <TableName
        items={roles}
        actionType="delete"
        action={handleDeleteAdmin}
        columns={[
            {
            label: "First Name",
            value: (item) => item.person.first_name,
            sortable: true,
            },
            {
            label: "Last Name",
            value: (item) => item.person.last_name,
            sortable: true,
            }
        ]}
        bind:deleteUserId
      />
    {/key}
  </div>
{/if}

<div class="modalExterior">
  <Modal bind:open={isModalOpen} size="md" autoclose={false}>
    <div class="specificModalMax">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">
        Add User
      </h3>
      <CustomForm
        {fields}
        bind:newResponses
        bind:validationErrors
        {handleSubmit}
        showBorder={false}
      />
    </div>
  </Modal>
</div>

<style>
  :global(.specificModalMax .registrationForm .relative div) {
    justify-content: left !important;
  }

  :global(.specificModalMax .registrationForm) {
    padding: 0px;
  }
</style>