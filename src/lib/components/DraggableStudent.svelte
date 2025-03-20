<script lang="ts">
  import { Badge } from "flowbite-svelte";
  import Modal from "./Modal.svelte";
  import {
    PenSolid,
    TrashBinSolid,
    FileCheckSolid,
    FilePenSolid,
  } from "flowbite-svelte-icons";
  import StudentForm from "$lib/components/StudentForm.svelte";
  import { user } from "$lib/sessionStore";

  const {
    team_member,
    onDragStart,
    event_id,
    onDeleteStudent,
    editableFeatures = true,
    waiverType="none"
  } = $props();

  let isEditModalOpen = $state(false);

  const openEditModal = () => {
    isEditModalOpen = true;
  };
</script>

<div
  class="teamMember"
  style="cursor: {editableFeatures ? 'move' : 'default'};"
  draggable={editableFeatures}
  ondragstart={(e) => onDragStart(e, team_member)}
>
  <div class="ml-2">
    <div class="flex">
      <span id="waiverIcon">
        <a href={(waiverType != "none" && $user.id == team_member.student_id) ? (team_member.waiver ?? `./${event_id}/waiver`) : ""}>
          <Badge rounded large color={waiverType != "none" ? (team_member.waiver ? "green" : "red") : "dark"}>
            {#if team_member.front_id}
              {team_member.front_id}
            {/if}
            {#if waiverType != "none"}
              {#if team_member.waiver}
                <FileCheckSolid class="w-5 h-5" />
              {:else}
                <FilePenSolid class="w-5 h-5" />
              {/if}
            {/if}
          </Badge>
        </a>
      </span>
      <div class="ml-2">
        <p
          class="font-bold text-gray-800"
          style="display: flex; align-items: center; justify-content: left;"
        >
          {team_member.person.first_name}
          {team_member.person.last_name}
        </p>
        <p class="text-sm text-gray-600" style="overflow-wrap: anywhere;">
          {team_member.person.email ?? "No associated email."}
        </p>
      </div>
    </div>
  </div>

  {#if editableFeatures}
    <div class="flex flex-col items-center space-y-1">
      <button
        class="hover:bg-blue-100 rounded-lg"
        aria-label="Edit"
        onclick={openEditModal}
      >
        <PenSolid class="w-5 h-5" />
      </button>
      <button
        class="hover:bg-red-100 rounded-lg"
        aria-label="Delete"
        onclick={(event) => onDeleteStudent(event, team_member)}
      >
        <TrashBinSolid class="w-5 h-5" />
      </button>
    </div>
  {/if}
</div>

<div class="modalExterior secondPlaneModal">
  <Modal bind:open={isEditModalOpen}>
    <div class="specificModalMax">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">
        Edit Student
      </h3>
      <StudentForm
        title=""
        student_event={team_member}
        user={team_member.person}
        event_id={team_member.event_id}
        editing
      />
    </div>
  </Modal>
</div>

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

  :global(.secondPlaneModal) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 99999999;
    pointer-events: all;
    display: contents;
  }

  :global(.secondPlaneModal div) {
    pointer-events: all;
    z-index: 99999999;
  }
</style>
