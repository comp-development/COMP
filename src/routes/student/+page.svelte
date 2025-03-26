<script lang="ts">
  import { user } from "$lib/sessionStore";
  import { getAllPublicHosts, getStudent } from "$lib/supabase";
  import Loading from "$lib/components/Loading.svelte";
  import { handleError } from "$lib/handleError";
  import { Button } from "flowbite-svelte";
  import InfoToolTip from "$lib/components/InfoToolTip.svelte";
  import EditNameForm from "$lib/components/EditNameForm.svelte";

  let student: any = $state();
  let hosts = $state([]);
  let loading = $state(true);

  async function loadData() {
    try {
      student = await getStudent($user!.id);
      hosts = await getAllPublicHosts();
      loading = false;
    } catch (error) {
      handleError(error);
    }
  }

  (async () => {
    await loadData();
  })();
</script>

{#if loading}
  <Loading />
{:else}
  <br />
  <div class="flex items-center gap-1">
    <h1>Welcome, {student.first_name} {student.last_name}</h1>
    <EditNameForm 
      firstName={student.first_name} 
      lastName={student.last_name} 
      userType="student" 
      onUpdate={loadData}
    />
  </div>
  <h2 style="font-weight: 500">{$user?.email}</h2>
  <br /><br />
  <h3 class="text-xl font-medium text-gray-900 dark:text-white flex">
    Hosts
    <InfoToolTip
      text="Hosts are the organizers of events. The hosts below have events that you can register for."
    />
  </h3>
  <br />
  <div class="buttonContainer">
    {#each hosts as host}
      <div>
        <div class="problemContainer">
          <div style="align-items: left">
            <h4>{host.host_name}</h4>
            <p style="overflow-wrap: anywhere;">
              <a href={`mailto:${host.email}`}>{host.email}</a>
            </p>
          </div>
          <br />
          <div>
            <Button size="sm" href={`/student/${host.host_id}`} pill
              >Go to Host</Button
            >
          </div>
        </div>
      </div>
    {/each}
  </div>
  {#if hosts.length == 0}
    <p class="text-center">No hosts with public events found</p>
  {/if}
{/if}
