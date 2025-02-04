<script lang="ts">
	import { user } from "$lib/sessionStore";
	import { addOrganization, getCoach } from "$lib/supabase";
	import Loading from "$lib/components/Loading.svelte";
    import CustomForm from "$lib/components/CustomForm.svelte";
    import { handleError } from "$lib/handleError";

	let loading = $state(true);
    let newResponses = $state({});
    let validationErrors = $state([]);

    async function handleSubmit() {
        try {
            console.log(newResponses);
            const organization = await addOrganization(newResponses, $user.id);
            window.location.href = `/coach/org/${organization.org.org_id}`;
        } catch (e) {
            handleError(e);
        }
    }

	(async () => {
		loading = false;
	})();
</script>

{#if loading}
	<Loading />
{:else}
    <br />
    <h1 class="header">Create Organization</h1>
    <CustomForm
        fields={[
            {
                name: "name",
                label: "Organization Name",
                type: "text",
                required: true,
                editable: true
            },
            {
                name: "address",
                label: "Address",
                type: "text",
                required: true,
                editable: true
            }
        ]}
        handleSubmit={handleSubmit}
        custom_fields={[]}
        bind:newResponses
        bind:validationErrors />
{/if}