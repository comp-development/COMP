<script>
    import TeamForm from "$lib/components/TeamForm.svelte";
    import { page } from "$app/stores";

    let hostId = $page.params.host_id;
	let eventId = $page.params.event_id;
    let team = $state({});
</script>

<h1>Add a New Team</h1>

<TeamForm
    title=""
    event_id={eventId}
    bind:team
    afterSubmit={async (newTeam) => {
        window.location.href = `/admin/${hostId}/${eventId}/team/${newTeam.team_id}`;
    }}
/>