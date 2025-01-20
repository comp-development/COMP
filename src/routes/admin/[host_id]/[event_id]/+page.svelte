<script lang="ts">
	import {
		DataTable,
		Link,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Pagination,
	} from "carbon-components-svelte";
	import { page } from "$app/stores";
	import {
		getEventInformation,
		getEventTeams,
		getEventTests,
	} from "$lib/supabase";
	import { handleError } from "$lib/handleError";
	import Button from "$lib/components/Button.svelte";

	let hostId = $page.params.host_id;
	let eventId = $page.params.event_id;
	let pageSize = $state(25);
	let pages = $state(1);
	let pageSize2 = $state(25);
	let pages2 = $state(1);
	let tests = $state([]);
	let teams = $state([]);
	let event_information = $state({});
	let loading = $state(true);

	async function loadInformation() {
		try {
			tests = await getEventTests(Number(eventId));
			tests = tests.map(({ test_id: id, ...rest }) => ({ id, ...rest }));
			teams = await getEventTeams(Number(eventId));
			teams = teams.map(({ team_id: id, ...rest }) => ({ id, ...rest }));
			event_information = await getEventInformation(Number(eventId));
			loading = false;
		} catch (error) {
			handleError(error);
		}
	}

	loadInformation();
</script>

{#if loading}
	<p>Loading...</p>
{:else}
	<br />
	<h1>{event_information.event_name}</h1>
	<p>Event Id: {eventId}</p>
	<p>Date: {event_information.event_date}</p>
	<br />

	<Button title="Update Tournament Information" />
	<br /><br />
	<Button title="Import Students into Event" />
	<br /><br /><br />

	<p style="font-weight: bold;">Tests</p>
	<div style="margin-left: 10px; margin-right: 10px;">
		{#if tests.length === 0}
			<p>No tests</p>
		{:else}
			<DataTable
				sortable
				size="compact"
				headers={[
					{ key: "edit", value: "", width: "20px" },
					{ key: "id", value: "ID" },
					{ key: "test_name", value: "Name" },
					{ key: "division", value: "Division" },
					{ key: "opening_time", value: "Opening Time" },
					{ key: "buffer_time", value: "Buffer Time" },
				]}
				rows={tests}
				{pageSize}
				{pages}
			>
				<Toolbar size="sm">
					<ToolbarContent>
						<ToolbarSearch persistent shouldFilterRows />
					</ToolbarContent>
				</Toolbar>

				{#snippet cell({ row, cell, rowIndex })}
							
						<div>
							{#if cell.key === "edit"}
								<div class="pencil">
									<Link
										class="link"
										href={`/admin/${hostId}/${eventId}/tests/${row.id}`}
										><i class="ri-pencil-fill"></i></Link
									>
								</div>
							{:else}
								<div style="overflow: hidden;">
									{cell.value == null || cell.value == ""
										? "None"
										: cell.value}
								</div>
							{/if}
						</div>
					
							{/snippet}
			</DataTable>

			<Pagination
				bind:pageSize
				bind:page={pages}
				totalItems={tests.length}
				pageSizeInputDisabled
			/>
		{/if}
	</div>

	<br />
	<br />

	<p style="font-weight: bold;">Teams</p>
	<div style="margin-left: 10px; margin-right: 10px;">
		{#if teams.length === 0}
			<p>No teams</p>
		{:else}
			<DataTable
				sortable
				size="compact"
				headers={[
					{ key: "edit", value: "", width: "20px" },
					{ key: "id", value: "ID" },
					{ key: "team_name", value: "Name" },
					{ key: "division", value: "Division" },
				]}
				rows={teams}
				{pageSize2}
				{pages2}
			>
				<Toolbar size="sm">
					<ToolbarContent>
						<ToolbarSearch persistent shouldFilterRows />
					</ToolbarContent>
				</Toolbar>

				{#snippet cell({ row, cell, rowIndex })}
							
						<div>
							{#if cell.key === "edit"}
								<div class="pencil">
									<Link
										class="link"
										href={`/admin/${hostId}/${eventId}/teams/${row.id}`}
										><i class="ri-pencil-fill"></i></Link
									>
								</div>
							{:else}
								<div style="overflow: hidden;">
									{cell.value == null || cell.value == ""
										? "None"
										: cell.value}
								</div>
							{/if}
						</div>
					
							{/snippet}
			</DataTable>

			<Pagination
				bind:pageSize2
				bind:page={pages2}
				totalItems={teams.length}
				pageSizeInputDisabled
			/>
		{/if}
	</div>
	<br /><br />
{/if}
