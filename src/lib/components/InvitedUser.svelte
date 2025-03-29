<script lang="ts">
  import { Badge } from "flowbite-svelte";
  import { TrashBinSolid } from "flowbite-svelte-icons";
  import ConfirmationModal from "$lib/components/ConfirmationModal.svelte";
  import {
    removeUserInvitationFromHost,
    removeUserInvitationFromOrgEvent,
    removeUserInvitationFromTeam,
  } from "$lib/supabase";
  import toast from "$lib/toast.svelte";
  import { handleError } from "$lib/handleError";

  const { email, type, id, event_id = null, onDeleteAction = () => {} } = $props();

  let showDeleteModal = $state(false);

  async function onDeleteInvitation() {
    try {
      if (type == "independentTeam") {
        await removeUserInvitationFromTeam(id, email);
      } else if (type == "admin") {
        await removeUserInvitationFromHost(id, email);
      } else if (type == "coachOrg") {
        await removeUserInvitationFromOrgEvent(id, event_id, email);
      }

      await onDeleteAction();
      toast.success("You have successfully deleted the invitation!");
    } catch (e) {
      handleError(e);
    }

    showDeleteModal = false;
  }
</script>

<div class="teamMember">
  <div class="flex">
    <div>
      <Badge rounded large color="yellow">Invited</Badge>
    </div>
    <div class="ml-2">
      <p class="font-medium text-gray-800">
        {email}
      </p>
    </div>
  </div>
  <div class="flex">
    <button
      class="hover:bg-red-100 rounded-lg"
      aria-label="Delete"
      onclick={() => (showDeleteModal = true)}
    >
      <TrashBinSolid class="w-5 h-5" />
    </button>
  </div>
</div>

<ConfirmationModal
  isShown={showDeleteModal}
  actionName="delete this invitation"
  onCancel={() => {
    showDeleteModal = false;
  }}
  onConfirm={onDeleteInvitation}
/>

<style>
  .teamMember {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid black;
    padding: 5px;
    margin-top: 10px;
    position: relative;
    border-radius: 15px;
    transition: transform 0.2s ease;
  }

  .teamMember:hover {
    transform: scale(1.01);
  }
</style>