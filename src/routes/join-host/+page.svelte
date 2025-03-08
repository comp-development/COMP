<script lang="ts">
  import { page } from "$app/stores";
  import Loading from "$lib/components/Loading.svelte";
  import { getHostInformation, userJoinAsHostAdmin, getThisUser, checkUserInvitedToHost, removeUserInvitationFromHost } from "$lib/supabase";
  import { Button } from "flowbite-svelte";
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";

  let loading = $state(true);
  let host = $state(null);
  let email = $state(null);
  let user_id = $state(null);

 (async () => {
    try {
      email = $page.url.searchParams.get('email');
      let host_id = $page.url.searchParams.get('host_id');

      let user = await getThisUser();
      if (user.email != email) {
        throw new Error("You are not logged into the correct account.");
      }

      let isInvited = await checkUserInvitedToHost(host_id, email);
      if (!isInvited) {
        throw new Error("User is not invited to this host.");
      }

      user_id = user.id;
      host = await getHostInformation(host_id);
      loading = false;
    } catch (err) {
      handleError(err);
    }
  })();

  async function acceptInvitation() {
    try {
      await userJoinAsHostAdmin(user_id, host.host_id);
      await removeUserInvitationFromHost(host.host_id, email);

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
  <div class="p-10">
    <div class="relative flex items-center space-x-4 mb-6">
      <img src={host.logo} alt="Host Logo" class="w-36 h-36 rounded-full" />
    </div>
    <h2 class="text-center text-xl font-semibold mb-5">You have been invited to join {host?.host_name}</h2>
    <Button color="primary" pill onclick={acceptInvitation}>Accept Invitation</Button>
  </div>
{/if}