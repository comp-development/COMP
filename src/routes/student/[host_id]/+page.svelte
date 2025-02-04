<script lang="ts">
	import { page } from "$app/stores";
	import Loading from "$lib/components/Loading.svelte";
	import { user } from "$lib/sessionStore";
	import { Button } from "flowbite-svelte";
	import {
		getHostInformation,
		getHostEvents,
		getStudentHostEvents,
	} from "$lib/supabase";
    import MarkdownRender from "$lib/components/MarkdownRender.svelte";

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
	let host: any = $state();
	const host_id = parseInt($page.params.host_id);

	(async () => {
		host = await getHostInformation(host_id);

		my_events = (await getStudentHostEvents($user!.id, host_id)).map(
			(e) => ({
				event_id: e.event_id.toString(),
				event_name: e.event.event_name ?? "Unnamed Event",
				event_date: e.event.event_date ?? "Missing Date",
			}),
		);
		// TODO: include events where the student joined with an org
		// but is not yet in a team
		my_events.sort((a, b) => (a.event_date < b.event_date ? -1 : 1));
		for (const e of my_events) {
			my_event_ids.add(e.event_id.toString());
		}

		all_events = (await getHostEvents(host_id)) as any;

		loading = false;
	})();
</script>

{#if loading}
	<Loading />
{:else}
	<div class="container mx-auto p-6 space-y-6">
		<h2 class="text-2xl font-bold text-gray-800 text-center">
			Welcome to...
		</h2>
		<h1 class="text-4xl font-extrabold text-center">{host?.host_name}</h1>

		{#if host?.logo}
			<div class="flex justify-center">
				<img
					src={host.logo}
					alt="{host.host_name} logo"
					class="w-32 h-32 rounded-full shadow-lg"
				/>
			</div>
		{/if}

		{#if host?.email}
			<div class="text-center">
				<p class="text-lg text-gray-600">Contact us at:</p>
				<a
					href="mailto:{host.email}"
					class="text-lg text-blue-500 hover:underline"
					>{host.email}</a
				>
			</div>
		{/if}

		{#if host?.summary}
			<div class="summary">
				<h2>Summary</h2>
				<br />
				<MarkdownRender source={host.summary} />
			</div>
		{/if}
	</div>
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
						<Button
							size="sm"
							href={`./${host_id}/${event.event_id}`}
							pill>Go to Event</Button
						>
					</div>
				</div>
			</div>
		{/each}
	</div>
	{#if my_events.length == 0}
		<p style="text-align: center;">No events found</p>
	{/if}
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
							<p style="display: inline-block">
								{event.event_date}
							</p>
						</div>
					</div>
					<br />
					<div>
						<Button
							size="sm"
							href={`./${host_id}/${event.event_id}`}
							pill
							>{my_event_ids.has(event.event_id.toString())
								? "Go to Event"
								: "Sign Up"}</Button
						>
					</div>
				</div>
			</div>
		{/each}
	</div>
	<br />
{/if}

<style>
	.container {
        max-width: 768px;
    }

	.summary {
        border: 3px solid var(--primary-tint);
        padding: 10px;
        margin: 10px;
        border-radius: 15px;
    }
	
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
		justify-content: space-between;
	}

	.problemContainer h4 {
		font-weight: bold;
		margin-right: 5px;
	}

	.problemContainer {
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
