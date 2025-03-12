<script lang="ts">
  import { handleError } from "$lib/handleError";
  import {
    getHostAdmins,
    removeAdminFromHost,
    getHostInformation,
    inviteUserToHost,
    getAdmin,
  } from "$lib/supabase";
  import Loading from "$lib/components/Loading.svelte";
  import TableName from "$lib/components/TableName.svelte";
  import { page } from "$app/stores";
  import CustomForm from "$lib/components/CustomForm.svelte";
  import { Button, Modal } from "flowbite-svelte";
  import { CirclePlusSolid } from "flowbite-svelte-icons";
  import toast from "$lib/toast.svelte";
    import { user } from "$lib/sessionStore";
    import InvitedUser from "$lib/components/InvitedUser.svelte";

  let host_id = Number($page.params.host_id);
  let admin: any = $state();
  let loading = $state(true);
  let roles = $state([]);
  let deleteUserId = $state(null);
  let updateTrigger = $state(0);
  let isModalOpen = $state(false);
  let newResponses = $state({});
  let validationErrors = $state({});
  let invites = $state([]);

  const fields = [
    {
      name: "email",
      label: "Admin Emails",
      required: false,
      editable: true,
      custom_field_type: "text",
      placeholder: "",
      value: newResponses.email || "",
    },
  ];

  async function roleManager() {
    try {
      admin = await getAdmin($user!.id);
      let users = await getHostAdmins(host_id);

      let host = await getHostInformation(host_id);
      invites = host.invites;

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
      roles = [...roles.filter((admin) => admin.admin_id !== deleteUserId)];
      await removeAdminFromHost(deleteUserId, host_id);
      updateTrigger += 1;
    } catch (error) {
      handleError(error);
    }
  }

  async function handleSubmit() {
    try {
      let emails = newResponses.email.split(";");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (const email of emails) {
        if (!emailRegex.test(email.trim())) {
          throw new Error("One or more of the emails are invalid");
        }
      }

      const host = await getHostInformation(host_id);
      const data = await inviteUserToHost(host_id, emails);
      emails = data.newInvites;
      invites = data.invites;

      for (let email of emails) {
        email = email.trim();

        const response = await fetch("/api/sendmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            subject: `Join ${host.host_name} on COMP`,
            message: `
          <div style="font-family: Arial, sans-serif; color: black; text-align: center; padding: 20px; border: 1px solid black; border-radius: 10px;">
            <div style="display: flex; align-items: center; justify-content: center;">
              <img src=${host.logo} width="100px" style="border-radius: 50px; margin-left: auto; margin-right: auto;" />
            </div>
            <h2 style="color: black;">You're Invited to ${host.host_name} on COMP!</h2>
            <p>You have been invited to become an admin on <strong>${host.host_name}</strong> on COMP by <strong>${admin.first_name} ${admin.last_name}</strong>!</p>
            <p>To accept the invitation, click the button below:</p>
            <a href="https://comp.mt/join-host?host_id=${host_id}&email=${email}" 
              style="display: inline-block; padding: 10px 20px; margin: 10px 0; color: white; background-color: black; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
        `,
          }),
        });

        const data = await response.json();
        if (data.error) {
          throw data.error;
        }
      }

      toast.success("Emails sent successfully");
      isModalOpen = false;
    } catch (e) {
      handleError(e);
      isModalOpen = false;
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
    Invite Admin
  </Button>

  <div style="max-width: 600px; margin: 10px auto;">
    <div style="padding: 20px">
      <h3>Invited</h3>
      {#each invites as invitation}
        <InvitedUser email={invitation} type="admin" id={host_id} onDeleteAction={() => { invites = invites.filter((invite: string) => invite !== invitation); }} />
      {/each}
      {#if invites.length == 0}
        <p>No outgoing invitations</p>
      {/if}
    </div>

    <h3>Members</h3>
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
          },
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
      <p class="text-sm text-gray-600 dark:text-gray-400">Multiple emails should be separated by a semi-colon</p>
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
