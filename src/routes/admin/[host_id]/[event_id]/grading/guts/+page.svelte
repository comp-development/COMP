<script lang="ts">
    // Filter tests table on supabase by "Guts" and [event_id], then display
    // all the guts tests in this event
    import { supabase } from "$lib/supabaseClient";
    import { page } from "$app/stores";
    import { onMount } from "svelte";

    let eventId = Number($page.params.event_id);
    let tests: { test_id: number; test_name: string }[] = []; // Store fetched data
    let currentPath = $page.url.pathname;
    let loading = true;

    async function fetchData() {
        const { data, error } = await supabase
            .from("tests")
            .select("*")
            .eq("test_mode", "Guts")
            .eq("event_id", eventId);

        if (error) {
            console.error("Error fetching tests:", error);
        } else {
            tests = data || [];
        }
        loading = false;
    }

    // Fetch data when the component mounts
    onMount(fetchData);
</script>

<style>
    .container {
        max-width: 600px;
        margin: 0 auto;
        font-family: Arial, sans-serif;
    }
    .test-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        margin: 10px 0;
        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
        background-color: #fff;
    }
    .test-name {
        font-size: 1.2em;
        font-weight: bold;
    }
    .test-id {
        color: #666;
    }
    .test-button {
        display: inline-block;
        padding: 8px 12px;
        margin-top: 10px;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        font-size: 0.9em;
    }
    .test-button:hover {
        background-color: #0056b3;
    }
</style>

<div class="container">
    <h1>Guts Tests for Event {eventId}</h1>

    {#if loading}
        <p>Loading tests...</p>
    {:else}
        {#if tests.length === 0}
            <p>No Guts tests found for this event.</p>
        {:else}
            {#each tests as test}
                <div class="test-card">
                    <div class="test-name">{test.test_name}</div>
                    <div class="test-id">Test ID: {test.test_id}</div>
                    <a class="test-button" href={`${currentPath}/${test.test_id}`}>
                        View Test
                    </a>
                </div>
            {/each}
        {/if}
    {/if}
</div>