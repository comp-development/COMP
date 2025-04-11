<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Latex from "$lib/components/Latex.svelte";

  let subscription: ReturnType<typeof supabase.channel> | null = null;
  let realtimeChannel;

  let isGutsTest = true; // for Set 8 (input answers)

  let testId = Number($page.params.test_id);
  let loading = true;
  let problems: {
    problem_id: number;
    problem_latex: string;
    answer_latex?: string;
    status: string | null;
  }[] = [];

  let teamId = "";

  let searchTerm = "";
  let showSuggestions = false;
  let filteredTeams: { front_id: string; team_name: string }[] = [];
  let selectedTeam: { team_id: string; team_name: string } | null = null;

  let teamOptions: { front_id: string; team_name: string }[] = [];

  let manualAnswers: Record<number, string> = {};

  // Reactively watch for teamId being set
  $: if (teamId) {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel); // cleanup if switching teams
    }

    realtimeChannel = supabase
      .channel(`manual_grades_team_${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "manual_grades",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          loadGradesForTeam(teamId);
          // toast.success("Grades updated by another grader.");
        },
      )
      .subscribe();
  }
  onMount(() => {
    const cleanup = () => {
      document.removeEventListener("click", handleClickOutside);
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };

    document.addEventListener("click", handleClickOutside);

    (async () => {
      // Fetch problems
      const { data: testProblems, error: testProblemsError } = await supabase
        .from("test_problems")
        .select("problem_id")
        .eq("test_id", testId);
      if (testProblemsError) {
        console.error("Error loading problems:", testProblemsError.message);
        return;
      }

      const problemIds = testProblems.map((p) => p.problem_id);

      const { data: problemData, error: problemError } = await supabase
        .from("test_problems")
        .select("problems(problem_id, problem_latex, answer_latex)")
        .in("problem_id", problemIds)
        .order("problem_id", { ascending: true });

      if (problemError) {
        console.error("Error loading problem details:", problemError.message);
      } else {
        problems = problemData.map((p) => ({
          ...p.problems,
          status: "", // neutral default
        }));
      }

      // Fetch teams
      const { data: teams, error: teamError } = await supabase
        .from("teams")
        .select("front_id, team_id, team_name");

      if (teamError) {
        console.error("Error loading teams:", teamError.message);
      } else {
        teamOptions = teams;
      }

      loading = false;
    })();

    return cleanup;
  });

  let groupedProblems: (typeof problems)[][] = [];

  $: if (problems.length) {
    groupedProblems = [];
    for (let i = 0; i < problems.length; i += 4) {
      groupedProblems.push(problems.slice(i, i + 4));
    }
  }

  function filterTeams() {
    showSuggestions = true;
    const searchLower = searchTerm.toLowerCase();
    filteredTeams = teamOptions.filter(
      (team) =>
        team.front_id.toLowerCase().includes(searchLower) ||
        team.team_name.toLowerCase().includes(searchLower),
    );
  }

  async function selectTeam(team: {
    team_id: string;
    front_id: string;
    team_name: string;
  }) {
    selectedTeam = team;
    teamId = team.team_id;
    searchTerm = `${team.front_id} - ${team.team_name}`;
    showSuggestions = false;

    await loadGradesForTeam(team.team_id);
  }

  // Close suggestions when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".autocomplete-wrapper")) {
      showSuggestions = false;
    }
  }

  let expandedProblemId: number | null = null;

  function toggleProblem(problemId: number) {
    expandedProblemId = expandedProblemId === problemId ? null : problemId;
  }

  function cycleGradingState(problemId: number) {
    problems = problems.map((p) => {
      if (p.problem_id === problemId) {
        let newStatus: "correct" | "incorrect" | null;

        if (p.status === null || p.status === undefined) newStatus = "correct";
        else if (p.status === "correct") newStatus = "incorrect";
        else newStatus = null;

        return { ...p, status: newStatus };
      }
      return p;
    });
  }

  async function saveSetGrades(group: typeof problems) {
    if (!selectedTeam) {
      alert("Please select a team before saving grades.");
      return;
    }

    const teamId = selectedTeam.team_id;

    const isSet8 = group.some((p) =>
      manualAnswers.hasOwnProperty(p.problem_id),
    );

    if (isGutsTest && isSet8) {
      // Handle Set 8 manual answers
      for (const problem of group) {
        const ans = manualAnswers[problem.problem_id]?.trim().toUpperCase();

        if (!ans || ans.length !== 5 || /[^YNB]/.test(ans)) {
          alert(
            `Invalid answers for Set 8: Answers must be exactly 5 characters and only use Y, N, or B.`,
          );
          return;
        }

        // Normalize for saving
        manualAnswers[problem.problem_id] = ans;
      }

      const payload = group.map((problem) => ({
        test_problem_id: problem.problem_id,
        team_id: teamId,
        test_id: testId,
        answer_latex: manualAnswers[problem.problem_id],
      }));

      const { error } = await supabase.from("manual_grades").upsert(payload, {
        onConflict: ["test_problem_id", "team_id"],
      });

      if (error) {
        console.error("Error saving manual answers:", error.message);
        alert("Failed to save answers.");
      } else {
        alert("Answers saved successfully!");
      }
    } else {
      // Handle normal sets
      const incomplete = group.filter(
        (p) => p.status === null || p.status === undefined,
      );

      if (incomplete.length > 0) {
        alert(
          "Please mark all problems in this set as correct or incorrect before saving.",
        );
        return;
      }

      const payload = group.map((problem) => ({
        test_problem_id: problem.problem_id,
        team_id: teamId,
        status: problem.status,
        test_id: testId,
      }));

      const { error } = await supabase.from("manual_grades").upsert(payload, {
        onConflict: ["test_problem_id", "team_id"],
      });

      if (error) {
        console.error("Error saving grades:", error.message);
        alert("Failed to save grades.");
      } else {
        alert("Grades saved successfully!");
      }
    }
  }

  async function loadGradesForTeam(teamId: string) {
    console.log("Querying with:", { teamId, testId });
    const { data, error } = await supabase
      .from("manual_grades")
      .select("test_problem_id, status")
      .eq("team_id", teamId)
      .eq("test_id", testId);

    if (error) {
      console.error("Error loading grades:", error.message);
      return;
    }

    problems = problems.map((p) => {
      const match = data.find((d) => d.test_problem_id === p.problem_id);
      return {
        ...p,
        status: match ? match.status : null,
      };
    });

    problems = [...problems];
  }
</script>

<div class="container">
  <h1>Problems for Test {testId}</h1>

  <!-- Grading Form -->
  <form class="grading-form">
    <label>
      Enter Team:
      <div class="autocomplete-wrapper">
        <input
          type="text"
          bind:value={searchTerm}
          on:input={filterTeams}
          placeholder="Search by team ID or name"
          required
        />
        {#if showSuggestions && filteredTeams.length > 0}
          <ul class="suggestions-list">
            {#each filteredTeams as team}
              <li on:click={() => selectTeam(team)} class="suggestion-item">
                {team.front_id} - {team.team_name}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </label>
  </form>

  <!-- Problems Display -->
  {#if loading}
    <p>Loading problems...</p>
  {:else if problems.length === 0}
    <p>No problems found for this test.</p>
  {:else}
    <div class="problems-grid">
      {#each groupedProblems as group, i}
        <div class="problem-set">
          <h2 class="set-label">Set {i + 1}</h2>

          <div class="problem-grid">
            {#each group as problem}
              <div
                class="problem-card"
                on:click={() => toggleProblem(problem.problem_id)}
              >
                <div class="problem-id">Problem ID: {problem.problem_id}</div>

                {#if i !== 7}
                  <div
                    class="triple-toggle"
                    on:click|stopPropagation={() =>
                      cycleGradingState(problem.problem_id)}
                    data-state={problem.status ?? "neutral"}
                  >
                    <div class="toggle-slider"></div>
                  </div>
                {/if}

                {#if expandedProblemId === problem.problem_id}
                  <Latex
                    value={problem.problem_latex}
                    style="font-size: 1.2em;"
                  />
                {/if}

                {#if isGutsTest && i === 7}
                  <div class="answer-input-wrapper">
                    <input
                      type="text"
                      bind:value={manualAnswers[problem.problem_id]}
                      placeholder="Enter answer (ex: YNNBB)"
                      on:click|stopPropagation
                    />
                  </div>
                {:else if problem.answer_latex}
                  <div class="answer-hover-zone">
                    <p class="answer-label">Answer:</p>
                    <div class="hidden-answer">
                      <Latex
                        value={problem.answer_latex}
                        style="font-size: 1.1em; color: blue;"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>

          <button class="save-button" on:click={() => saveSetGrades(group)}>
            Save Grades
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1400px;
    margin: 0 auto;
    font-family: Optima, sans-serif;
  }

  .grading-form {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
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

  .autocomplete-wrapper {
    position: relative;
    width: 50%;
    margin: 0.5rem auto;
  }

  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: Optima, sans-serif;
  }

  .suggestions-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ccc;
    border-top: none;
    border-radius: 0 0 4px 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .suggestion-item {
    padding: 8px;
    cursor: pointer;
  }

  .suggestion-item:hover {
    background-color: #f0f0f0;
  }

  .answer-hover-zone {
    position: relative;
    padding: 0.5rem;
    border-radius: 6px;
    margin-top: 0.5rem;
    background-color: rgba(100, 100, 255, 0.1);
  }

  .hidden-answer {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  .answer-hover-zone:hover .hidden-answer {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
  }

  .problems-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
    margin-top: 1rem;
  }

  .triple-toggle {
    width: 60px;
    height: 30px;
    background-color: lightgray;
    border-radius: 999px;
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s ease;
    overflow: hidden;
    margin: 0 auto;
    margin-bottom: 0.5rem;
  }

  .toggle-slider {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: white;
    position: absolute;
    top: 2px;
    left: calc(50% - 13px); /* center by default */
    transition: left 0.25s ease;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
  }

  /* GREEN - correct */
  .triple-toggle[data-state="correct"] {
    background-color: #4ade80;
  }
  .triple-toggle[data-state="correct"] .toggle-slider {
    left: calc(100% - 28px);
  }

  /* RED - incorrect */
  .triple-toggle[data-state="incorrect"] {
    background-color: #f87171;
  }
  .triple-toggle[data-state="incorrect"] .toggle-slider {
    left: 2px;
  }

  .problem-set {
    width: 100%;
    border: 2px solid #ddd;
    border-radius: 12px;
    padding: 1.5rem;
    margin: 2rem 0;
    background-color: #fafafa;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }

  .set-label {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    text-align: center;
  }

  .problem-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }

  .save-button {
    margin-top: 1.5rem;
    display: block;
    margin-left: auto;
    margin-right: auto;
    background-color: #4f46e5;
    color: white;
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .save-button:hover {
    background-color: #4338ca;
  }

  .answer-input-wrapper {
    margin-top: 0.5rem;
  }

  .answer-manual {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
  }
</style>
