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
    import { generateEmail } from "$lib/emailTemplate";

  let host_id = Number($page.params.host_id);
  let admin: any = $state();
  let loading = $state(true);
  let roles = $state([]);
  let deleteUserId = $state(null);
  let updateTrigger = $state(0);
  let isModalOpen = $state(false);
  let newResponses = $state<{email?: string; role?: string}>({});
  let validationErrors = $state({});
  let invites: {email: string, role: number}[] = $state([]);


  const fields = [
    {
      name: "role",
      label: "Role",
      required: true,
      editable: true,
      custom_field_type: "dropdown",
      placeholder: "Select a role",
      value: newResponses.role || "",
      choices: [
        "Grader - Can grade submissions and view results",
        "Admin - Full access to host settings and management"
        // { choice: "grader", name: "Grader - Can grade submissions and view results" },
        // { choice: "admin", name: "Admin - Full access to host settings and management" }
      ]
    },
    {
      name: "email",
      label: "Admin Emails",
      required: false,
      editable: true,
      custom_field_type: "text",
      placeholder: "",
      value: newResponses.email || "",
    }
  ];

  async function roleManager() {
    try {
      admin = await getAdmin($user!.id);
      let users = await getHostAdmins(host_id);

      let host = await getHostInformation(host_id);
      invites = host.invites || [];

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
      if (!newResponses.email) {
        throw new Error("Email is required");
      }
      let emails = newResponses.email.split(";");
      const host = await getHostInformation(host_id);
      const roleValue = fields.find((field) => field.name === "role")?.choices?.indexOf(newResponses.role || "");
      const data = await inviteUserToHost(host_id, emails, roleValue);
      invites = data.invites;

      for (let invite of data.newInvites) {
        const { email, role } = invite;

        const response = await fetch("/api/sendmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            subject: `Become an ${fields.find((field) => field.name === "role")?.choices?.[role].split(" - ")[0]} for '${host.host_name}' on COMP`,
            message: generateEmail('admin_invite', { host, host_id, admin }),
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`Failed to send email: ${data.error || response.statusText}`);
        }
        if (data.error) {
          throw data.error;
        }
      }

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
        <InvitedUser email={invitation.email} type="admin" id={host_id} />
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
      <p class="text-sm text-gray-600 dark:text-gray-400">Multiple emails should be separated by semi-colons</p>
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
