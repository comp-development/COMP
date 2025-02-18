<script lang="ts">
  import { page } from "$app/stores";
  import Loading from "$lib/components/Loading.svelte";
  import { getHostInformation, userJoinAsHostAdmin, getThisUser } from "$lib/supabase";
  import { hashString } from "$lib/encrypt";
  import { Button } from "flowbite-svelte";
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";

  let loading = $state(true);
  let host = $state(null);
  let user_id = $state(null);

 (async () => {
    try {
      let email = $page.url.searchParams.get('email');
      let user = await getThisUser();
      if (user.email != email) {
        throw new Error("You are not logged into the correct account.");
      }
      user_id = user.id;

      let host_id = Number($page.url.searchParams.get('host_id'));
      let hashed_host_id = $page.url.searchParams.get('hashed_host_id');
      let encoded_host_id = await hashString(host_id);

      if (hashed_host_id != encoded_host_id) {
        throw new Error("Hash is incorrect.");
      }

      host = await getHostInformation(host_id);
      loading = false;
    } catch (err) {
      handleError(err);
    }
  })();

  async function acceptInvitation() {
    try {
      await userJoinAsHostAdmin(user_id, host.host_id);
      toast.success("You have successfully joined the host!");
      window.location.href = `/admin/${host.host_id}`;
    } catch (err) {
      handleError(err);
    }
  }
</script>

{#if loading}
  <Loading />
{:else}
  <div class="flex flex-col items-center justify-center p-4">
    <img src={host.logo} alt="Logo" class="w-32 h-32 mb-6" />
    <h2 class="text-center mb-2">You have been invited to join {host?.host_name}</h2>
    <Button color="primary" onclick={() => acceptInvitation()}>Accept Invitation</Button>
  </div>
{/if}