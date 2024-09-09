<script lang="ts">
    import { supabase } from "$lib/supabaseClient";
    import { supabaseCompose } from "$lib/composeSupabaseClient";
    import { onMount } from 'svelte';
    import { handleError } from '$lib/handleError';

    let loading = true;
    let loggedIn = false;
    let synced = false;
    let email = "";
    let password = "";

    onMount(async () => {
        const { data, error } = await supabaseCompose.auth.getUser()
        if (!error) {
            loggedIn = true;
        }
        loading = false;
    })

    async function syncProblems() {
        try {
            loading = true;
            let { data: problems_data } = await supabaseCompose
                .from('problems')
                .select('id,problem_latex,answer_latex,solution_latex');

            console.log(problems_data);
            
            let problems_sanitized = problems_data?.map(obj => {return {problem_id: obj.id, problem_latex: obj.problem_latex, answer_late: obj.answer_latex, solution_latex: obj.solution_latex}});

            console.log(problems_sanitized);
            await supabase.from('problems').upsert(problems_sanitized)

            loading = false;
            synced = true;
        } catch (error: any) {
            handleError(error);
        }
    }

    async function logInCompose() {
        try {
            await supabaseCompose.auth.signInWithPassword({email, password});
            loggedIn = true;
        } catch (error: any) {
            handleError(error);
        }
    }
</script>

{#if loading}
    <p>Loading...</p>
{:else if loggedIn}
    <button on:click={syncProblems}>Sync Problems</button>
    {#if synced}
        Problems synced!
    {/if}
{:else}

<p>Please put in your COMPOSE email and password.</p> <br />
<input placeholder="Email" bind:value={email} />
<input placeholder="Password" type="password" bind:value={password} />

<button on:click={logInCompose}>Log In</button>{/if}