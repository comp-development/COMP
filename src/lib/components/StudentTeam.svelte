<script lang="ts">
  import { PenSolid, TrashBinSolid, UserAddSolid } from "flowbite-svelte-icons";
  import DraggableStudent from "./DraggableStudent.svelte";
  import CopyText from "./CopyText.svelte";
  import { updateStudentTeam } from "$lib/supabase";
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";
  import { Modal } from "flowbite-svelte";
  import InfoToolTip from "$lib/components/InfoToolTip.svelte";
  import TableName from "$lib/components/TableName.svelte";
  import ConfirmationModal from "$lib/components/ConfirmationModal.svelte";
  import TeamForm from "$lib/components/TeamForm.svelte";

  let {
    event_id,
    org_id,
    team = $bindable(),
    onDrop,
    onDragStart,
    onDeleteStudent,
    handleDragOver,
    editableFeatures = true,
    showTeamCode = false,
    handleDragLeave,
    studentsWithoutTeams = $bindable(),
    maxTeamSize,
    handleDeleteTeam,
    showDeleteTeamConfirmation = $bindable(),
    deleteTeamId = $bindable(),
  } = $props();

  let isStudentModalOpen = $state(false);
  let isTeamModalOpen = $state(false);

  function openStudentModal(team_id: number) {
    isStudentModalOpen = true;
  }

  async function selectStudent(e, student) {
    try {
      e.preventDefault();

      if (!team) {
        toast.error("No teams available to assign the student.");
        return;
      }

      if (team.teamMembers.length >= (maxTeamSize ?? 0)) {
        toast.error(
          "This team is already at maximum capacity. Add this student to another team.",
        );
        return;
      }

      const newStudent = await updateStudentTeam(
        student.student_event_id,
        team.team_id,
        org_id,
      );

      
      team = {
        ...team,
        teamMembers: [...team.teamMembers, newStudent],
      };

      studentsWithoutTeams = studentsWithoutTeams.filter(
        (s) => s.student_event_id !== student.student_event_id,
      );

      toast.success(
        `Student ${newStudent.person.first_name} added to team ${team.team_name}`,
      );

      isStudentModalOpen = false;
    } catch (error) {
      handleError(error);
      isStudentModalOpen = false;
    }
  }

  function openEditModal() {
    isTeamModalOpen = true;
  }

  async function handleChangeTeam(newTeamData) {
    try {
      console.log("CHANGE TEAM", newTeamData);
      team = newTeamData

      toast.success(
        `Team Updated Succesfully`,
      );
      // Close the modal and reset the input
      isTeamModalOpen = false;
    } catch (error) {
      handleError(error);
    }
  }
</script>

<div
  class="team"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={(e) => onDrop(e, team)}
>
  <div class="flex" style="justify-content: space-between">
    <h3>{team.team_name}</h3>
    {#if editableFeatures}
      <div class="space-y-1">
        <button
          class="hover:bg-green-100 rounded-lg"
          aria-label="Add Student"
          onclick={() => openStudentModal(team.team_id)}
        >
          <UserAddSolid class="w-5 h-5" />
        </button>
        <button
          class="hover:bg-blue-100 rounded-lg"
          aria-label="Edit"
          onclick={() => openEditModal(team)}
        >
          <PenSolid class="w-5 h-5" />
        </button>
        <button
          class="hover:bg-red-100 rounded-lg"
          aria-label="Delete"
          onclick={(e) => {
            e.preventDefault();
            showDeleteTeamConfirmation = true;
            deleteTeamId = team.team_id;
          }}
        >
          <TrashBinSolid class="w-5 h-5" />
        </button>
      </div>
    {:else if showTeamCode}
      <button
        class="hover:bg-blue-100 rounded-lg"
        aria-label="Edit"
        onclick={() => openEditModal(team)}
      >
        <PenSolid class="w-5 h-5" />
      </button>
    {/if}
  </div>

  {#if showTeamCode}
    <div class="flex" style="justify-content: flex-start">
      <InfoToolTip
        text="Send this code to your teammates to join your team!"
      />
      Team Join Code: <CopyText text={team.join_code} />
    </div>
  {/if}

  {#each team.teamMembers as team_member}
    <DraggableStudent
      {team_member}
      {onDragStart}
      {onDeleteStudent}
      {editableFeatures}
    />
  {/each}

  <div
    class="flex-shrink-0 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 inline-flex items-center justify-center absolute top-0 end-0 translate-x-1/3 rtl:-translate-x-1/3 -translate-y-1/3 px-1"
  >
    <span class="text-xs font-bold p-0 m-0y">{team.front_id}</span>
  </div>
</div>

<ConfirmationModal
  isShown={showDeleteTeamConfirmation}
  actionName="delete this team"
  onCancel={() => {
    showDeleteTeamConfirmation = false;
    deleteTeamId = false;
  }}
  onConfirm={handleDeleteTeam}
/>

<div class="modalExterior">
  <Modal bind:open={isStudentModalOpen} size="md" autoclose={false}>
    <div class="specificModalMax">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">
        Select Student
      </h3>
      <div class="tableMaxHeight">
        <TableName
          actionType="select_student"
          items={studentsWithoutTeams}
          action={selectStudent}
          {org_id}
        />
      </div>
    </div>
  </Modal>
</div>

<div class="modalExterior">
  <Modal bind:open={isTeamModalOpen} size="md" autoclose={false}>
    <div class="specificModalMax">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">
        Edit Team
      </h3>
      <TeamForm
        title=""
        {event_id}
        {org_id}
        {team}
        afterSubmit={async (team) => {
          await handleChangeTeam(team);
        }}
        editing={true}
      />
    </div>
  </Modal>
</div>

<style>
  .team {
    border: 3px solid var(--primary-tint);
    padding: 10px;
    border-radius: 15px;
    position: relative;
    text-align: left;
    transition: background-color 0.2s ease;
  }
</style>
