<script lang="ts">
  import StudentTeam from "$lib/components/StudentTeam.svelte";
  import { page } from "$app/stores";
  import {
    deleteStudentTeam,
    deleteTeam,
    getAllStudentsWithoutTeam,
    getEventInformation,
    getTeam,
  } from "$lib/supabase";
  import Loading from "$lib/components/Loading.svelte";
  import { handleError } from "$lib/handleError";

  const host_id = parseInt($page.params.host_id);
  const event_id = parseInt($page.params.event_id);
  const team_id = parseInt($page.params.team_id);

  let team = $state({});
  let event_details = $state({});
  let loading = $state(true);
  let studentsWithoutTeams = $state([]);

  (async () => {
    try {
      team = await getTeam(team_id);
      event_details = await getEventInformation(event_id);
      studentsWithoutTeams = await getAllStudentsWithoutTeam(event_id);

      loading = false;
    } catch (e) {
      handleError(e);
    }
  })();

  async function handleDeleteTeam() {
    try {
      await deleteTeam(team_id);
      window.location.href = `/admin/${host_id}/${event_id}`;
    } catch (e) {
      await handleError(e);
    }
  }

  async function handleDeleteStudent(e, student) {
    try {
      e.preventDefault();
      await deleteStudentTeam(student.student_event_id);

      team = {
        ...team,
        teamMembers: team.teamMembers.filter(
          (member: any) => member.student_event_id !== student.student_event_id,
        ),
      };

      studentsWithoutTeams.push(student);

      toast.success("Successfully deleted student from team.");
    } catch (e) {
      await handleError(e);
    }
  }
</script>

{#if loading}
  <Loading />
{:else}
  <h1>{team?.team_name}</h1>
  <br />
  <div class="teamContainer">
    <StudentTeam
      {event_id}
      org_id={team?.org_id}
      {team}
      editableFeatures={true}
      waiverType={event_details?.waivers?.type ?? "none"}
      bind:studentsWithoutTeams
      onDrop={() => {}}
      onDragStart={() => {}}
      onDeleteStudent={handleDeleteStudent}
      handleDragOver={() => {}}
      handleDragLeave={() => {}}
      maxTeamSize={event_details?.max_team_size}
      {handleDeleteTeam}
    />
  </div>
{/if}

<style>
  .teamContainer {
    max-width: 800px;
    margin: 0 auto;
    padding: 0px 20px;
  }
</style>
