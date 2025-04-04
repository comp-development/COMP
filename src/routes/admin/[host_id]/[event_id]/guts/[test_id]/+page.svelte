<script lang="ts">
    import { supabase } from "$lib/supabaseClient";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import Latex from "$lib/components/Latex.svelte";

    let loading = true;

    let testId = Number($page.params.test_id);

    let problems: { problem_id: number; problem_latex: string; answer_latex: string }[] = [];
    let filteredProblems = [];

    let grading = false;

    $: if (!grading && problems.length) {
	    filteredProblems = problems;
    }

    let sectionStart = 1;
    let selectedSection = { start: sectionStart, end: sectionStart + 3 };
    $: selectedSection = { start: sectionStart, end: sectionStart + 3 };

    let teamOptions: { id: string; name: string }[] = [];
    let teamId = "";

    // For selecting teams using a dropdown menu
    onMount(async () => {
      const { data, error } = await supabase.from("teams").select("team_id");

      if (error) {
        console.error("Error fetching teams:", error.message);
        return;
      }

      teamOptions = data.map(team => team.team_id);
    });

    let answerStates: Record<number, "correct" | "incorrect" | "blank"> = {};

    const sections = [
      { label: "1–4", value: 1 },
      { label: "5–8", value: 5 },
      { label: "9–12", value: 9 },
      { label: "13–16", value: 13 },
      { label: "17–20", value: 17 },
      { label: "21–24", value: 21 },
      { label: "25–28", value: 25 }
    ];

    const groupScores: Record<number, number> = {
      1: 8,   // problems 1–4
      5: 9,   // 5–8
      9: 10,   // 9–12
      13: 11,  // 13–16
      17: 13, // 17–20
      21: 15, // 21–24
      25: 17  // 25–28
    };

    function submitGradingSection() {
      grading = true;

      filteredProblems = problems.filter(
        (p) =>
          p.problem_id >= selectedSection.start &&
          p.problem_id <= selectedSection.end
      );
    }

    async function submitAnswers() {
      // All problems must have an answer selected
      const unanswered = filteredProblems.filter(
        (problem) => !answerStates[problem.problem_id]
      );

      if (unanswered.length > 0) {
        alert("Please select an answer (correct/incorrect/blank) for all problems before submitting.");
        return;
      }

      grading = false;
      filteredProblems = problems; // Display all the problems again

      const entries = [];

      console.log(answerStates);
      for (const problem_id in answerStates) {
        const status = answerStates[problem_id];
        const pid = Number(problem_id);

        // Determine the problem group
        const sectionStart = [1, 5, 9, 13, 17, 21, 25].find(start => pid >= start && pid <= start + 3);
        const groupScore = groupScores[sectionStart ?? 1];

        // Assign the score
        let score = 0;
        if (status === "correct") score = groupScore;
        else if (status === "incorrect") score = -1;
        else if (status === "blank") score = 0;

        entries.push({
          team_id: teamId,
          test_problem_id: pid,
          status: status,
          score: score,
          // grader_id!!! (changed to nullable)
        });
      }

      const { error } = await supabase.from("guts_grades").insert(entries);
      if (error) {
        console.error("Error saving grades:", error.message);
        return;
      }

      alert("Grades submitted successfully!");

      answerStates = {}; // Clear sections
      teamId = "";  
      sectionStart = 1;  
}

    async function fetchProblems() {
        try {
            console.log(testId);
            // Fetch problem_id(s) from test_problems table
            const { data: testProblems, error: testProblemsError } = await supabase
                .from("test_problems")
                .select("problem_id")
                // .eq("test_id", testId); !!! UNCOMMENT LATER
            
            console.log(testProblems);

            if (testProblemsError) throw testProblemsError;
            if (!testProblems || testProblems.length === 0) {
                console.log("No problems found for this test.");
                loading = false;
                return;
            }

            // Extract problem_ids
            const problemIds = testProblems.map((row: { problem_id: number }) => row.problem_id);

            // Fetch problem_latex from problems table
            const { data: problemData, error: problemError } = await supabase
                .from("problems")
                .select("problem_id, problem_latex, answer_latex")
                .in("problem_id", problemIds)
                .order("problem_id", { ascending: true });

            if (problemError) throw problemError;
            problems = problemData || [];
        } catch (err) {
            console.error("Error fetching problems:", err);
        }
        loading = false;
    }

    onMount(fetchProblems);
</script>


<div class="container">
  <h1>Problems for Test {testId}</h1>

  <div class="grading-top">
    <form class="grading-form" on:submit|preventDefault={submitGradingSection}>
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

      <button type="submit">Input Scores</button>
    </form>
  </div>

  {#if loading}
    <p>Loading problems...</p>
  {:else if filteredProblems.length === 0}
    <p>No problems found for this test.</p>
  {:else}
    {#if grading}
      <h2>Grading Team {teamId}: Problems {selectedSection.start}–{selectedSection.end}</h2>
    {/if}

    {#each filteredProblems as problem}
    <div class="problem-card">
      <div class="problem-id">Problem ID: {problem.problem_id}</div>
      <Latex value={problem.problem_latex} style="font-size: 1.2em;" />
    
      {#if problem.answer_latex}
        <div class="problem-answer">
          <p class="answer-label">Correct Answer:</p>
          <Latex value={problem.answer_latex} style="font-size: 1.1em; color: blue;" />
        </div>
      {/if}
    
      {#if grading}
        <div class="answer-choice-group">
          <label>
            <input
              type="radio"
              name="problem-{problem.problem_id}"
              value="correct"
              bind:group={answerStates[problem.problem_id]}
            />
            Correct
          </label>
    
          <label>
            <input
              type="radio"
              name="problem-{problem.problem_id}"
              value="incorrect"
              bind:group={answerStates[problem.problem_id]}
            />
            Incorrect
          </label>
    
          <label>
            <input
              type="radio"
              name="problem-{problem.problem_id}"
              value="blank"
              bind:group={answerStates[problem.problem_id]}
            />
            Blank
          </label>
        </div>
      {/if}
    </div>
    
    {/each}
    {#if grading}
  <div class="submit-answers">
    <button on:click={submitAnswers}>Submit Answers</button>
  </div>
{/if}
  {/if}
</div>



  <style>
    .container {
      max-width: 700px;
      margin: 0 auto;
      font-family: Optima, sans-serif;
    }
    .problem-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      margin: 10px 0;
      box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
      background-color: #fff;
    }
    .problem-id {
      font-size: 1.5em;
      font-weight: bold;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .problem-answer {
	    margin-top: 12px;
	    padding: 8px 12px;
	    background: #f5fff5;
	    border-left: 4px solid #28a745;
	    border-radius: 4px;
    }

    .grading-top {
	    margin-bottom: 1.5rem;
    }

    .grading-top button {
	    background-color: #007bff;
	    color: white;
	    border: none;
	    padding: 0.5rem 1rem;
	    cursor: pointer;
	    font-size: 1rem;
	    width: fit-content; 
      align-self: center;
    }

    .grading-form {
	    margin-top: 1rem;
	    display: flex;
	    flex-direction: column;
	    gap: 1rem;
    }

    .correct-checkbox {
	    margin-top: 1rem;
	    font-weight: 500;
	    display: flex;
	    align-items: center;
	    gap: 0.5rem;
    }

    .answer-choice-group {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .answer-choice-group label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 500; 
    }

    .submit-answers {
      margin-top: 2rem;
      text-align: center;
    }

    .submit-answers button {
      background-color: green;
      color: white;
      font-size: 1rem;
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

  </style>