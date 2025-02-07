<script lang="ts">
    import { page } from "$app/stores";
    import Loading from "$lib/components/Loading.svelte";
    import { user } from "$lib/sessionStore";
    import {
        getCoach,
        getEventInformation,
        getCoachOrganization,
        updateStudentTeam,
        upsertTeam,
        deleteTeam,
        deleteStudentTeam,
        getHostInformation,
        getStudentsWithoutTeam,
    } from "$lib/supabase";
    import { Button, Input, Label, Modal } from "flowbite-svelte";
    import type { Tables } from "../../../../../../db/database.types";
    import { UsersGroupSolid } from "flowbite-svelte-icons";
    import toast from "$lib/toast.svelte";
    import { handleError } from "$lib/handleError";
    import OrgForm from "$lib/components/OrgForm.svelte";
    import CopyText from "$lib/components/CopyText.svelte";
    import EventDisplay from "$lib/components/EventDisplay.svelte";
    import StudentTeam from "$lib/components/StudentTeam.svelte";
    import DraggableStudent from "$lib/components/DraggableStudent.svelte";

    let loading = $state(true);
    let coach: any = $state();
    let organizationDetails: any = $state();
    let event_details: Tables<"events"> | null = $state(null);
    const event_id = parseInt($page.params.event_id);
    const org_id = parseInt($page.params.org_id);
    let draggedMember: any = null;
    let sourceTeamId: number | null = null;

    let studentsWithoutTeams = $state([]);
    let isModalOpen = $state(false);
    let teamName = $state("");
    let editingTeamId: number | null = $state(null);

    let host: any = $state();
    const host_id = parseInt($page.params.host_id);

    (async () => {
        host = await getHostInformation(host_id);
        event_details = await getEventInformation(event_id);

        coach = await getCoach($user!.id);
        organizationDetails = await getCoachOrganization(
            coach.coach_id,
            event_id,
            org_id,
        );

        studentsWithoutTeams = await getStudentsWithoutTeam(event_id, org_id);

        loading = false;
    })();

    function handleDragStart(event: DragEvent, team_member: any) {
        if (event.dataTransfer) {
            draggedMember = team_member;
            sourceTeamId = team_member.team_id;
            event.dataTransfer.setData(
                "text/plain",
                JSON.stringify(team_member),
            );
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
                                    (member: any) => member.student_event_id !== draggedMember.student_event_id
                                )
                            };
                        }
                        return team;
                    })
                };

                // Add to unassigned students
                studentsWithoutTeams = [...studentsWithoutTeams, draggedMember];
                
                toast.success(`Moving ${draggedMember.person.first_name} to unassigned students`);
            } else if (sourceTeamId) {
                // Scenario B: Moving between teams
                await updateStudentTeam(draggedMember.student_event_id, targetTeam.team_id, org_id);

                organizationDetails = {
                    ...organizationDetails,
                    teams: organizationDetails.teams.map((team: any) => {
                        if (team.team_id === sourceTeamId) {
                            // Remove from source team
                            return {
                                ...team,
                                teamMembers: team.teamMembers.filter(
                                    (member: any) => member.student_event_id !== draggedMember.student_event_id
                                )
                            };
                        }
                        if (team.team_id === targetTeam.team_id) {
                            // Add to target team
                            const updatedMember = {
                                ...draggedMember,
                                team_id: targetTeam.team_id
                            };
                            return {
                                ...team,
                                teamMembers: [...team.teamMembers, updatedMember]
                            };
                        }
                        return team;
                    })
                };

                toast.success(
                    `Moving ${draggedMember.person.first_name} to team ${targetTeam.team_name}`
                );
            } else {
                // Scenario C: Moving from unassigned to team
                await updateStudentTeam(draggedMember.student_event_id, targetTeam.team_id, org_id);

                // Remove from unassigned students
                studentsWithoutTeams = studentsWithoutTeams.filter(
                    (student) => student.student_event_id !== draggedMember.student_event_id
                );

                // Add to target team
                organizationDetails = {
                    ...organizationDetails,
                    teams: organizationDetails.teams.map((team: any) => {
                        if (team.team_id === targetTeam.team_id) {
                            const updatedMember = {
                                ...draggedMember,
                                team_id: targetTeam.team_id
                            };
                            return {
                                ...team,
                                teamMembers: [...team.teamMembers, updatedMember]
                            };
                        }
                        return team;
                    })
                };

                toast.success(
                    `Moving ${draggedMember.person.first_name} to team ${targetTeam.team_name}`
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
        isModalOpen = true;
    }

    function openAddModal() {
        teamName = "";
        editingTeamId = null;
        isModalOpen = true;
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        if (event.currentTarget instanceof HTMLElement) {
            event.currentTarget.style.backgroundColor =
                "rgba(59, 130, 246, 0.1)";
        }
    }

    function handleDragLeave(event: DragEvent) {
        if (event.currentTarget instanceof HTMLElement) {
            event.currentTarget.style.backgroundColor = "";
        }
    }

    async function handleChangeTeam() {
        try {
            let newTeamData;

            if (!editingTeamId) {
                newTeamData = await upsertTeam(event_id, {
                    team_name: teamName,
                    org_id,
                });
            } else {
                newTeamData = await upsertTeam(event_id, {
                    team_id: editingTeamId,
                    team_name: teamName,
                });
            }

            let newOrganizationDetails = { ...organizationDetails };

            if (editingTeamId) {
                // Update the existing team
                newOrganizationDetails = {
                    ...newOrganizationDetails,
                    teams: newOrganizationDetails.teams.map((team) => {
                        if (team.team_id === editingTeamId) {
                            return { ...team, team_name: teamName };
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
            isModalOpen = false;
            teamName = "";
            editingTeamId = null;
        } catch (error) {
            handleError(error);
        }
    }

    async function handleDeleteTeam(team) {
        try {
            await deleteTeam(team);

            organizationDetails.teams.filter(
                (t: any) => t.team_id !== team.team_id,
            );

            toast.success("Team deleted successfully");
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
                                member.student_event_id !==
                                student.student_event_id,
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
    <EventDisplay
        name={event_details?.event_name}
        date={event_details?.event_date}
        logo={event_details?.logo && event_details?.logo != "" ? event_details?.logo : host.logo}
        email={event_details?.email ?? host.email}
        markdown={event_details?.markdown}
    />

    {#if organizationDetails.event}
        <hr />
        <div class="organization">
            <div class="flex">
                <CopyText text={organizationDetails.event.join_code} />
            </div>

            <div style="margin: 10px 0;">
                <Button pill outline color="primary" onclick={openAddModal}>
                    <UsersGroupSolid class="w-4 h-4 me-2" />
                    Add Team
                </Button>
            </div>

            <div class="grid-container">
                <div class="teams-grid">
                    {#each organizationDetails.teams as team}
                        <StudentTeam
                            {event_id}
                            {org_id}
                            {team}
                            onDrop={handleDrop}
                            onDeleteTeam={handleDeleteTeam}
                            onDragStart={handleDragStart}
                            onDeleteStudent={handleDeleteStudentTeam}
                            {openEditModal}
                            {handleDragOver}
                            {handleDragLeave}
                            maxTeamSize={event_details?.max_team_size}
                            bind:organizationDetails
                            bind:studentsWithoutTeams
                        />
                    {/each}
                </div>
                <div 
                    class="unassigned-students"
                    ondragover={handleDragOver}
                    ondragleave={handleDragLeave}
                    ondrop={(e) => handleDrop(e, null)}
                >
                    <h3 class="text-xl font-semibold mb-4">Unassigned Students</h3>
                    {#each studentsWithoutTeams as student}
                        <DraggableStudent
                            team_member={student}
                            onDragStart={handleDragStart}
                            onDeleteStudent={() => { /*To be implemented - remove student from organization*/ }}
                        />
                    {/each}
                </div>
            </div>
        </div>

        <Modal bind:open={isModalOpen} size="md" autoclose={false}>
            <form class="flex flex-col space-y-6" onsubmit={handleChangeTeam}>
                <h3 class="text-xl font-medium text-gray-900 dark:text-white">
                    {editingTeamId ? "Edit Team" : "Add a New Team"}
                </h3>
                <Label class="space-y-2">
                    <span>Name</span>
                    <Input
                        type="text"
                        bind:value={teamName}
                        placeholder="Enter team name"
                        required
                    />
                </Label>
                <div class="flex justify-end space-x-4">
                    <Button
                        color="gray"
                        outline
                        on:click={() => (isModalOpen = false)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" class="w-full">
                        {editingTeamId ? "Save Changes" : "Submit"}
                    </Button>
                </div>
            </form>
        </Modal>
    {:else}
        <OrgForm
            title="Registration Form"
            org={organizationDetails}
            {event_id}
            {org_id}
        />
    {/if}
{/if}

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

    .teams-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }

    .unassigned-students {
        padding: 20px;
        border-radius: 15px;
        border: 2px solid var(--primary-tint);
    }
</style>
