<script lang="ts">
  import { page } from "$app/stores";
  import Loading from "$lib/components/Loading.svelte";
  import { getThisUser, getOrganization } from "$lib/supabase";
  import { Button } from "flowbite-svelte";
  import { handleError } from "$lib/handleError";

  let loading = $state(true);
  let org = $state(null);
  let user_id = $state(null);

 (async () => {
    try {
      let email = $page.url.searchParams.get('email');
      let org_id = $page.url.searchParams.get('org_id');
      let hashed_org_id = $page.url.searchParams.get('hashed_org_id');

      let user = await getThisUser();
      if (user.email != email) {
        throw new Error("You are not logged into the correct account.");
      }
      user_id = user.id;

      const response = await fetch(`/api/hash_data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, id: org_id })
      });
      const data = await response.json();
      if (data.error) throw data.error;

      if (data.hash != hashed_org_id) {
        throw new Error("Hash is incorrect.");
      }

      org = await getOrganization(org_id);
      loading = false;
    } catch (err) {
      handleError(err);
    }
  })();

  async function acceptInvitation() {
    try {
      /*to be implemented*/
    } catch (err) {
      handleError(err);
    }
  }
</script>

{#if loading}
  <Loading />
{:else}
  <div class="flex flex-col items-center justify-center p-4">
    <img src={org.logo} alt="Logo" class="w-32 h-32 mb-6" />
    <h2 class="text-center mb-2">You have been invited to join {org?.org_name}</h2>
    <Button color="primary" onclick={() => acceptInvitation()}>Accept Invitation</Button>
  </div>
{/if}