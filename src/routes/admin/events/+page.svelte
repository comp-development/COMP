<script>
	import {
		DataTable,
		Link,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Pagination,
	} from "carbon-components-svelte";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import { getAllEvents } from "$lib/supabase";
    import Button from "$lib/components/Button.svelte";

	let events = [];
	let pageSize = 25;
	let page = 1;

	async function getEvents() {
		try {
			events = await getAllEvents();
			console.log(events);
		} catch (error) {
			handleError(error);
		}
	}

	getEvents();
</script>

<br />
<h1>Admin: View Events</h1>
<br />
<Button title="Import New Event" />
<br /><br /><br />

<div style="margin-left: 10px; margin-right: 10px;">
	{#if events.length === 0}
		<p>No events</p>
	{:else}
		<DataTable
			sortable
			size="compact"
			headers={[
				{ key: "edit", value: "", width: "20px"},
				{ key: "event_id", value: "ID" },
				{ key: "event_name", value: "Name" },
				{ key: "event_date", value: "Date" },
			]}
			rows={events}
			{pageSize}
			{page}
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
							<Link class="link" href={"/admin/events/" + row.event_id}
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
			bind:page
			totalItems={events.length}
			pageSizeInputDisabled
		/>
	{/if}
</div>
