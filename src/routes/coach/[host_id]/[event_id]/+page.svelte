<script lang="ts">
    import { page } from "$app/stores";
    import Loading from "$lib/components/Loading.svelte";
    import { user } from "$lib/sessionStore";
    import {
        getCoach,
        getEventInformation,
        getCoachOrganization,
        updateStudentTeam,
        getStudentsWithoutTeam,
        upsertTeam,
        deleteTeam,
        deleteStudentTeam,
    } from "$lib/supabase";
    import {
        Badge,
        Button,
        ButtonGroup,
        Input,
        Label,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
        Modal,
    } from "flowbite-svelte";
    import type { Tables } from "../../../../../db/database.types";
    import {
        CartSolid,
        PenSolid,
        TrashBinSolid,
        UserAddSolid,
        UsersGroupSolid,
    } from "flowbite-svelte-icons";
    import toast from "$lib/toast.svelte";
    import { handleError } from "$lib/handleError";
    import OrgForm from "$lib/components/OrgForm.svelte";
    import ConfirmationModal from "$lib/components/ConfirmationModal.svelte";

    let loading = $state(true);
    let coach: any = $state();
    let organizationDetails: any = $state();
    let event_details: Tables<"events"> | null = $state(null);
    const event_id = parseInt($page.params.event_id);
    let draggedMember: any = null;
    let sourceTeamId: number | null = null;

    let showDeleteTeamConfirmation = $state(false);
    let isModalOpen = $state(false);
    let teamName = $state("");
    let editingTeamId: number | null = $state(null);

    let studentModalOpenTeam = $state(null);
    let isStudentModalOpen = $state(false);
    let studentsWithoutTeams = [];

    (async () => {
        event_details = await getEventInformation(event_id);
        coach = await getCoach($user!.id);
        organizationDetails = await getCoachOrganization(coach.coach_id, event_id);

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

    async function handleDrop(event: DragEvent, targetTeam: any) {
        try {
            event.preventDefault();
            if (event.currentTarget instanceof HTMLElement) {
                event.currentTarget.style.backgroundColor = "";
            }
            if (!draggedMember || draggedMember.team_id === targetTeam.team_id)
                return;

            // Update the database
            await updateStudentTeam(
                draggedMember.student_event_id,
                targetTeam.team_id,
                targetTeam.org_id,
            );

            // Update local state
            organizationDetails = organizationDetails.map((org: any) => {
                // Create a new organization object
                return {
                    ...org,
                    teams: org.teams.map((team: any) => {
                        // If this is the source team, remove the member
                        if (team.team_id === sourceTeamId) {
                            return {
                                ...team,
                                teamMembers: team.teamMembers.filter(
                                    (member: any) =>
                                        member.student_event_id !==
                                        draggedMember.student_event_id,
                                ),
                            };
                        }
                        // If this is the target team, add the member
                        if (team.team_id === targetTeam.team_id) {
                            const updatedMember = {
                                ...draggedMember,
                                team_id: targetTeam.team_id,
                                org_id: targetTeam.org_id,
                            };
                            return {
                                ...team,
                                teamMembers: [
                                    ...team.teamMembers,
                                    updatedMember,
                                ],
                            };
                        }
                        return team;
                    }),
                };
            });

            toast.success(
                `Moving member ${draggedMember.students.first_name} to team ${targetTeam.team_name}`,
            );
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

    async function openStudentModal(team_id) {
        try {
            studentsWithoutTeams = await getStudentsWithoutTeam(event_id);
            studentModalOpenTeam = team_id;
            isStudentModalOpen = true;
        } catch (e) {
            handleError(e);
        }
    }

    async function handleChangeTeam(e, org_id) {
        try {
            e.preventDefault();

            let newTeamData;

            if (!editingTeamId) {
                newTeamData = await upsertTeam(event_id, {
                    team_name: teamName,
                    org_id,
                });
            } else {
                newTeamData = await upsertTeam(event_id, {
                    team_id: editingTeamId,
                    team_name: teamName
                });
            }

            let newOrganizationDetails = [...organizationDetails];
            const orgIndex = newOrganizationDetails.findIndex(
                (org) => org.org_id === org_id,
            );

            if (editingTeamId) {
                // Update the existing team
                newOrganizationDetails[orgIndex].teams = newOrganizationDetails[
                    orgIndex
                ].teams.map((team) => {
                    if (team.team_id === editingTeamId) {
                        return { ...team, team_name: teamName };
                    }
                    return team;
                });
                toast.success("Team updated successfully");
            } else {
                // Add a new team
                newOrganizationDetails[orgIndex].teams.push({
                    ...newTeamData[0],
                    teamMembers: [],
                });
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

    async function selectStudent(e, student, org_id) {
        try {
            e.preventDefault();

            if (!organizationDetails.length || organizationDetails.length == 0) return;
            const org = organizationDetails.find((org) => org.org_id === org_id);
            if (!org) { toast.error("Organization not found."); return; }
            
            const lastTeam = org.teams.find((team) => team.team_id === studentModalOpenTeam);
            if (!lastTeam) { toast.error("No teams available to assign the student."); return; }

            if (lastTeam.teamMembers.length >= (event_details?.max_team_size ?? 0)) {
                toast.error("This team is already at maximum capacity. Add this student to another team.");
                return;
            }

            const newStudent = await updateStudentTeam(
                student.student_event_id,
                lastTeam.team_id,
                org_id,
            );

            organizationDetails = organizationDetails.map((org) => {
                if (org.org_id === org_id) {
                    return {
                        ...org,
                        teams: org.teams.map((team) => {
                            if (team.team_id === lastTeam.team_id) {
                                return {
                                    ...team,
                                    teamMembers: [...team.teamMembers, newStudent[0]],
                                };
                            }
                            return team;
                        }),
                    };
                }
                return org;
            });

            toast.success(
                `Student ${newStudent[0].students.first_name} added to team ${lastTeam.team_name}`,
            );

            studentModalOpenTeam = null;
            isStudentModalOpen = false;
        } catch (error) {
            handleError(error);
        }
    }

    async function handleDeleteTeam(team) {
        try {
            await deleteTeam(team);

            organizationDetails = organizationDetails.map((org: any) => {
                return {
                    ...org,
                    teams: org.teams.filter(
                        (t: any) => t.team_id !== team.team_id,
                    ),
                };
            });

            toast.success("Team deleted successfully");
            showDeleteTeamConfirmation = false;
        } catch (error) {
            handleError(error);
        }
    }

    async function handleDeleteStudentTeam(e, student) {
        try {
            e.preventDefault();

            await deleteStudentTeam(student.student_event_id);

            organizationDetails = organizationDetails.map((org: any) => {
                return {
                    ...org,
                    teams: org.teams.map((team: any) => {
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
            });

            toast.success("Student deleted successfully");
        } catch (error) {
            handleError(error);
        }
    }
</script>

{#if loading}
    <Loading />
{:else}
    <br />
    <h1>{event_details?.event_name}</h1>
    <h2 style="font-weight: 500">{event_details?.event_date}</h2>
    <br />

    {#each organizationDetails as organization}
        {#if organization.event.length > 0}
            <hr />
            <div class="organization">
                <h2>{organization.orgs.name}</h2>
                <h4>{organization.orgs.address}</h4>
                <div style="margin: 10px 0;">
                        <Button pill outline color="primary" onclick={openAddModal}>
                            <UsersGroupSolid class="w-4 h-4 me-2" />
                            Add Team
                        </Button>
                </div>

                <div class="grid-thirds">
                    {#each organization.teams as team}
                        <div
                            class="team"
                            ondragover={handleDragOver}
                            ondragleave={handleDragLeave}
                            ondrop={(e) => handleDrop(e, team)}
                        >
                            <div
                                class="flex"
                                style="justify-content: space-between"
                            >
                                <h3>{team.team_name}</h3>
                                <div class="space-y-1">
                                    <button
                                        class="hover:bg-green-100 rounded-lg"
                                        aria-label="Add Student"
                                        onclick={() => {openStudentModal(team.team_id)}}
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
                                            showDeleteTeamConfirmation = true; }}
                                    >
                                        <TrashBinSolid class="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <ConfirmationModal
                                isShown={showDeleteTeamConfirmation}
                                actionName="delete this team"
                                onCancel={() => { showDeleteTeamConfirmation = false; }}
                                onConfirm={() => {handleDeleteTeam(team)}}
                            />

                            <p>Join Code: {team.join_code}</p>

                            {#each team.teamMembers as team_member}
                                <div
                                    class="teamMember"
                                    draggable="true"
                                    ondragstart={(e) =>
                                        handleDragStart(e, team_member)}
                                >
                                    <div class="ml-2">
                                        <div class="flex">
                                            {#if team_member.front_id}
                                                <Badge rounded large color="dark"
                                                    >{team_member.front_id}</Badge
                                                >
                                            {/if}
                                            <div class="ml-2">
                                                <p class="font-bold text-gray-800">
                                                    {team_member.students
                                                        .first_name}
                                                    {team_member.students.last_name}
                                                </p>
                                                <p class="text-sm text-gray-600">
                                                    mrajupal@gmail.com
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        class="flex flex-col items-center space-y-1"
                                    >
                                        <button
                                            class="hover:bg-blue-100 rounded-lg"
                                            aria-label="Edit"
                                            onclick={() => {
                                                /*To be implemented*/
                                            }}
                                        >
                                            <PenSolid class="w-5 h-5" />
                                        </button>
                                        <button
                                            class="hover:bg-red-100 rounded-lg"
                                            aria-label="Delete"
                                            onclick={(event) => {
                                                handleDeleteStudentTeam(
                                                    event,
                                                    team_member,
                                                );
                                            }}
                                        >
                                            <TrashBinSolid class="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            {/each}

                            <div
                                class="flex-shrink-0 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 inline-flex items-center justify-center absolute top-0 end-0 translate-x-1/3 rtl:-translate-x-1/3 -translate-y-1/3 px-1"
                            >
                                <span class="text-xs font-bold p-0 m-0y"
                                    >{team.front_id}</span
                                >
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <Modal bind:open={isModalOpen} size="md" autoclose={false}>
                <form
                    class="flex flex-col space-y-6"
                    onsubmit={(e) => handleChangeTeam(e, organization.org_id)}
                >
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

            <Modal bind:open={isStudentModalOpen} size="md" autoclose={false}>
                <h3 class="text-xl font-medium text-gray-900 dark:text-white">
                    Select Student
                </h3>
                <div class="tableMaxHeight">
                    <Table
                        items={studentsWithoutTeams}
                        class="w-full"
                        filter={(item, searchTerm) =>
                            item.student.first_name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()) ||
                            item.student.last_name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())}
                    >
                        <TableHead>
                            <TableHeadCell></TableHeadCell>
                            <TableHeadCell
                                sort={(a, b) =>
                                    a.student.first_name.localeCompare(
                                        b.student.first_name,
                                    )}
                                defaultSort>First Name</TableHeadCell
                            >
                            <TableHeadCell
                                sort={(a, b) =>
                                    a.student.last_name.localeCompare(b.student.last_name)}
                                >Last Name</TableHeadCell
                            >
                            <TableHeadCell
                                sort={(a, b) =>
                                    a.student.grade.localeCompare(b.student.grade)}
                                >Grade</TableHeadCell
                            >
                        </TableHead>
                        <TableBody tableBodyClass="divide-y">
                            <TableBodyRow slot="row" let:item>
                                <TableBodyCell class="px-0 py-1 text-center">
                                    <button class="select_button" onclick={(e) => selectStudent(e, item, organization.org_id)}
                                        >✅</button
                                    >
                                </TableBodyCell>
                                <TableBodyCell class="px-0 py-0 text-center"
                                    >{item.student.first_name}</TableBodyCell
                                >
                                <TableBodyCell class="px-0 py-0 text-center"
                                    >{item.student.last_name}</TableBodyCell
                                >
                                <TableBodyCell class="px-0 py-0 text-center"
                                    >{item.student.grade}</TableBodyCell
                                >
                            </TableBodyRow>
                            {#if studentsWithoutTeams.length == 0}
                                <TableBodyRow>
                                    <TableBodyCell colspan="4" class="text-center"
                                        >No students available.</TableBodyCell
                                    >
                                </TableBodyRow>
                            {/if}
                        </TableBody>
                    </Table>
                </div>
            </Modal>
        {:else}
            <hr />
            <div class="organization">
                <h2>{organization.orgs.name}</h2>
                <h4>{organization.orgs.address}</h4>
            </div>
            <OrgForm title="Registration Form" org={organization} event_id={event_id} org_id={organization.org_id} />
        {/if}
    {/each}
{/if}

<style>
    .organization {
        margin: 20px;
        border-radius: 20px;
    }

    .team {
        border: 3px solid var(--primary-tint);
        padding: 10px;
        margin: 10px;
        border-radius: 15px;
        position: relative;
        text-align: left;
        transition: background-color 0.2s ease;
    }

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

    .tableMaxHeight {
        max-height: 500px;
        overflow-y: scroll;
    }

    .select_button {
        background-color: none;
        border: none;
        outline: none;
    }
</style>
