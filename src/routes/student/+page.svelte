<script lang="ts">
    import { getStudentEvents, getThisUser } from "$lib/supabase";
    import { DataTable, Link, Pagination, Toolbar, ToolbarContent, ToolbarSearch } from "carbon-components-svelte";

    let user;
    let events = [];
    let pageSize = 25;
	let page = 1;
    let loading = true;

    (async () => {
        user = await getThisUser();
        const eventsUnedited = await getStudentEvents(user.id, "*, events(*)");

        eventsUnedited.forEach((event) => {
            events.push({
                id: event.event_id,
                name: event.events.event_name,
                date: event.events.event_date
            })
        })

        loading = false;
    })();
</script>

{#if loading}
    <p>Loading...</p>
{:else}
    <br />
    <h1 style="text-align: center;">My Events</h1>
    <br />
    <div style="padding: 10px;">
		<DataTable
			sortable
			size="compact"
			headers={[
                { key: "edit", value: "", width: "20px"},
                { key: "id", value: "ID" },
				{ key: "name", value: "Name" },
				{ key: "date", value: "Date" },
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
							<Link class="link" href={"/student/" + row.id}
								><i class="fa-solid fa-arrow-up-right-from-square" /></Link
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
