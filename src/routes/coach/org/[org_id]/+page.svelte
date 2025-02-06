<script lang="ts">
    import { user } from "$lib/sessionStore";
    import Loading from "$lib/components/Loading.svelte";
    import { page } from "$app/stores";
    import {
        addCoachToOrganization,
        getAllCoachesOutsideOrg,
        getOrganization,
        removeCoachFromOrganization,
    } from "$lib/supabase";
    import {
        Button,
        ButtonGroup,
        Modal
    } from "flowbite-svelte";
    import { CirclePlusSolid, PenSolid } from "flowbite-svelte-icons";
    import { handleError } from "$lib/handleError";
    import toast from "$lib/toast.svelte";
    import TableName from "$lib/components/TableName.svelte";
    import CreateOrgForm from "$lib/components/CreateOrgForm.svelte";

    let loading = $state(true);
    const org_id = parseInt($page.params.org_id);
    let organization = $state({});

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

            const coachPerson = await addCoachToOrganization(coach.person.coach_id, org_id);
            organization = {
                ...organization,
                coaches: [...organization.coaches, coachPerson],
            };

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
        try {
            organization = await getOrganization(org_id);
        } catch (e) {
            toast.error("Organization doesn't exist");
            window.location.href = "/coach";
            return;
        }

        initialResponses = {
            name: organization.name,
            address: organization.address,
        };

        if (
            !organization.coaches.some((coach) => coach.coach_id === $user?.id)
        ) {
            toast.error("You are not a part of this organization.");
            window.location.href = "/coach";
            return;
        }

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
            onclick={() => { editOrganizationModalOpen = true; }}
        >
            <PenSolid class="w-4 h-4 me-2" />
            Edit
        </Button>
        <Button
            outline
            pill
            color="primary"
            onclick={openStudentModal}
        >
            <CirclePlusSolid class="w-4 h-4 me-2" />
            Add Coach
        </Button>
    </ButtonGroup>
    <br /><br />

    <h3 class="text-xl font-medium text-gray-900 dark:text-white">Coaches</h3>
    <div class="tableMax">
        <TableName actionType="delete" items={organization.coaches} action={handleDeleteCoach} />
    </div>
{/if}

<Modal bind:open={isCoachModalOpen} size="md" autoclose={false}>
    <h3 class="text-xl font-medium text-gray-900 dark:text-white">
        Select Coach
    </h3>
    <div class="tableMaxHeight">
        <TableName actionType="select_coach" items={allCoaches} action={selectCoach} />
    </div>
</Modal>

<div class="modalExterior">
    <Modal bind:open={editOrganizationModalOpen} size="md" autoclose={false}>
        <h3 class="text-xl font-medium text-gray-900 dark:text-white">
            Edit Organization
        </h3>
        <div class="tableMaxHeight">
            <CreateOrgForm initial={initialResponses} org_id={org_id} />
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

    :global(.modalExterior div) {
        width: 100%;
    }

    :global(.center-text button) {
        text-align: center;
    }
</style>
