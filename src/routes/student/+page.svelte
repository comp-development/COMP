<script lang="ts">
<<<<<<< HEAD
	import { user } from "$lib/sessionStore";
	import { getStudent } from "$lib/supabase";
	import Loading from "$lib/components/Loading.svelte";

	let student: any = $state();
	let loading = $state(true);

	(async () => {
		student = await getStudent($user!.id);
		loading = false;
	})();
=======
    import { getStudentEvents, getEventsbyStudentID, getThisUser, getUser, getStudent } from "$lib/supabase";
   

    let user;
	let student;
    let events = [];
  
    let loading = true;

    (async () => {
        user = await getThisUser();
		student = await getStudent(user.id);
        const eventsUnedited = await getEventsbyStudentID(user.id, "*, events(*)");

        eventsUnedited.forEach((event) => {
            events.push({
                event_id: event.event_id,
                event_name: event.events.event_name,
                event_date: event.events.event_date
            })
        })

        loading = false;
    })();
>>>>>>> juli-students-view
</script>

{#if loading}
	<Loading />
{:else}
<<<<<<< HEAD
	<br />
	<h1>Welcome, {student.first_name} {student.last_name}</h1>
	<h2 style="font-weight: 500">{$user?.email}</h2>
{/if}
=======
	<h1>Welcome, {student.first_name}</h1>
	<h3>{student.email}</h3>
    <br />
    <h2 style="text-align: center;">My Events</h2>
    <br />

	<div class="buttonContainer">
		{#each events as event}
			<div>
				<div class="problemContainer">
					<div style="align-items: left">
						<h4>
							{event.event_name}
						</h4>
						<p>{event.event_date}</p>
					</div>
					<div class="flex">
						<button
							on:click={async (e) => {
								window.location.href = `./student/${event.event_id}`;
							}}
						>
							Go to Event
						</button>
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

	.problemContainer button {
		outline: none;
		border: none;
		padding: 10px 30px;
		border-radius: 10px;
		background-color: #a7f0ba;
	}

	button:disabled,
	button[disabled] {
		cursor: not-allowed;
	}

	.problemContainer button:not([disabled]):hover {
		transform: scale(1.05);
		border: 2px solid #3f9656;
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
>>>>>>> juli-students-view
