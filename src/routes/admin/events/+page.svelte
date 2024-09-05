<script>
	import { DataTable } from "carbon-components-svelte";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import { getAllEvents } from "$lib/supabase";

	let events = [];

	// DataTable headers
	const headers = [
		{ key: 'id', header: 'ID' },
		{ key: 'event_name', header: 'Event Name' },
		{ key: 'event_date', header: 'Date' }
	];

	async function getEvents() {
		try {
			events = await getAllEvents();
            console.log(events);
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	getEvents();
</script>

<br />
<h1>Admin: View Events</h1>
<br />

<div style="margin-left: 10px; margin-right: 10px;">
    {#if events.length === 0}
        <p>No upcoming events</p>
    {:else}
        <DataTable {headers} rows={events} striped sortable></DataTable>
    {/if}
</div>