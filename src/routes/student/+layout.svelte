<script lang="ts">
  import Loading from "$lib/components/Loading.svelte";
  import { user } from "$lib/sessionStore";
  import { supabase } from "$lib/supabaseClient";
  import { page } from "$app/stores";

  let can_view_page = false;
  let loading = true;

  (async () => {
    if ($page.url.pathname == "/student/signup") {
      can_view_page = true;
    } else {
      try {
        const { data, error } = await supabase
          .from("students")
          .select()
          .eq("student_id", $user!.id)
          .maybeSingle();
        can_view_page = error == null && data != null;
      } catch {
        can_view_page = false;
      }
    }
    loading = false;
  })();
</script>

{#if loading}
  <Loading />
{:else if can_view_page}
  <div class="exterior">
    <slot />
  </div>
{:else}
  <h2 style="text-align: center;">No Access</h2>
  <br />
  <p style="text-align: center;">
    Register as a Student: <a href="/student/signup"
      >{document.location.host + "/student/signup"}</a
    >
  </p>
{/if}

<style>
  .exterior {
    text-align: center;
    align-items: center;
  }
</style>
