<script lang="ts">
    import Loading from "$lib/components/Loading.svelte";
    import { user } from "$lib/sessionStore";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { isType } from "$lib/supabase";

    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();

    let can_view_page = $state(false);
    let loading = $state(true);

    (async () => {
        try {
            const isCoach = await isType("coach", $user?.id);

            if (isCoach) {
                can_view_page = true;
            } else {
                const isStudent = await isType("student", $user?.id);

                if (isStudent) {
                    const newUrl = $page.url.pathname.replace(
                        "/coach",
                        "/student",
                    );
                    goto(newUrl);
                }

                const newUrl = $page.url.pathname.replace("/coach", "/admin");
                goto(newUrl);
            }
        } catch (error) {
            console.error("Error checking user role:", error);
        } finally {
            loading = false;
        }
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