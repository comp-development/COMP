<script lang="ts">
    import {
        PenSolid,
        TrashBinSolid,
        UserAddSolid,
    } from "flowbite-svelte-icons";
    import DraggableStudent from "./DraggableStudent.svelte";
    import CopyText from "./CopyText.svelte";
    import { updateStudentTeam } from "$lib/supabase";
    import { handleError } from "$lib/handleError";
    import toast from "$lib/toast.svelte";
    import { Modal } from "flowbite-svelte";
    import TableName from "$lib/components/TableName.svelte";
    import ConfirmationModal from "$lib/components/ConfirmationModal.svelte";

    let {
        event_id,
        org_id,
        team,
        onDrop,
        onDragStart,
        onDeleteStudent,
        openEditModal,
        handleDragOver,
        editableFeatures = true,
        handleDragLeave,
        studentsWithoutTeams = $bindable(),
        maxTeamSize,
        handleDeleteTeam,
        showDeleteTeamConfirmation = $bindable(),
        deleteTeamId = $bindable(),
        organizationDetails = $bindable(),
    } = $props();

    let isStudentModalOpen = $state(false);
    let studentModalOpenTeam = $state(null);

    function openStudentModal(team_id: number) {
        studentModalOpenTeam = team_id;
        isStudentModalOpen = true;
    }

    async function selectStudent(e, student) {
        try {
            e.preventDefault();

            const lastTeam = organizationDetails.teams.find(
                (team) => team.team_id === studentModalOpenTeam,
            );
            if (!lastTeam) {
                toast.error("No teams available to assign the student.");
                return;
            }

            if (lastTeam.teamMembers.length >= (maxTeamSize ?? 0)) {
                toast.error(
                    "This team is already at maximum capacity. Add this student to another team.",
                );
                return;
            }

            const newStudent = await updateStudentTeam(
                student.student_event_id,
                lastTeam.team_id,
                org_id,
            );

            const updatedTeams = organizationDetails.teams.map((team: any) => {
                if (team.team_id === lastTeam.team_id) {
                    return {
                        ...team,
                        teamMembers: [...team.teamMembers, newStudent],
                    };
                }
                return team;
            });
            organizationDetails.teams = updatedTeams;

            studentsWithoutTeams = studentsWithoutTeams.filter(
                (s) => s.student_event_id !== student.student_event_id,
            );

            toast.success(
                `Student ${newStudent.person.first_name} added to team ${lastTeam.team_name}`,
            );

            studentModalOpenTeam = null;
            isStudentModalOpen = false;
        } catch (error) {
            handleError(error);
        }
    }
</script>

<div
    class="team"
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={(e) => onDrop(e, team)}
>
    <div class="flex" style="justify-content: space-between">
        <h3>{team.team_name}</h3>
        {#if editableFeatures}
            <div class="space-y-1">
                <button
                    class="hover:bg-green-100 rounded-lg"
                    aria-label="Add Student"
                    on:click={() => openStudentModal(team.team_id)}
                >
                    <UserAddSolid class="w-5 h-5" />
                </button>
                <button
                    class="hover:bg-blue-100 rounded-lg"
                    aria-label="Edit"
                    on:click={() => openEditModal(team)}
                >
                    <PenSolid class="w-5 h-5" />
                </button>
                <button
                    class="hover:bg-red-100 rounded-lg"
                    aria-label="Delete"
                    on:click={(e) => {
                        e.preventDefault();
                        showDeleteTeamConfirmation = true;
                        deleteTeamId = team.team_id;
                    }}
                >
                    <TrashBinSolid class="w-5 h-5" />
                </button>
            </div>
        {/if}
    </div>

    {#if editableFeatures}
        <CopyText text={team.join_code} />
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

<Modal bind:open={isStudentModalOpen} size="md" autoclose={false}>
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
</Modal>

<style>
    .team {
        border: 3px solid var(--primary-tint);
        padding: 10px;
        border-radius: 15px;
        position: relative;
        text-align: left;
        transition: background-color 0.2s ease;
        z-index: 2;
    }
</style>
