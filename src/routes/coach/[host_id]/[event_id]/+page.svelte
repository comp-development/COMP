<script lang="ts">
    import { page } from "$app/stores";
    import Loading from "$lib/components/Loading.svelte";
    import { user } from "$lib/sessionStore";
    import {
        getCoach,
        getEventInformation,
        getCoachOrganization,
    } from "$lib/supabase";
    import { Badge, Button, ButtonGroup, Indicator } from "flowbite-svelte";
    import type { Tables } from "../../../../../db/database.types";
    import { CartSolid, PenSolid, TrashBinSolid } from "flowbite-svelte-icons";

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
                <Button pill>Add Team</Button>
            </div>

            <div class="grid-thirds">
                {#each organization.teams as team}
                    <div class="team">
                        <h3>{team.team_name}</h3>
                        <p>Join Code: {team.join_code}</p>

                        <ButtonGroup class="mt-2 mb-1">
                            <Button pill outline color="primary">
                                <PenSolid class="w-4 h-4 me-2" />
                                Edit
                            </Button>
                            <Button pill outline color="primary">
                                <CartSolid
                                    class="w-4 h-4 me-2"
                                />
                                Pay
                            </Button>
                            <Button pill outline color="primary">
                                <TrashBinSolid class="w-4 h-4 me-2" />
                                Delete
                            </Button>
                        </ButtonGroup>
                        <br />

                        {#each team.teamMembers as team_member}
                            <div class="teamMember">
                                <div class="ml-2">
                                    <div class="flex">
                                        {#if team_member.front_id}
                                            <Badge rounded large color="dark"
                                                >{team_member.front_id}</Badge
                                            >
                                        {/if}
                                        <p class="ml-2 font-bold text-gray-800">
                                            {team_member.students.first_name}
                                            {team_member.students.last_name}
                                        </p>
                                    </div>
                                    <p class="text-sm text-gray-600 mt-1">
                                        mrajupal@gmail.com
                                    </p>
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

                        <Indicator
                            color="gray"
                            border
                            size="xl"
                            placement="top-right"
                        >
                            <span class="text-xs font-bold"
                                >{team.front_id}</span
                            >
                        </Indicator>
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
    }
</style>
