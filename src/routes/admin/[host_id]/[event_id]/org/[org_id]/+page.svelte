<script lang="ts">
  import { page } from "$app/stores";
  import Loading from "$lib/components/Loading.svelte";
  import {
    getEventInformation,
    updateStudentTeam,
    deleteTeam,
    deleteStudentTeam,
    getHostInformation,
    removeStudentFromOrganization,
    getOrganizationDetails,
    getAllStudentsWithoutTeam,
  } from "$lib/supabase";
  import { Button, ButtonGroup, Modal } from "flowbite-svelte";
  import type { Tables } from "../../../../../../../db/database.types";
  import { UsersGroupSolid } from "flowbite-svelte-icons";
  import toast from "$lib/toast.svelte";
  import { handleError } from "$lib/handleError";
  import CopyText from "$lib/components/CopyText.svelte";
  import StudentTeam from "$lib/components/StudentTeam.svelte";
  import DraggableStudent from "$lib/components/DraggableStudent.svelte";
  import TeamForm from "$lib/components/TeamForm.svelte";
  import InfoToolTip from "$lib/components/InfoToolTip.svelte";

  let loading = $state(true);
  let organizationDetails: any = $state();
  let event_details: Tables<"events"> | null = $state(null);
  const event_id = parseInt($page.params.event_id);
  const org_id = parseInt($page.params.org_id);
  let draggedMember: any = null;
  let sourceTeamId: number | null = null;

  let studentsWithoutTeams = $state([]);
  let isTeamModalOpen = $state(false);
  let teamName = $state("");
  let editingTeamId: number | null = $state(null);

  let newResponses = $state({});

  let showDeleteTeamConfirmation = $state(false);
  let deleteTeamId = $state(null);

  let host: any = $state();
  const host_id = parseInt($page.params.host_id);

  (async () => {
    host = await getHostInformation(host_id);
    event_details = await getEventInformation(event_id);
    organizationDetails = await getOrganizationDetails(org_id, event_id);
    studentsWithoutTeams = await getAllStudentsWithoutTeam(event_id);
    loading = false;
  })();

  function handleDragStart(event: DragEvent, team_member: any) {
    if (event.dataTransfer) {
      draggedMember = team_member;
      sourceTeamId = team_member.team_id;
      event.dataTransfer.setData("text/plain", JSON.stringify(team_member));
    }
  }

  async function handleDrop(event: DragEvent, targetTeam: any | null) {
    try {
      event.preventDefault();
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.style.backgroundColor = "";
      }

      // Early return if dragging to same team
      if (sourceTeamId && targetTeam?.team_id === sourceTeamId) return;
      if (!draggedMember) return;

      if (targetTeam === null) {
        // Scenario A: Moving to unassigned category
        await updateStudentTeam(draggedMember.student_event_id, null, org_id);

        // Remove from current team
        organizationDetails = {
          ...organizationDetails,
          teams: organizationDetails.teams.map((team: any) => {
            if (team.team_id === sourceTeamId) {
              return {
                ...team,
                teamMembers: team.teamMembers.filter(
                  (member: any) =>
                    member.student_event_id !== draggedMember.student_event_id,
                ),
              };
            }
            return team;
          }),
        };

        // Add to unassigned students
        studentsWithoutTeams = [...studentsWithoutTeams, draggedMember];

        toast.success(
          `Moving ${draggedMember.person.first_name} to unassigned students`,
        );
      } else if (sourceTeamId) {
        // Scenario B: Moving between teams
        await updateStudentTeam(
          draggedMember.student_event_id,
          targetTeam.team_id,
          org_id,
        );

        organizationDetails = {
          ...organizationDetails,
          teams: organizationDetails.teams.map((team: any) => {
            if (team.team_id === sourceTeamId) {
              // Remove from source team
              return {
                ...team,
                teamMembers: team.teamMembers.filter(
                  (member: any) =>
                    member.student_event_id !== draggedMember.student_event_id,
                ),
              };
            }
            if (team.team_id === targetTeam.team_id) {
              // Add to target team
              const updatedMember = {
                ...draggedMember,
                team_id: targetTeam.team_id,
              };
              return {
                ...team,
                teamMembers: [...team.teamMembers, updatedMember],
              };
            }
            return team;
          }),
        };

        toast.success(
          `Moving ${draggedMember.person.first_name} to team ${targetTeam.team_name}`,
        );
      } else {
        // Scenario C: Moving from unassigned to team
        await updateStudentTeam(
          draggedMember.student_event_id,
          targetTeam.team_id,
          org_id,
        );

        // Remove from unassigned students
        studentsWithoutTeams = studentsWithoutTeams.filter(
          (student) =>
            student.student_event_id !== draggedMember.student_event_id,
        );

        // Add to target team
        organizationDetails = {
          ...organizationDetails,
          teams: organizationDetails.teams.map((team: any) => {
            if (team.team_id === targetTeam.team_id) {
              const updatedMember = {
                ...draggedMember,
                team_id: targetTeam.team_id,
              };
              return {
                ...team,
                teamMembers: [...team.teamMembers, updatedMember],
              };
            }
            return team;
          }),
        };

        toast.success(
          `Moving ${draggedMember.person.first_name} to team ${targetTeam.team_name}`,
        );
      }
    } catch (e) {
      handleError(e);
    } finally {
      // Reset the drag state
      draggedMember = null;
      sourceTeamId = null;
    }
  }

  function openEditModal(team: any) {
    teamName = team.team_name;
    editingTeamId = team.team_id;
    isTeamModalOpen = true;
  }

  function openAddModal() {
    teamName = "";
    editingTeamId = null;
    isTeamModalOpen = true;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
    }
  }

  function handleDragLeave(event: DragEvent) {
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.backgroundColor = "";
    }
  }

  async function handleChangeTeam(newTeamData) {
    try {
      let newOrganizationDetails = { ...organizationDetails };

      if (editingTeamId) {
        // Update the existing team
        newOrganizationDetails = {
          ...newOrganizationDetails,
          teams: newOrganizationDetails.teams.map((team) => {
            if (team.team_id === newTeamData.team_id) {
              return {
                ...team,
                team_name: newTeamData.team_name,
              };
            }
            return team;
          }),
        };
        toast.success("Team updated successfully");
      } else {
        // Add a new team
        newOrganizationDetails = {
          ...newOrganizationDetails,
          teams: [
            ...newOrganizationDetails.teams,
            {
              ...newTeamData,
              teamMembers: [],
            },
          ],
        };
        toast.success("Team added successfully");
      }

      organizationDetails = newOrganizationDetails;

      // Close the modal and reset the input
      isTeamModalOpen = false;
      teamName = "";
      editingTeamId = null;
    } catch (error) {
      handleError(error);
    }
  }

  async function handleDeletingStudent(student) {
    try {
      await removeStudentFromOrganization(student.student_event_id);

      studentsWithoutTeams = studentsWithoutTeams.filter(
        (s) => s.student_event_id !== student.student_event_id,
      );

      toast.success(
        `${student.person.first_name} has been removed from the organization`,
      );
    } catch (e) {
      handleError(e);
    }
  }

  async function handleDeleteTeam() {
    try {
      const teamToDelete = organizationDetails.teams.find(
        (t) => t.team_id === deleteTeamId,
      );

      if (teamToDelete?.teamMembers && teamToDelete.teamMembers.length > 0) {
        studentsWithoutTeams = [
          ...studentsWithoutTeams,
          ...teamToDelete.teamMembers,
        ];
      }

      await deleteTeam(deleteTeamId);

      organizationDetails = {
        ...organizationDetails,
        teams: organizationDetails.teams.filter(
          (t: any) => t.team_id !== deleteTeamId,
        ),
      };

      toast.success("Team deleted successfully");
      showDeleteTeamConfirmation = false;
      deleteTeamId = null;
    } catch (error) {
      handleError(error);
    }
  }

  async function handleDeleteStudentTeam(e, student) {
    try {
      e.preventDefault();

      await deleteStudentTeam(student.student_event_id);

      let newOrganizationDetails = { ...organizationDetails };
      newOrganizationDetails = {
        ...newOrganizationDetails,
        teams: newOrganizationDetails.teams.map((team: any) => {
          return {
            ...team,
            teamMembers: team.teamMembers.filter(
              (member: any) =>
                member.student_event_id !== student.student_event_id,
            ),
          };
        }),
      };
      organizationDetails = newOrganizationDetails;

      studentsWithoutTeams.push(student);

      toast.success("Student deleted successfully");
    } catch (error) {
      handleError(error);
    }
  }
</script>

{#if loading}
  <Loading />
{:else}
  <div class="organization">
    <h1>{organizationDetails.name}</h1>
    <div class="flex">
      <InfoToolTip
        text="Send this code to your students and they will be able to join this organization after they create an account"
      />
      <CopyText text={organizationDetails.event.join_code} />
    </div>

    <div style="margin: 10px 0;">
      <ButtonGroup>
        <Button pill outline color="primary" onclick={openAddModal}>
          <UsersGroupSolid class="w-4 h-4 me-2" />
          Add Team
        </Button>
      </ButtonGroup>
    </div>

    <div class="grid-container">
      <div class="teams-grid">
        {#each organizationDetails.teams as team}
          <StudentTeam
            {event_id}
            {org_id}
            {team}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDeleteStudent={handleDeleteStudentTeam}
            {openEditModal}
            {handleDeleteTeam}
            {handleDragOver}
            {handleDragLeave}
            maxTeamSize={event_details?.max_team_size}
            bind:organizationDetails
            bind:studentsWithoutTeams
            bind:showDeleteTeamConfirmation
            bind:deleteTeamId
          />
        {/each}
      </div>
      <div
        class="unassigned-students"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={(e) => handleDrop(e, null)}
      >
        <h3 class="text-xl font-semibold mb-4 flex">
          <InfoToolTip
            text="These students are a part of your organization but do not have a team. Drag over these students to one of them boxes to add them"
          />
          Unassigned Students
        </h3>
        {#each studentsWithoutTeams as student}
          <DraggableStudent
            team_member={student}
            onDragStart={handleDragStart}
            onDeleteStudent={() => {
              handleDeletingStudent(student);
            }}
          />
        {/each}
      </div>
    </div>
  </div>
{/if}

<div class="modalExterior">
  <Modal bind:open={isTeamModalOpen} size="md" autoclose={false}>
    <h3 class="text-xl font-medium text-gray-900 dark:text-white">
      {editingTeamId ? "Edit Team" : "Add a New Team"}
    </h3>
    <TeamForm
      title=""
      {event_id}
      {org_id}
      team={editingTeamId
        ? organizationDetails.teams.find((t) => t.team_id === editingTeamId)
        : null}
      afterSubmit={async (team) => {
        await handleChangeTeam(team);
      }}
    />
  </Modal>
</div>
<br />
<br />

<style>
  .organization {
    margin: 20px;
    border-radius: 20px;
  }

  .grid-container {
    display: grid;
    grid-template-columns: 3fr 1fr;
    gap: 20px;
    margin: 20px;
  }

  @media only screen and (max-width: 900px) {
    .grid-container {
      grid-template-columns: 100%;
    }
  }

  .teams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-auto-rows: min-content;
    gap: 20px;
  }

  .unassigned-students {
    padding: 20px;
    border-radius: 15px;
    border: 2px solid var(--primary-tint);
  }
</style>
