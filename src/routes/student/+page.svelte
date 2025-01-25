<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { user } from "$lib/sessionStore";
	import { getStudentEvents, getStudent, getAllEvents } from "$lib/supabase";
	import Loading from "$lib/components/Loading.svelte";

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
		my_events = (await getStudentEvents($user!.id)).map((e) => ({
			event_id: e.event_id.toString(),
			event_name: e.event.event_name ?? "Unnamed Event",
			event_date: e.event.event_date ?? "Missing Date",
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
	<Loading />
{:else}
	<br />
	<h1>Welcome, {student.first_name} {student.last_name}</h1>
	<h2 style="font-weight: 500">{$user?.email}</h2>
	<br />
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
					<br />
					<div>
						<Button size="sm" href={`./student/${event.event_id}`} pill>Go to Event</Button>
					</div>
				</div>
			</div>
		{/each}
	</div>
	<br />
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
					<br />
					<div>
						<Button size="sm" href={`./student/${event.event_id}`} pill>{my_event_ids.has(event.event_id.toString()) ? "Go to Event" : "Sign Up"}</Button>
					</div>
				</div>
			</div>
		{/each}
	</div>
	<br />
{/if}

<style>
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
		justify-content: space-between
	}

	.problemContainer h4 {
		font-weight: bold;
		margin-right: 5px;
	}

	.problemContainer  {
		text-align: left;
	}

	.buttonContainer {
		display: grid;
		grid-template-columns: 32% 32% 32%;
		row-gap: 20px;
		column-gap: 20px;
		margin: 0 auto;
		width: 70%;
	}
</style>
