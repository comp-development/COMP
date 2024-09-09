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
    import { getEventInformation, getEventTests } from "$lib/supabase";
    import { handleError } from "$lib/handleError";
    import Button from "$lib/components/Button.svelte";

    let eventId = $page.params.event_id;
    let pageSize = 25;
	let pages = 1;
    let tests = [];
    let event_information = {};

    async function getTests() {
		try {
			tests = await getEventTests(Number(eventId));
            event_information = await getEventInformation(Number(eventId));
			console.log(tests);
		} catch (error) {
			handleError(error);
		}
	}

	getTests();
</script>

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
				{ key: "edit", value: "", width: "20px"},
				{ key: "test_id", value: "ID" },
				{ key: "test_name", value: "Name" },
				{ key: "division", value: "Division" },
				{ key: "opening_time", value: "Opening Time" },
				{ key: "buffer_time", value: "Buffer Time" }
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

			<svelte:fragment slot="cell" let:row let:cell let:rowIndex>
				<div>
					{#if cell.key === "edit"}
						<div class="pencil">
							<Link class="link" href={"/admin/tests/" + row.test_id}
								><i class="ri-pencil-fill" /></Link
							>
						</div>
					{:else}
						<div style="overflow: hidden;">
							{cell.value == null || cell.value == "" ? "None" : cell.value}
						</div>
					{/if}
				</div>
			</svelte:fragment>
		</DataTable>

		<Pagination
			bind:pageSize
			bind:page={pages}
			totalItems={tests.length}
			pageSizeInputDisabled
		/>
	{/if}
</div>
