<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Latex from "$lib/components/Latex.svelte";

  let testId = Number($page.params.test_id);
  let loading = true;
  let problems: { problem_id: number; problem_latex: string }[] = [];

  let teamOptions: string[] = [];
  let teamId = "";
  let sectionStart = 1;

  const sections = [
    { label: "1–4", value: 1 },
    { label: "5–8", value: 5 },
    { label: "9–12", value: 9 },
    { label: "13–16", value: 13 },
    { label: "17–20", value: 17 },
    { label: "21–24", value: 21 },
    { label: "25–28", value: 25 }
  ];

  onMount(async () => {
    // Fetch all problems
    const { data: testProblems, error: testProblemsError } = await supabase
      .from("test_problems")
      .select("problem_id")
      // .eq("test_id", testId); !!! UNCOMMENT LATER

    if (testProblemsError) {
      console.error("Error loading problems:", testProblemsError.message);
      return;
    }

    const problemIds = testProblems.map(p => p.problem_id);
    const { data: problemData, error: problemError } = await supabase
      .from("problems")
      .select("problem_id, problem_latex")
      .in("problem_id", problemIds)
      .order("problem_id", { ascending: true });

    if (problemError) {
      console.error("Error loading problem details:", problemError.message);
    } else {
      problems = problemData;
    }

    // Fetch team IDs
    const { data: teams, error: teamError } = await supabase.from("teams").select("team_id");
    if (teamError) {
      console.error("Error loading teams:", teamError.message);
    } else {
      teamOptions = teams.map(t => t.team_id);
    }

    loading = false;
  });

  function goToGrading() {
    goto(
      `/admin/${$page.params.host_id}/${$page.params.event_id}/guts/${testId}/submit?team=${teamId}&section=${sectionStart}`
    );
  }
</script>

<div class="container">
  <h1>Problems for Test {testId}</h1>

  <form class="grading-form" on:submit|preventDefault={goToGrading}>
    <label>
      Team ID:
      <select bind:value={teamId} required>
        <option value="" disabled selected>Select a team</option>
        {#each teamOptions as id}
          <option value={id}>{id}</option>
        {/each}
      </select>
    </label>

    <label>
      Problem Section:
      <select bind:value={sectionStart}>
        {#each sections as section}
          <option value={section.value}>{section.label}</option>
        {/each}
      </select>
    </label>

    <button type="submit">Input Answers</button>
  </form>

  {#if loading}
    <p>Loading problems...</p>
  {:else if problems.length === 0}
    <p>No problems found for this test.</p>
  {:else}
    {#each problems as problem}
      <div class="problem-card">
        <div class="problem-id">Problem ID: {problem.problem_id}</div>
        <Latex value={problem.problem_latex} style="font-size: 1.2em;" />
      </div>
    {/each}
  {/if}
</div>

<style>
  .container {
    max-width: 700px;
    margin: 0 auto;
    font-family: Optima, sans-serif;
  }

  .grading-form {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .grading-form select {
    font-size: 1rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  .grading-form button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1.2rem;
    font-size: 1rem;
    border-radius: 4px;
    cursor: pointer;
    width: fit-content;
    align-self: center;
    margin-bottom: 1rem;
  }

  .problem-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 10px 0;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.05);
    background-color: #fff;
  }

  .problem-id {
     font-size: 1.5em;
     font-weight: bold;
     color: #333;
     margin-bottom: 0.5rem;
  }
</style>
