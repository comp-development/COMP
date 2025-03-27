<script lang="ts">
  import { user } from "$lib/sessionStore";
  import Loading from "$lib/components/Loading.svelte";
  import { handleError } from "$lib/handleError";
  import { Button } from "flowbite-svelte";
  import InfoToolTip from "$lib/components/InfoToolTip.svelte";
  import { getAdmin, getAdminHosts } from "$lib/supabase";
  import EditNameForm from "$lib/components/EditNameForm.svelte";

  let admin: any = $state();
  let hosts = $state([]);
  let loading = $state(true);

  async function loadData() {
    try {
      admin = await getAdmin($user!.id);
      hosts = await getAdminHosts($user!.id);
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
  <div class="flex items-center gap-1">
    <h1>Welcome, {admin.first_name} {admin.last_name}</h1>
    <EditNameForm 
      firstName={admin.first_name} 
      lastName={admin.last_name} 
      userType="admin" 
      onUpdate={loadData}
    />
  </div>
  <h2 style="font-weight: 500">{$user?.email}</h2>
  <br /><br />
  <h3 class="text-xl font-medium text-gray-900 dark:text-white flex">
    Your Hosts
    <InfoToolTip
      text="Hosts are the organizers of events. To create a host, talk to the creators of COMP"
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
            <Button size="sm" href={`/admin/${host.host_id}`} pill
              >Go to Host</Button
            >
          </div>
        </div>
      </div>
    {/each}
  </div>
  {#if hosts.length == 0}
    <p class="text-center">You are not a part of any hosts</p>
  {/if}
{/if}
