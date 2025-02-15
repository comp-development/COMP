<script lang="ts">
  import { user } from "$lib/sessionStore";
  import { getCoach, getCoachOrganizations } from "$lib/supabase";
  import Loading from "$lib/components/Loading.svelte";
  import { Button } from "flowbite-svelte";
  import InfoToolTip from "$lib/components/InfoToolTip.svelte";

  let coach: any = $state();
  let loading = $state(true);
  let organizations = $state([]);

  (async () => {
    coach = await getCoach($user!.id);
    organizations = await getCoachOrganizations($user!.id);
    loading = false;
  })();
</script>

{#if loading}
  <Loading />
{:else}
  <br />
  <h1 class="header">Welcome to the Coach Portal</h1>
  <h2>{coach.first_name} {coach.last_name}</h2>
  <br />
  <Button pill href="/coach/create_org">Create Organization</Button>
  <br /><br /><br />
  <h3>Your Current Organizations</h3>
  <br />
  <div class="buttonContainer">
    {#each organizations as organization}
      <div>
        <div class="problemContainer">
          <div style="align-items: left">
            <h4>
              {organization.orgs.name}
            </h4>
            <p>{organization.orgs.address}</p>
          </div>
          <br />
          <div>
            <Button size="sm" href={`/coach/${organization.org_id}`} pill
              >Go to Organization</Button
            >
          </div>
        </div>
      </div>
    {/each}
  </div>
  {#if organizations.length === 0}
    <br />
    <div class="flex">
      <InfoToolTip
        text="You need to be a part of an organization to create teams with students"
      />
      <p>You are not a part of any organizations</p>
    </div>
  {/if}
{/if}
