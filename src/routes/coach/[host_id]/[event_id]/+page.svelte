<script lang="ts">
    import { page } from "$app/stores";
    import Loading from "$lib/components/Loading.svelte";
    import { user } from "$lib/sessionStore";
    import {
        getCoach,
        getEventInformation,
        getCoachOrganization,
    } from "$lib/supabase";
    import { Badge, Button, ButtonGroup } from "flowbite-svelte";
    import type { Tables } from "../../../../../db/database.types";
    import {
        CartSolid,
        PenSolid,
        TrashBinSolid,
        UserAddSolid,
        UsersGroupSolid,
    } from "flowbite-svelte-icons";

    let loading = $state(true);
    let coach: any = $state();
    let organizationDetails: any = $state();
    let event_details: Tables<"events"> | null = $state(null);
    const event_id = parseInt($page.params.event_id);

    (async () => {
        event_details = await getEventInformation(event_id);
        coach = await getCoach($user!.id);
        organizationDetails = await getCoachOrganization(coach.coach_id);

        console.log(organizationDetails);

        loading = false;
    })();
</script>

{#if loading}
    <Loading />
{:else}
    <br />
    <h1>{event_details?.event_name}</h1>
    <h2 style="font-weight: 500">{event_details?.event_date}</h2>
    <br />

    {#each organizationDetails as organization}
        <hr />
        <div class="organization">
            <h2>{organization.orgs.name}</h2>
            <h4>{organization.orgs.address}</h4>
            <div style="margin: 10px 0;">
                <ButtonGroup class="mt-2 mb-1">
                    <Button pill outline color="primary" onclick={() => {/*To be implemented*/}}>
                        <CartSolid class="w-4 h-4 me-2" />
                        Pay
                    </Button>
                    <Button pill outline color="primary" onclick={() => {/*To be implemented*/}}>
                        <UsersGroupSolid class="w-4 h-4 me-2" />
                        Add Team
                    </Button>
                    <Button pill outline color="primary" onclick={() => {/*To be implemented*/}}>
                        <UserAddSolid class="w-4 h-4 me-2" />
                        Add Student
                    </Button>
                </ButtonGroup>
            </div>

            <div class="grid-thirds">
                {#each organization.teams as team}
                    <div class="team">
                        <div
                            class="flex"
                            style="justify-content: space-between"
                        >
                            <h3>{team.team_name}</h3>
                            <div class="space-y-1">
                                <button
                                    class="hover:bg-blue-100 rounded-lg"
                                    aria-label="Edit"
                                >
                                    <PenSolid class="w-5 h-5" />
                                </button>
                                <button
                                    class="hover:bg-red-100 rounded-lg"
                                    aria-label="Delete"
                                >
                                    <TrashBinSolid class="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <p>Join Code: {team.join_code}</p>

                        {#each team.teamMembers as team_member}
                            <div class="teamMember">
                                <div class="ml-2">
                                    <div class="flex">
                                        {#if team_member.front_id}
                                            <Badge rounded large color="dark"
                                                >{team_member.front_id}</Badge
                                            >
                                        {/if}
                                        <div class="ml-2">
                                            <p
                                                class="font-bold text-gray-800"
                                            >
                                                {team_member.students
                                                    .first_name}
                                                {team_member.students.last_name}
                                            </p>
                                            <p
                                                class="text-sm text-gray-600"
                                            >
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
                                    >
                                        <PenSolid class="w-5 h-5" />
                                    </button>
                                    <button
                                        class="hover:bg-red-100 rounded-lg"
                                        aria-label="Delete"
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
    }
</style>
