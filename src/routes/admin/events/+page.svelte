<script lang="ts">
	import {
		DataTable,
		Link,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Pagination,
	} from "carbon-components-svelte";
	import { handleError } from "$lib/handleError";
	import { getAllEvents } from "$lib/supabase";
    import Button from "$lib/components/Button.svelte";
    import toast from "svelte-french-toast";

	let pageSize = 25;
	let page = 1;
	let loading = true;
	let events = [];

	async function roleManager() {
		try {
            events = await getAllEvents();

			events.forEach((event) => {
				event.id = event.event_id;
			})

			loading = false;
		} catch (error) {
			handleError(error);
		}
	}

	roleManager();
</script>

<br />
<h1>Admin: Events</h1>

{#if loading}
	<p>Loading...</p>
{:else}
    <br />
    <Button title="Import Tournament from COMPOSE" action={() => { toast.error("Needs to be implemented") }} />
    <br />
    <br />
	<div style="padding: 10px;">
		<DataTable
			sortable
			size="compact"
			headers={[
				{ key: "edit", value: "", width: "20px"},
                { key: "id", value: "ID" },
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
							<Link class="link" href={"/admin/" + row.event_id}
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
	</div>
{/if}