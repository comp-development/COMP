<script lang="ts">
  import { page } from "$app/stores";
  import { supabase } from "$lib/supabaseClient";
  import { checkUserInvitedToOrgEvent, getOrganizationDetails, getThisUser, removeUserInvitationFromOrgEvent } from "$lib/supabase";
  import { handleError } from "$lib/handleError";
  import { Button } from "flowbite-svelte";
  import Loading from "$lib/components/Loading.svelte";
  import toast from "$lib/toast.svelte";

  const host_id = parseInt($page.params.host_id);
  const event_id = parseInt($page.params.event_id);

  let loading = $state(true);
  let token: string | null = null;
  let failure: { reason: string } | null = $state(null);
  let email = $state(null);
  let org_id = $state(null);
  let org = $state(null);

  (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error != null) {
      handleError(error);
    }
    token = data.session?.access_token ?? null;

    email = $page.url.searchParams.get('email');
    org_id = parseInt($page.url.searchParams.get('org_id'));

    let user = await getThisUser();
    if (user.email != email) {
      throw new Error("You are not logged into the correct account.");
    }

    let isInvited = await checkUserInvitedToOrgEvent(org_id, event_id, email);
    if (!isInvited) {
      throw new Error("User is not invited to this organization.");
    }

    org = await getOrganizationDetails(org_id, event_id);

    let body = {
      event_id,
      token,
      join_code: org.event.join_code,
    };

    try {
      const response = await fetch(`/student/${host_id}/${event_id}/join-org/${org.event.join_code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: {
        success?: { team_join_code: string };
        failure?: { reason: string; stripe_url?: string } | null;
      } = await response.json();

      if (response.ok) {
        await removeUserInvitationFromOrgEvent(org_id, event_id, email);
        toast.success("You have successfully joined the organization!");
        window.location.href = `/student/${host_id}/${event_id}`;
      } else {
        handleError(new Error(json.failure?.reason));
        failure = json.failure!;
      }
    } catch (err) {
      handleError(err);
      failure = { reason: err.message };
    }

    loading = false;
  })();
</script>

{#if loading}
  <Loading />
{:else}
  {#if failure}
    <h2>Failed to Join Organization</h2>
    <p>{failure?.reason}</p>
    <br />
    <Button href=".." pill>Return to event</Button>
  {/if}
{/if}