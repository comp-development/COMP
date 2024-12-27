<script lang="ts">
    import { user } from "$lib/sessionStore";
	import {
		getStudentTeams,
		getThisUser,
		getStudent,
		getAllEvents,
	} from "$lib/supabase";
	import type { User } from "@supabase/supabase-js";

	let student: any;
	let my_events: {
		event_id: string;
		event_name: string;
		event_date: string;
	}[] = [];
	let all_events: {
		event_id: string;
		event_name: string;
		event_date: string;
	}[] = [];
	let loading = true;

	(async () => {
		student = await getStudent($user!.id);
		const eventsUnedited = await getStudentTeams($user!.id);

		eventsUnedited.forEach((event) => {
			my_events.push({
				event_id: event.teams.event_id.toString(),
				event_name: event.teams.events.event_name ?? "Unnamed Event",
				event_date: event.teams.events.event_date ?? "Missing Date",
			});
		});
		all_events = (await getAllEvents()) as any;

		loading = false;
	})();
</script>

{#if loading}
	<p>Loading...</p>
{:else}
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
						<p>{event.event_date}</p>
					</div>
					<div class="flex">
						<a href={`./student/${event.event_id}`}>Go to Event</a>
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
