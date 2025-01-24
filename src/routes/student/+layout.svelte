<script lang="ts">
  import Loading from "$lib/components/Loading.svelte";
  import { user } from "$lib/sessionStore";
  import { supabase } from "$lib/supabaseClient";
  import { page } from "$app/stores";
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  let can_view_page = $state(false);
  let loading = $state(true);

  (async () => {
    if ($page.url.pathname == "/student/signup") {
      can_view_page = true;
    } else {
      try {
        const { testData, testError } = await supabase
          .from("students")
          .select();

        console.log("Test Data", testData, testError);

        const { data, error } = await supabase
          .from("students")
          .select()
          .eq("student_id", $user!.id)
          .maybeSingle();
        console.log("DATA", data);
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
    {@render children?.()}
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
