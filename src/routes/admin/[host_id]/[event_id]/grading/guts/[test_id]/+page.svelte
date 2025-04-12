<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Latex from "$lib/components/Latex.svelte";

  let subscription: ReturnType<typeof supabase.channel> | null = null;
  let realtimeChannel;

  let testId = Number($page.params.test_id);
  let eventId = Number($page.params.event_id);
  let testName;

  let loading = true;
  let problems: {
    problem_id: number;
    test_problem_id: number,
    problem_number: number;
    problem_latex: string;
    answer_latex?: string;
    status: string | null;
  }[] = [];

  let teamId = "";

  let searchTerm = "";
  let showSuggestions = false;
  let filteredTeams: { front_id: string; team_name: string }[] = [];
  let selectedTeam: {
    team_id: string;
    front_id: string;
    team_name: string;
  } | null = null;

  let teamOptions: { front_id: string; team_id: string; team_name: string }[] =
    [];

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
          //also filter on current test_id
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
      if (testId) {
        const { data, error } = await supabase
          .from("tests")
          .select("test_name")
          .eq("test_id", testId)
          .single();

        if (error) {
          console.error("Error fetching test name:", error.message);
        } else {
          testName = data.test_name;
        }
      }

      // Fetch problems
      // const { data: testProblems, error: testProblemsError } = await supabase
      //   .from("test_problems")
      //   .select("problem_id")
      //   .eq("test_id", testId);
      // if (testProblemsError) {
      //   console.error("Error loading problems:", testProblemsError.message);
      //   return;
      // }

      // const problemIds = testProblems.map((p) => p.problem_id);

      const { data: problemData, error: problemError } = await supabase
        .from("test_problems")
        .select(
          "problem_number, test_problem_id, problems(problem_id, problem_latex, answer_latex)",
        )
        .eq("test_id", testId)
        .order("problem_number", { ascending: true });

      console.log("problems data", problemData);

      if (problemError) {
        console.error("Error loading problem details:", problemError.message);
      } else {
        problems = problemData.map((p) => ({
          ...p.problems,
          problem_number: p.problem_number,
          test_problem_id: p.test_problem_id,
          status: "", // neutral default
        }));
      }

      console.log("problems", problems);

      // Fetch teams
      const { data: teams, error: teamError } = await supabase
        .from("teams")
        .select("front_id, team_id, team_name")
        .eq("event_id", eventId);

      console.log("teams", teams);

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

    filteredTeams = teamOptions.filter((team) => {
      const matchesFrontId =
        team.front_id && team.front_id.toLowerCase().includes(searchLower);

      const matchesName = team.team_name.toLowerCase().includes(searchLower);

      return matchesFrontId || matchesName;
    });
  }

  async function selectTeam(team: {
    team_id: string;
    front_id: string;
    team_name: string;
  }) {
    selectedTeam = team;
    teamId = team.team_id;
    if (team.front_id) {
      searchTerm = `${team.front_id} - ${team.team_name}`;
    } else {
      searchTerm = `${team.team_name}`;
    }

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

    // Get the highest problem_id across all problems to identify the last set
    const maxProblemId = Math.max(...problems.map((p) => p.problem_number));
    console.log(maxProblemId);
    const isLastSet = group.some((p) => p.problem_number === maxProblemId);
    let payload;
    if (isLastSet) {
      // Handle last set (manual answers)
      for (const problem of group) {
        const ans = manualAnswers[problem.problem_id]?.trim().toUpperCase();

        if (!ans || ans.length !== 5 || /[^YNB]/.test(ans)) {
          alert(
            `Invalid answers for the last set: Answers must be exactly 5 characters and only use Y, N, or B.`,
          );
          return;
        }

        // Normalize for saving
        manualAnswers[problem.problem_id] = ans;
      }

      payload = group.map((problem) => ({
        test_problem_id: problem.problem_id,
        team_id: teamId,
        test_id: testId,
        answer_latex: manualAnswers[problem.problem_id],
      }));
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

      payload = group.map((problem) => ({
        test_problem_id: problem.test_problem_id,
        team_id: teamId,
        status: problem.status,
        test_id: testId,
      }));
    }
    console.log("PAYLOAD", payload);
    const { error } = await supabase.from("manual_grades").upsert(payload, {
      onConflict: ["test_problem_id", "team_id"],
    });

    if (error) {
      console.error("Error saving manual answers:", error.message);
      alert("Failed to save answers.");
    } else {
      alert("Answers saved successfully!");
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
      const match = data.find((d) => d.test_problem_id === p.test_problem_id);
      return {
        ...p,
        status: match ? match.status : null,
      };
    });

    problems = [...problems];
  }
</script>

<div class="container">
  <h1>{testName}</h1>

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
                {#if team.front_id}
                  [{team.front_id}] {team.team_name}
                {:else}
                  {team.team_name}
                {/if}
              </li>
            {/each}
          </ul>
        {/if}

        
      </div></label
    >
  </form>

    {#if selectedTeam}
          <!-- Fixed header that stays at top -->
          <div class="grading-header">
            Grading: {selectedTeam.front_id}
            {selectedTeam.team_name}
          </div>

          <div class="grading-subheader">
            CURRENTLY GRADING: {selectedTeam.front_id}
            {selectedTeam.team_name}
          </div>
    {/if}

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
                <!-- Horizontally align ID and toggle/input -->
                <div class="problem-header-row">
                  <div class="problem-id">{problem.problem_number}</div>

                  {#if i === groupedProblems.length - 1}
                    <div class="answer-input-wrapper">
                      <input
                        type="text"
                        bind:value={manualAnswers[problem.problem_id]}
                        placeholder="Answer (ex: YNNBB)"
                        on:click|stopPropagation
                      />
                    </div>
                  {:else}
                    <div
                      class="triple-toggle"
                      on:click|stopPropagation={() =>
                        cycleGradingState(problem.problem_id)}
                      data-state={problem.status ?? "neutral"}
                    >
                      <div class="toggle-slider"></div>
                    </div>
                    <div class="answer-hover-zone">
                      <p class="hover-placeholder">Hover for answer</p>

                      <div class="hidden-answer">
                        <Latex
                          value={problem.answer_latex}
                          style="font-size: 1.1em; color: blue;"
                        />
                      </div>
                    </div>
                  {/if}
                </div>
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
    padding: 0 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  .grading-form {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .problem-header-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 1.25rem;
    margin-bottom: 0rem;
  }

  .answer-input-wrapper input {
    width: 100%;
    max-width: 10rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: max-width 0.3s ease;
  }

  .problem-card {
    padding: 0.7rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    display: flex;
  }

  .problem-id {
    font-weight: bold;
    font-size: 1.6em;
  }

  .triple-toggle {
    width: 60px;
    height: 30px;
    background-color: lightgray;
    border-radius: 9999px;
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .toggle-slider {
    width: 26px;
    height: 26px;
    background-color: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 17px;
    transition: left 0.2s;
  }

  .autocomplete-wrapper {
    position: relative;
    width: 100%;
    max-width: 500px;
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
    background-color: #cce0ff;
    width: 7.5rem;
    height: 3.5rem;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hover-placeholder {
    font-style: italic;
    color: #666;
    font-size: 0.8rem;
    margin: 0;
    z-index: 1;
    transition: opacity 0.2s ease;
  }

  .answer-hover-zone:hover .hover-placeholder {
    opacity: 0;
  }

  .hidden-answer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0.25rem;
    background-color: #cce0ff;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2;
    transition:
      opacity 0.2s ease,
      visibility 0.2s ease;
    box-sizing: border-box;
    overflow: auto;
  }

  .answer-hover-zone:hover .hidden-answer {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  .hidden-answer :global(.katex) {
    margin: 0.2rem;
    max-width: 100%;
    font-size: 0.85em;
    line-height: 1.4;
    word-break: break-word;
    white-space: normal;
    transform: scale(0.9);
    transform-origin: center;
  }

  .hidden-answer :global(.katex-html) {
    max-width: 100%;
    word-break: break-word;
    white-space: normal;
  }

  .hidden-answer :global(.katex-display) {
    margin: 0;
    padding: 0;
    overflow: visible;
  }

  .problems-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .triple-toggle[data-state="correct"] {
    background-color: #4ade80;
  }

  .triple-toggle[data-state="correct"] .toggle-slider {
    left: calc(100% - 28px);
  }

  .triple-toggle[data-state="incorrect"] {
    background-color: #f87171;
  }

  .triple-toggle[data-state="incorrect"] .toggle-slider {
    left: 2px;
  }

  .problem-set {
    width: 100%;
    max-width: 100%;
    border: 2px solid #ddd;
    border-radius: 12px;
    padding: 1rem;
    margin: 2rem 0;
    background-color: #fafafa;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    box-sizing: border-box;
  }

  .set-label {
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
  }

  .problem-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  .save-button {
    margin-top: 0.3rem;
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

  .grading-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 0.8rem;
    background-color: white;
    font-weight: bold;
    font-size: 1.5rem;
    border-bottom: 1px solid #ddd;
    z-index: 1000;
    text-align: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }

  .grading-subheader {
    display: block;
    font-size: 1.6rem;
    color: #444;
    font-weight: normal;
    font-style: bold;
    letter-spacing: 0.5px;
    text-align: center;
    width: 100%;
    margin-top: 0.8rem;
  }

  @media (max-width: 768px) {
    .problem-header-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .answer-input-wrapper input {
      max-width: 100%;
    }

    .grading-header {
      font-size: 1.5rem;
      padding: 0.5rem;
    }

    .problem-grid {
      grid-template-columns: 1fr;
    }

    .problems-grid {
      grid-template-columns: 1fr;
    }

    .grading-subheader {
      display: block;
      font-size: 0.9rem;
      color: #444;
      font-weight: normal;
      font-style: italic;
      letter-spacing: 0.5px;
      text-align: center;
      width: 100%;
    }
  }
</style>
