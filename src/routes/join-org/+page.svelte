<script lang="ts">
  import { page } from "$app/stores";
  import Loading from "$lib/components/Loading.svelte";
  import { getThisUser, checkUserInvitedToOrgEvent, getOrganizationDetails, isType, removeUserInvitationFromOrgEvent, getStudentEvent, updateStudentOrgEvent } from "$lib/supabase";
  import { Button } from "flowbite-svelte";
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";
  import { UsersGroupSolid } from "flowbite-svelte-icons";

  let loading = $state(true);
  let org = $state(null);
  let email = $state(null);
  let org_id = $state(null);
  let event_id = $state(null);
  let student_event_id = $state(null);

 (async () => {
    try {
      email = $page.url.searchParams.get('email');
      org_id = parseInt($page.url.searchParams.get('org_id'));
      event_id = parseInt($page.url.searchParams.get('event_id'));

      let user = await getThisUser();
      if (user.email != email) {
        throw new Error("You are not logged into the correct account.");
      }

      let isInvited = await checkUserInvitedToOrgEvent(org_id, event_id, email);
      if (!isInvited) {
        throw new Error("User is not invited to this organization.");
      }

      let userType = await isType("student", user.id);
      if (!userType) {
        throw new Error("You must have a student account to join this organization.");
      }

      let student_event = await getStudentEvent(user.id, event_id);
      if (!student_event) {
        throw new Error("You must be registered for this event to join the organization.");
      }
      student_event_id = student_event.student_event_id;

      org = await getOrganizationDetails(org_id, event_id);
      loading = false;
    } catch (err) {
      handleError(err);
    }
  })();

  async function acceptInvitation() {
    try {
      await updateStudentOrgEvent(student_event_id, org_id);
      await removeUserInvitationFromOrgEvent(org_id, event_id, email);

      toast.success("You have successfully joined the organization!");
      window.location.href = `/student/${org.event.event.host_id}/${event_id}`;
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
      <div class="w-24 h-24 flex items-center justify-center rounded-full bg-gray-600">
        <UsersGroupSolid class="w-10 h-10 text-white" />
      </div>
    </div>
    <h2 class="text-center text-xl font-semibold mb-5">You have been invited to join {org.name}</h2>
    <Button color="primary" pill onclick={acceptInvitation}>Accept Invitation</Button>
  </div>
{/if}