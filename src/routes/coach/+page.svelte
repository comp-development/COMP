<script lang="ts">
	import { user } from "$lib/sessionStore";
	import { getCoach, getCoachOrganizations } from "$lib/supabase";
	import Loading from "$lib/components/Loading.svelte";
    import { Button } from "flowbite-svelte";

	let coach: any = $state();
	let loading = $state(true);
	let organizations = $state([]);

	(async () => {
		coach = await getCoach($user!.id);
		organizations = await getCoachOrganizations($user!.id);
		loading = false;
	})();
</script>

{#if loading}
	<Loading />
{:else}
    <br />
    <h1 class="header">Welcome to the Coach Portal</h1>
    <h2>{coach.first_name} {coach.last_name}</h2>
	<br />
	<Button pill href="/coach/org">Create Organization</Button>
	<br /><br /><br />
	<h3>Your Current Organizations</h3>
	<br />
	<div class="buttonContainer">
		{#each organizations as organization}
			<div>
				<div class="problemContainer">
					<div style="align-items: left">
						<h4>
							{organization.orgs.name}
						</h4>
						<p>{organization.orgs.address}</p>
					</div>
					<br />
					<div>
						<Button
							size="sm"
							href={`/coach/org/${organization.org_id}`}
							pill>Go to Organization</Button
						>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.buttonContainer {
		display: grid;
		grid-template-columns: 32% 32% 32%;
		row-gap: 20px;
		column-gap: 20px;
		margin: 0 auto;
		width: 70%;
	}

	.problemContainer {
		background-color: white;
		border: 3px solid var(--primary-tint);
		padding: 20px;
		height: 100%;
		border-radius: 20px;
		font-weight: bold;
		text-decoration: none;
		color: var(--text-color-dark);
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		text-align: left;
	}

	.problemContainer h4 {
		font-weight: bold;
		margin-right: 5px;
	}
</style>