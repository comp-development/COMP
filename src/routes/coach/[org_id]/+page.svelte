<script lang="ts">
    import { user } from "$lib/sessionStore";
    import Loading from "$lib/components/Loading.svelte";
    import { page } from "$app/stores";
    import {
        addCoachToOrganization,
        getAllCoachesOutsideOrg,
        getAllPublicHosts,
        getOrganization,
        removeCoachFromOrganization,
    } from "$lib/supabase";
    import { Button, ButtonGroup, Modal } from "flowbite-svelte";
    import { CirclePlusSolid, PenSolid } from "flowbite-svelte-icons";
    import { handleError } from "$lib/handleError";
    import toast from "$lib/toast.svelte";
    import TableName from "$lib/components/TableName.svelte";
    import CreateOrgForm from "$lib/components/CreateOrgForm.svelte";
    import InfoToolTip from "$lib/components/InfoToolTip.svelte";

    let loading = $state(true);
    const org_id = parseInt($page.params.org_id);
    let organization = $state({});
    let hosts = $state([]);

    let isCoachModalOpen = $state(false);
    let editOrganizationModalOpen = $state(false);
    let allCoaches = $state([]);
    let initialResponses = $state({});

    async function openStudentModal() {
        try {
            allCoaches = await getAllCoachesOutsideOrg(org_id);
            isCoachModalOpen = true;
        } catch (e) {
            handleError(e);
        }
    }

    async function selectCoach(e, coach) {
        try {
            e.preventDefault();

            const coachPerson = await addCoachToOrganization(
                coach.person.coach_id,
                org_id,
            );

            const newOrganization = { ...organization };
            newOrganization.coaches = [...organization.coaches, coachPerson];
            organization = newOrganization;

            toast.success("Added coach to this organization.");
            isCoachModalOpen = false;
            location.reload();
        } catch (error) {
            handleError(error);
        }
    }

    async function handleDeleteCoach(coach_id: string) {
        try {
            await removeCoachFromOrganization(coach_id, org_id);

            organization.coaches = organization.coaches.filter(
                (coach) => coach.coach_id !== coach_id,
            );

            showDeleteConfirmation = false;
            toast.success("Successfully removed coach from organization");
        } catch (e) {
            handleError(e);
        }
    }

    (async () => {
        organization = await getOrganization(org_id);
        hosts = await getAllPublicHosts();

        initialResponses = {
            name: organization.name,
            address: organization.address,
        };

        loading = false;
    })();
</script>

{#if loading}
    <Loading />
{:else}
    <br />
    <h1 class="header">{organization.name}</h1>
    <h2>{organization.address}</h2>
    <br />
    <ButtonGroup>
        <Button
            outline
            pill
            color="primary"
            onclick={() => {
                editOrganizationModalOpen = true;
            }}
        >
            <PenSolid class="w-4 h-4 me-2" />
            Edit Organizations
        </Button>
        <!--<Button outline pill color="primary" onclick={openStudentModal}>
            <CirclePlusSolid class="w-4 h-4 me-2" />
            Add Coach
        </Button>-->
    </ButtonGroup>
    <br /><br />

    <h3 class="text-xl font-medium text-gray-900 dark:text-white flex">
        <InfoToolTip
            text="Hosts are the people who organize the events. The hosts below have events you are registered or can register for"
        />Hosts
    </h3>
    <br />
    <div class="buttonContainer">
        {#each hosts as host}
            <div>
                <div class="problemContainer">
                    <div style="align-items: left">
                        <h4>{host.host_name}</h4>
                        <p style="overflow-wrap: anywhere;">
                            <a href={`mailto:${host.email}`}>{host.email}</a>
                        </p>
                    </div>
                    <br />
                    <div>
                        <Button
                            size="sm"
                            href={`/coach/${org_id}/${host.host_id}`}
                            pill>Go to Host</Button
                        >
                    </div>
                </div>
            </div>
        {/each}
    </div>
    {#if hosts.length == 0}
        <p class="text-center">No hosts with public events found</p>
    {/if}

    <!--<br /><br />
    <h3 class="text-xl font-medium text-gray-900 dark:text-white">Coaches</h3>
    <div class="tableMax">
        <TableName
            actionType="delete"
            items={organization.coaches}
            action={handleDeleteCoach}
        />
    </div>-->
{/if}

<Modal bind:open={isCoachModalOpen} size="md" autoclose={false}>
    <h3 class="text-xl font-medium text-gray-900 dark:text-white">
        Select Coach
    </h3>
    <div class="tableMaxHeight">
        <TableName
            actionType="select_coach"
            items={allCoaches}
            action={selectCoach}
        />
    </div>
</Modal>

<div class="modalExterior">
    <Modal bind:open={editOrganizationModalOpen} size="md" autoclose={false}>
        <h3 class="text-xl font-medium text-gray-900 dark:text-white">
            Edit Organization
        </h3>
        <div class="tableMaxHeight">
            <CreateOrgForm
                initial={initialResponses}
                {org_id}
                typeOrgForm="edit"
            />
        </div>
    </Modal>
</div>

<style>
    .tableMax {
        max-width: 800px;
        margin: 0 auto;
    }

    .tableMaxHeight {
        max-height: 500px;
        overflow-y: scroll;
    }

    :global(.center-text button) {
        text-align: center;
    }
</style>
