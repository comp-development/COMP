<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { supabase } from "$lib/supabaseClient";
    import Latex from "$lib/components/Latex.svelte";
  
    let testId = Number($page.params.test_id);
    let teamId = $page.url.searchParams.get("team") ?? "";
    let sectionStart = Number($page.url.searchParams.get("section") ?? 1);
    $: selectedSection = { start: sectionStart, end: sectionStart + 3 };
  
    let problems: { problem_id: number; problem_latex: string; answer_latex: string }[] = [];
    let filteredProblems = [];
    let answerStates: Record<number, "correct" | "incorrect" | "blank"> = {};
    let loading = true;
  
    const groupScores: Record<number, number> = {
      1: 8,
      5: 9,
      9: 10,
      13: 11,
      17: 13,
      21: 15,
      25: 17
    };

    async function fetchProblems() {
      try {
        const { data: testProblems, error: testProblemsError } = await supabase
          .from("test_problems")
          .select("problem_id")
          .eq("test_id", testId); 
  
        if (testProblemsError) throw testProblemsError;
  
        const problemIds = testProblems.map(p => p.problem_id);
  
        const { data: problemData, error: problemError } = await supabase
          .from("problems")
          .select("problem_id, problem_latex, answer_latex")
          .in("problem_id", problemIds)
          .order("problem_id", { ascending: true });
  
        if (problemError) throw problemError;
        problems = problemData;
        filteredProblems = problems.filter(
          (p) => p.problem_id >= selectedSection.start && p.problem_id <= selectedSection.end
        );
      } catch (err) {
        console.error("Error loading problems:", err);
      }
      loading = false;
    }
  
    onMount(fetchProblems);
  
    async function submitAnswers() {
      const unanswered = filteredProblems.filter(
        (p) => !answerStates[p.problem_id]
      );

      if (unanswered.length > 0) {
        alert("Please select an answer for all problems before submitting.");
        return;
      }

      const entries = [];
  
      for (const problem_id in answerStates) {
        const status = answerStates[problem_id];
        const pid = Number(problem_id);
  
        const sectionStart = [1, 5, 9, 13, 17, 21, 25].find(start => pid >= start && pid <= start + 3);
        const groupScore = groupScores[sectionStart ?? 1];
  
        let score = 0;
        if (status === "correct") score = groupScore;
        else score = 0;
  
        entries.push({
          team_id: teamId,
          test_problem_id: pid,
          status,
          score,
          test_id: testId
        });
      }
  
      const { error } = await supabase.from("guts_grades").insert(entries);
      if (error) {
        console.error("Error saving grades:", error.message);
        return;
      }
  
      alert("Grades submitted successfully!");
      goto(`/admin/${$page.params.host_id}/${$page.params.event_id}/guts/${testId}`);
    }
  </script>
  
  <div class="container">
    <h1>Submitting for Team {teamId}</h1>
    <h2>Section: Problems {selectedSection.start}–{selectedSection.end}</h2>
    <p class="verification-note">Please verify the information above!</p>
  
    {#if loading}
      <p>Loading problems...</p>
    {:else}
      {#each filteredProblems as problem}
        <div class="problem-card">
          <div class="problem-id">Problem ID: {problem.problem_id}</div>
          <Latex value={problem.problem_latex} style="font-size: 1.2em;" />
  
          {#if problem.answer_latex}
            <div class="problem-answer">
              <p class="answer-label">Answer:</p>
              <Latex value={problem.answer_latex} style="font-size: 1.1em; color: blue;" />
            </div>
          {/if}
  
          <div class="answer-choice-group">
            <label><input type="radio" name="problem-{problem.problem_id}" value="correct" bind:group={answerStates[problem.problem_id]} /> Correct</label>
            <label><input type="radio" name="problem-{problem.problem_id}" value="incorrect" bind:group={answerStates[problem.problem_id]} /> Incorrect</label>
            <label><input type="radio" name="problem-{problem.problem_id}" value="blank" bind:group={answerStates[problem.problem_id]} /> Blank</label>
          </div>
        </div>
      {/each}
  
      <div class="submit-answers">
        <button on:click={submitAnswers}>Submit Answers</button>
      </div>

    {/if}
  </div>
  
  <style>
    .container {
      max-width: 700px;
      margin: 0 auto;
      font-family: Optima, sans-serif;
    }
    h1 {
      margin-bottom: 1rem;
      color: #333;
    }
    h2 {
      margin-bottom: 0.75rem;
      color: #555;
    }
    .verification-note {
      margin-bottom: 1rem;
      font-style: italic;
      color: #555;
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
    .answer-choice-group {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
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
