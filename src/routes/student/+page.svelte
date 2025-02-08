<script lang="ts">
	import { user } from "$lib/sessionStore";
	import { getAllPublicHosts, getStudent } from "$lib/supabase";
	import Loading from "$lib/components/Loading.svelte";
    import { handleError } from "$lib/handleError";
    import { Button } from "flowbite-svelte";
    import InfoToolTip from "$lib/components/InfoToolTip.svelte";

	let student: any = $state();
	let hosts = $state([]);
	let loading = $state(true);

	(async () => {
		try {
			student = await getStudent($user!.id);
			hosts = await getAllPublicHosts();
			loading = false;
		} catch (error) {
			handleError(error);
		}
	})();
</script>

{#if loading}
	<Loading />
{:else}
	<br />
	<h1>Welcome, {student.first_name} {student.last_name}</h1>
	<h2 style="font-weight: 500">{$user?.email}</h2>
	<br /><br />
	<h3 class="text-xl font-medium text-gray-900 dark:text-white flex">
        <InfoToolTip
            text="Hosts are the people who organize the events. The hosts below have events you are registered or can register for"
        />Hosts
    </h3>
    <br />
    <div class="buttonContainer">
        {#each hosts as host}
            <div>
                <div class="problemContainer">
                    <div style="align-items: left">
                        <h4>{host.host_name}</h4>
                        <p style="overflow-wrap: anywhere;"><a href={`mailto:${host.email}`}>{host.email}</a></p>
                    </div>
                    <br />
                    <div>
                        <Button
                            size="sm"
                            href={`/student/${host.host_id}`}
                            pill>Go to Host</Button
                        >
                    </div>
                </div>
            </div>
        {/each}
    </div>
    {#if hosts.length == 0}
        <p class="text-center">No hosts with public events found</p>
    {/if}
{/if}