<script lang="ts">
  import Loading from "$lib/components/Loading.svelte";
  import { isType } from "$lib/supabase";
  import { user } from "$lib/sessionStore";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { handleError } from "$lib/handleError";


  async function onLoad() {
    try {
      const isAdmin = await isType("admin", $user?.id);
      if (isAdmin) {
        window.location.href = "./admin";
        return;
      }
      const isStudent = await isType("student", $user?.id);

      if (isStudent) {
        window.location.href = "./student";
        return;
      } 
      const isCoach = await isType("coach", $user?.id);

      if (isCoach) {
        window.location.href = "./coach";
        return;
      }

      window.location.href = "./student";
    } catch (error) {
      handleError(error);
    }
  }

  onLoad();
</script>

<br />
<Loading />
