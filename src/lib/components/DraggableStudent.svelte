<script lang="ts">
    import { Badge, Modal } from "flowbite-svelte";
    import { PenSolid, TrashBinSolid } from "flowbite-svelte-icons";
    import StudentForm from "./StudentForm.svelte";
    import type { CoachEventOrg } from "$lib/supabase";
    import type { Unpacked } from "$lib/supabaseClient";

    const {
        team_member,
        team_id,
        onDragStart,
        onDeleteStudent,
        event_id,
        editableFeatures = true,
    }: {team_member: Unpacked<Unpacked<CoachEventOrg["teams"]>["members"]>, team_id: string | null} & Omit<any, "team_member"> = $props();

    let isEditModalOpen = $state(false);

    const openEditModal = () => {
        isEditModalOpen = true;
    };

    const closeEditModal = () => {
        isEditModalOpen = false;
    };
</script>

<div
    class="teamMember"
    draggable="true"
    on:dragstart={(e) => onDragStart(e, team_id, team_member)}
>
    <div class="ml-2">
        <div class="flex">
            {#if team_member.front_id}
                <Badge rounded large color="dark">{team_member.front_id}</Badge>
            {/if}
            <div class="ml-2">
                <p class="font-bold text-gray-800">
                    {team_member.user.first_name}
                    {team_member.user.last_name}
                </p>
                <p
                    class="text-sm text-gray-600"
                    style="overflow-wrap: anywhere;"
                >
                    {team_member.user.email ?? "No associated email."}
                </p>
            </div>
        </div>
    </div>

    {#if editableFeatures}
        <div class="flex flex-col items-center space-y-1">
            <button
                class="hover:bg-blue-100 rounded-lg"
                aria-label="Edit"
                on:click={openEditModal}
            >
                <PenSolid class="w-5 h-5" />
            </button>
            <button
                class="hover:bg-red-100 rounded-lg"
                aria-label="Delete"
                on:click={(event) => onDeleteStudent(event, team_member)}
            >
                <TrashBinSolid class="w-5 h-5" />
            </button>
        </div>
    {/if}
</div>

<div class="modalExterior">
    <Modal bind:open={isEditModalOpen} size="md" autoclose={false}>
        <h3 class="text-xl font-medium text-gray-900 dark:text-white">
            Edit Student
        </h3>
        <StudentForm
            title=""
            student_event={team_member}
            user={team_member.user}
            event_id={event_id}
        />
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
        cursor: move;
        transition: transform 0.2s ease;
    }

    .teamMember:hover {
        transform: scale(1.01);
    }
</style>
