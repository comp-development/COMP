<script lang="ts">
    import Loading from "$lib/components/Loading.svelte";
    import { user } from "$lib/sessionStore";
    import { supabase } from "$lib/supabaseClient";
    import { page } from "$app/stores";
    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();

    let can_view_page = $state(false);
    let loading = $state(true);

    (async () => {
        if ($page.url.pathname == "/coach/signup") {
            can_view_page = true;
        } else {
            try {
                const { data, error } = await supabase
                    .from("coaches")
                    .select()
                    .eq("coach_id", $user!.id)
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
        {@render children?.()}
    </div>
{:else}
    <br />
    <h2 style="text-align: center;">No Access</h2>
{/if}

<style>
    .exterior {
        text-align: center;
        align-items: center;
    }
</style>
