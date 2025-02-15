<script lang="ts">
	import { page } from "$app/stores";
	import { getEventInformation, getEventTeams, getEventOrganizations, getEventIndependentTeams } from "$lib/supabase";
	import { handleError } from "$lib/handleError";
	import Loading from "$lib/components/Loading.svelte";
	import EventDisplay from "$lib/components/EventDisplay.svelte";
	import TableName from "$lib/components/TableName.svelte";
    import { Button } from "flowbite-svelte";

	let hostId = $page.params.host_id;
	let eventId = $page.params.event_id;
	let teams = $state([]);
	let event_information = $state({});
	let loading = $state(true);
	let organizations = $state([]);
	let independentTeams = $state([]);

	async function loadInformation() {
		try {
			teams = await getEventTeams(Number(eventId));
			teams = teams.map(({ team_id: id, ...rest }) => ({ id, ...rest }));
			event_information = await getEventInformation(Number(eventId));

			organizations = await getEventOrganizations(Number(eventId));
			independentTeams = await getEventIndependentTeams(Number(eventId));

			loading = false;
		} catch (error) {
			handleError(error);
		}
	}

	loadInformation();
</script>

{#if loading}
	<Loading />
{:else}
	<EventDisplay
		id={eventId}
		name={event_information.event_name}
		date={event_information.event_date}
		logo={event_information.logo != "" ? event_information.logo : host.logo}
		email={event_information.email ?? host.email}
		markdown={event_information.summary}
		editable={true}
	/>
	
	<div class="mt-4 mb-4 p-4">
		<h2 class="text-2xl font-bold mb-4">Registered Organizations</h2>
		<div class="tableMax">
			<TableName
				actionType="edit"
				items={organizations}
				action={(e, org) => {
					window.location.href = `/admin/${hostId}/${eventId}/org/${org.org_id}`;
				}}
				columns = {[
					{
						label: "Name",
						value: (item) => item.org.name,
						sortable: true,
					},
					{
						label: "Address",
						value: (item) => item.org.address,
						sortable: true,
					},
					{
						label: "Join Code",
						value: (item) => item.join_code,
						sortable: true,
					},
				]}
			/>
		</div>
		{#if organizations.length === 0}
			<p class="text-center text-gray-500 mt-4">No organizations registered yet</p>
		{/if}
	</div>

	<div class="mt-4 mb-4 p-4">
		<h2 class="text-2xl font-bold mb-4">Independent Teams</h2>
		<Button pill href={`/admin/${hostId}/${eventId}/team`}>Create Team</Button>
		<div class="tableMax">
			<TableName
				actionType="edit"
				items={independentTeams}
				action={(e, team) => {
					window.location.href = `/admin/${hostId}/${eventId}/team/${team.team_id}`;
				}}
				columns = {[
					{
						label: "Name",
						value: (item) => item.team_name,
						sortable: true,
					},
					{
						label: "Front ID",
						value: (item) => item.front_id,
						sortable: true,
					},
					{
						label: "Join Code",
						value: (item) => item.join_code,
						sortable: true,
					},
				]}
			/>
		</div>
		{#if teams.length === 0}
			<p class="text-center text-gray-500 mt-4">No independent teams registered yet</p>
		{/if}
	</div>
{/if}

<style>
	.tableMax {
		max-width: 800px;
		margin: 0 auto;
	}
</style>
