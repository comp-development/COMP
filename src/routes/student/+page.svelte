<script lang="ts">
  import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
  import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { user } from "$lib/sessionStore";
	import { getStudentTeams, getStudent, getAllEvents } from "$lib/supabase";
    import { supabase } from "$lib/supabaseClient";
    import { Tag } from "carbon-components-svelte";

	let student: any = $state();
	let my_events: {
		event_id: string;
		event_name: string;
		event_date: string;
	}[] = $state([]);
	let my_event_ids: Set<string> = new Set();
	let all_events: {
		event_id: number;
		event_name: string;
		event_date: string;
	}[] = $state([]);
	let loading = $state(true);

	(async () => {
		// console.log((await supabase.auth.getSession()).data.session?.access_token)
		student = await getStudent($user!.id);
		my_events = (await getStudentTeams($user!.id)).map((e) => ({
			event_id: e.teams.event_id.toString(),
			event_name: e.teams.events.event_name ?? "Unnamed Event",
			event_date: e.teams.events.event_date ?? "Missing Date",
		}));
		// TODO: include events where the student joined with an org
		// but is not yet in a team
		my_events.sort((a, b) => (a.event_date < b.event_date ? -1 : 1));
		for (const e of my_events) {
			my_event_ids.add(e.event_id.toString());
		}

		all_events = (await getAllEvents()) as any;

		loading = false;
	})();
</script>

{#if loading}
	<p>Loading...</p>
{:else}
	<div class="p-8">
		<Button>Example Dropdown button<ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" /></Button>
		<Dropdown>
		  <DropdownItem class="font-bold underline">Dashboard</DropdownItem>
		  <DropdownItem>Settings</DropdownItem>
		  <DropdownItem>Earnings</DropdownItem>
		  <DropdownItem>Sign out</DropdownItem>
		</Dropdown>
	</div>
	<h1>Welcome, {student.first_name}</h1>
	<h3>{$user?.email}</h3>
	<br />
	<h2 style="text-align: center;">My Events</h2>
	<br />

	<div class="buttonContainer">
		{#each my_events as event}
			<div>
				<div class="problemContainer">
					<div style="align-items: left">
						<h4>
							{event.event_name}
						</h4>
						<p>{event.event_date}</p>
					</div>
					<div class="flex">
						<a href={`./student/${event.event_id}`}>Go to Event</a>
					</div>
				</div>
			</div>
		{/each}
	</div>
	<br />
	<h2 style="text-align: center;">All Events</h2>
	<br />

	<div class="buttonContainer">
		{#each all_events as event}
			<div>
				<div class="problemContainer">
					<div style="align-items: left">
						<h4>
							{event.event_name}
						</h4>
						<div class="grouped" style="display: inline-block">
							<p style="display: inline-block">{event.event_date}</p>
						</div>
					</div>
					<div class="flex">
						<a href={`./student/${event.event_id}`}>{my_event_ids.has(event.event_id.toString()) ? "Go to Event" : "Sign Up"}</a>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.problemContainer {
		background-color: white;
		border: 3px solid var(--primary-tint);
		padding: 20px;
		margin: 10px;
		border-radius: 20px;
		font-weight: bold;
		text-decoration: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: var(--text-color-dark);
		transition: all 0.3s ease; /* Add transition for smooth hover effect */
	}

	.problemContainer h4 {
		font-weight: bold;
		margin-right: 5px;
	}

	.problemContainer  {
		text-align: left;
	}

	.problemContainer a {
		outline: none;
		/* avoid text placement shifting when hovered */
		border: 2px solid #00000000;
		padding: 10px 30px;
		border-radius: 10px;
		background-color: #a7f0ba;
	}

	.problemContainer a:hover {
		border: 2px solid #3f9656;
		scale: 1.05;
		background-color: #a7f0ba;
		cursor: pointer;
	}

	.buttonContainer {
		flex-direction: column; /* Align children vertically */
		align-items: center; /* Center children horizontally */
		justify-content: center; /* Center children vertically */
		margin: 0 auto; /* Center the container horizontally on the page */
		width: 70%;
	}
</style>
