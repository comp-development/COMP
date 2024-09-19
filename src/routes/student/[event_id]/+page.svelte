<script lang="ts">
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import {
        getEventInformation,
        getTeam,
        getThisUser,
        getUser,
    } from "$lib/supabase";
    import { Tag } from "carbon-components-svelte";

    const event_id = $page.params.event_id;
    let event;
    let team;
    let user;
    let loading = true;

    (async () => {
        let user_info = await getThisUser();
        user = await getUser(user_info.id);
        event = await getEventInformation(Number(event_id));
        team = await getTeam(user_info.id);
        console.log(team);
        loading = false;
    })();
</script>

{#if loading}
    <p>Loading...</p>
{:else}
    <br />
    <h1>{event.event_name}</h1>
    <br />
    <p style="text-align: center;">
        Welcome to this tournament! Below is the information for the team you
        are registered in. If there is an issue, update the team information on
        ContestDojo or email <a href="mailto:tournament@mustangmath.com"
            >tournament@mustangmath.com</a
        >
    </p>
    <br />
    <div class="flex">
        <Button title="Take Tests" href={"/student/" + event_id + "/tests"} />
    </div>
    <br />

    <div class="team_info">
        {#if team}
            <p style="font-weight: bold; font-size: 20px;">{team.team_name}</p>
            <p>{team.division} Division</p>

            {#each team.teamMembers as teamMember}
                {#if teamMember.students}
                    <div style="display: flex; align-items: center;">
                        <Tag type={teamMember.student_id == user.student_id ? "outline" : "warm-gray"}>{teamMember.front_id}</Tag>
                        <p> 
                            {teamMember.students.first_name}
                            {teamMember.students.last_name}
                        </p>
                    </div>
                {/if}
            {/each}
        {:else}
            <p style="font-weight: bold; font-size: 20px;">Individual</p>
            {#each Object.entries(user) as [key, value]}
                {#if key != "isAdmin" && key != "last_log_in" && key != "student_id"}
                    <li style="margin-bottom: 4px;">
                        <span style="font-weight: bold">{key}</span>: {value}
                    </li>
                {/if}
            {/each}
        {/if}
    </div>
{/if}

<style>
    h1 {
        text-align: center;
    }

    .team_info {
        padding: 10px;
        margin: 20px;
        border: 2px solid var(--primary-light);
        border-radius: 10px;
    }
</style>
