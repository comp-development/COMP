<script lang="ts">
  import { onMount } from "svelte";
  import { onDestroy } from "svelte";
  import Button from "$lib/components/Button.svelte";
  import AsciiMath from "$lib/components/AsciiMath.svelte";
  import FormattedTimeLeft from "$lib/components/FormattedTimeLeft.svelte";
  import { Modal, Input } from "flowbite-svelte";
  import { InfoCircleSolid } from 'flowbite-svelte-icons';
  import { supabase } from "$lib/supabaseClient";
  import { formatDuration } from "$lib/dateUtils";

  import { handleError } from "$lib/handleError";
  import {
    getTestAnswers,
    upsertTestAnswer,
    getProblemClarification,
    changePage,
    fetchTestProblems,
  } from "$lib/supabase";
  import Problem from "./Problem.svelte";
  import type { Database } from "../../../db/database.types";

  interface Props {
    test_taker: any;
    settings: any;
    is_team?: boolean;
    timeRemaining?: number; // New prop to receive timeRemaining from parent
    timeElapsed?: number; // New prop to receive timeElapsed from parent
  }

  let { test_taker = $bindable(), settings, is_team = false, timeRemaining = 0, timeElapsed = 0 }: Props = $props();
  let pages = settings.pages;
  let meltTime = settings.meltTime;
  let answers = [];
  let problems = $state([]);
  let answersMap = $state({});
  let clarifications = $state({});
  let saved = $state({});
  let loading = $state(true);
  let startTime = test_taker.start_time;
  let endTime = test_taker.end_time;
  let curPage = $state(test_taker.page_number);
  let activeProblemNumber: number | null = null;
  let prevProblemNumber: number | null = null;

  async function log(
      event_type: Database["public"]["Enums"]["test_event"],
      data: string,
      problem_id?: number
    ) {
      data = activeProblemNumber && event_type == 'keypress'  ? `Problem ${activeProblemNumber}: ${data}` : data;

      if(event_type == 'answer_save') {
        data = `Problem ${problem_id}: ${data}`
      }

      if(event_type == 'problem_view') {
        if(problem_id && activeProblemNumber != problem_id && prevProblemNumber != problem_id) {
            return;
        }
        data = `Problem ${problem_id}: ${data}`
      }

      await supabase
        .from("test_logs")
        .insert({ test_taker_id: test_taker.test_taker_id, event_type, data });
      console.log("LOGGED", data, event_type);
    }

  onMount(() => {

    window.addEventListener("keydown", (e) => {
      // just check if at least two distinct keys are pressed!
      const isModifierKey = ["Meta", "Alt", "Shift", "Control"].includes(e.key);
      if(isModifierKey) {
        // if this is is a modifier key, just make sure that there are at least two
        const modifiers = [
            e.shiftKey ? "Shift" : null,
            e.metaKey ? "Meta" : null,
            e.ctrlKey ? "Ctrl" : null,
            e.altKey ? "Alt" : null,
          ].filter(Boolean);
        if(modifiers.length < 2) {
          return;
        }
      }
      else {
        // if this is not a modifier key
        if(!(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) {
          return;
        }
      }
      log("keypress", (e.shiftKey ? "Shift+" : "") + (e.metaKey ? "Meta+" : "") + (e.ctrlKey ? "Ctrl+" : "") + (e.altKey ? "Alt+" : "") + (isModifierKey ? "" : e.key));
    }); 

    
    window.addEventListener("paste", (e) => {
      log("paste", e.clipboardData?.getData("text") ?? "unknown");
    });
    window.addEventListener("focus", () => {
      log("focus", document.hasFocus().toString());
    });
    window.addEventListener("blur", () => {
      log("blur", document.hasFocus().toString());
    });
    window.addEventListener("visibilitychange", () => {
      log("visibility_change", document.hidden.toString());
    });
    
    // Prevent math elements from being focusable with tab
    disableMathTabIndexes();
    
    // Set up a mutation observer to handle dynamically loaded MathJax elements
    const observer = new MutationObserver((mutations) => {
      disableMathTabIndexes();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => {
      // Cleanup the observer when component is destroyed
      observer.disconnect();
    };
  });
  
  // Function to disable tab indexes on math elements
  function disableMathTabIndexes() {
    // Find all MathJax and math-related elements
    const mathElements = document.querySelectorAll('.MathJax, .MathJax_Display, .mjx-chtml, .mathlifier-display, .mathlifier-inline, .ascii-math-wrapper *');
    
    // Disable tab navigation for these elements
    mathElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.setAttribute('tabindex', '-1');
      }
    });
  }

  let test_answers_channel;
  let problem_clarifications_channel;
  let test_taker_channel;

  let currentField;
  let prevAnswer;

  let open = $state(false);

  const changeProblemClarification = (payload) => {
    //console.log("CLARIFY", payload);
    clarifications[payload.new.test_problem_id] =
      payload.new.clarification_latex;
  };

  async function loadData() {
    loading = true;
    const startTime = performance.now();
    await Promise.all([fetchAnswers(), fetchProblems()]);
    loading = false;
    const endTime = performance.now();
    console.log(`loadData took ${endTime - startTime} milliseconds`);
  }

  async function fetchAnswers() {
    answers = await getTestAnswers(test_taker.test_taker_id);
    answers.forEach((obj) => {
      answersMap[obj.test_problem_id] = obj.answer_latex;
      saved[obj.test_problem_id] = obj.answer_latex;
    });
  }

  async function fetchProblems() {
    try {
      problems = await fetchTestProblems(test_taker.test_taker_id);
      subscribeToChannels(),
        await Promise.all(
          problems.map(async (problem) => {
            if (!(problem.test_problem_id in answersMap)) {
              answersMap[problem.test_problem_id] = "";
            }
            const clarification = await getProblemClarification(
              problem.test_problem_id,
            );
            if (clarification && clarification.length > 0) {
              clarifications[problem.test_problem_id] =
                clarification[0].clarification_latex;
            }
          }),
        );
    } catch (error) {
      handleError(error);
    }
  }

  const handleAnswersUpsert = (payload) => {
    //console.log("UPSERT", payload);
    open = false;
    answersMap[payload.new.test_problem_id] = payload.new.answer_latex;
    saved[payload.new.test_problem_id] = payload.new.answer_latex;
  };

  async function subscribeToChannels() {
    if (problem_clarifications_channel) {
      problem_clarifications_channel.unsubscribe();
    }
    //console.log("PROBS", problems);
    const problemIds = problems
      .map((problem) => problem.test_problem_id)
      .join(",");
    problem_clarifications_channel = supabase
      .channel(
        "problem-clarification-for-test-" +
          test_taker.test_id +
          "-page-" +
          test_taker.page_number,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "problem_clarifications",
          filter: `test_problem_id=in.(${problemIds})`,
        },
        changeProblemClarification,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "problem_clarifications",
          filter: `test_problem_id=in.(${problemIds})`,
        },
        changeProblemClarification,
      )
      .subscribe();
  }

  function handleFocus(event, problemNumber) {
    //console.log("EVENT", event)
    prevAnswer = event.target.value;
    currentField = event.target;
    activeProblemNumber = problemNumber;
  }

  // Create a function to handle inserts

  const handleTestTakerUpsert = async (payload) => {
    //console.log("TEST TAKER UPSERT", payload);
    open = false;
    test_taker.page_number = payload.new.page_number;
    await loadData();
  };

  test_taker_channel = supabase
    .channel("test-takers-" + test_taker.test_taker_id)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "test_takers",
        filter: "test_taker_id=eq." + test_taker.test_taker_id,
      },
      handleTestTakerUpsert,
    )
    .subscribe();

  test_answers_channel = supabase
    .channel(
      "test-answers-for-taker-" +
        test_taker.test_taker_id +
        "-page-" +
        test_taker.page_number,
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "test_answers",
        filter: `test_taker_id=eq.${test_taker.test_taker_id}`,
      },
      handleAnswersUpsert,
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "test_answers",
        filter: `test_taker_id=eq.${test_taker.test_taker_id}`,
      },
      handleAnswersUpsert,
    )
    .subscribe();

  function saveFinalAnswer() {
    //console.log("Saving");
    if (currentField) {
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      });

      currentField.dispatchEvent(event);
    }
  }

  onDestroy(async () => {
    saveFinalAnswer();
    console.log("Destroying");
    if (test_answers_channel) {
      test_answers_channel.unsubscribe();
    }
    if (problem_clarifications_channel) {
      problem_clarifications_channel.unsubscribe();
    }
    if (test_taker_channel) {
      test_taker_channel.unsubscribe();
    }
  });

  async function handleContinue() {
    await changePage(test_taker.test_taker_id, curPage + 1);
    test_taker.page_number = curPage + 1;
    await loadData();
  }

  function sanitizeInput(input) {
    return input.trim();
  }

  async function changeAnswer(e, id, problemNumber, clean) {
    try {
      //console.log("ANSWER CHANGE")
      const upsertSuccess = await upsertTestAnswer(
        test_taker.test_taker_id,
        id,
        answersMap[id].trim(),
      );
      //console.log("SUCCESSFUL UPSERT", upsertSuccess)
      if (upsertSuccess == "Upsert succeeded") {
        saved[id] = answersMap[id];
        log("answer_save", saved[id], problemNumber);
        prevProblemNumber = problemNumber;
        if(clean) {
          activeProblemNumber = null;
        }
      } else {
        answersMap[id] = prevAnswer;
      }
    } catch (e) {
      handleError(e);
    }

  }

  // Function to check if the answer contains 3+ alphabetic characters not in quotes
  function hasUnquotedText(text: string): boolean {
    if (!text) return false;
    
    // If the text already has quotation marks, don't show the warning
    // as the user is likely already aware of how to use quotes
    if (text.includes('"')) return false;
    
    // Extract all potential sequences of 3+ consecutive letters/spaces
    // that might need to be quoted
    const matches = text.match(/[a-zA-Z\s]{3,}/g) || [];
    
    if (matches.length === 0) return false;
    
    // Check if any match is not within quotes and not a math function
    for (const match of matches) {
      // Skip if the match is just spaces
      if (match.trim() === '') continue;
      
      // Check if this is part of a LaTeX command (follows a backslash)
      const indexInText = text.indexOf(match);
      if (indexInText > 0 && text[indexInText - 1] === '\\') {
        continue;
      }
      
      // Skip common math functions and operators
      if ([
        // Trigonometric functions
        'sin', 'cos', 'tan', 'csc', 'sec', 'cot',
        'arcsin', 'arccos', 'arctan',
        // Other common functions
        'log', 'ln', 'exp', 'lim', 'max', 'min',
        'abs', 'floor', 'ceil', 'inf', 'det', 'dim',
        'hat', 'bar', 'vec', 'tilde', 'dot', 'ddot',
        'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
        // Calculus symbols
        'sum', 'prod', 'int', 'oint', 'grad', 'div', 'curl',
        // LaTeX notation
        'frac', 'sqrt', 'text', 'hat', 'bar', 'vec',
        // Set notation
        'cup', 'cap', 'subset', 'supset', 'empty',
        // Logic operators
        'and', 'lor', 'not', 'forall', 'exists',
        'sub', 'sube', 'sup', 'supe',
        'aleph', 'cdots', 'vdots', 'ldots', 'quad', 'frown', 'diamond', 'square', 'prop', 
      ].includes(match.toLowerCase())) {
        continue;
      }
      
      // Handle case where it's a combination of math functions
      let isAllMathFunctions = true;
      const words = match.trim().split(/\s+/);
      for (const word of words) {
        if (word.length < 3) continue; // Skip short words
        
        if (!['sin', 'cos', 'tan', 'log', 'lim', 'sum', 'int', 'max', 'min',
             'abs', 'det', 'dim', 'exp', 'gcd', 'lcm', 'sup', 'inf',
             'and', 'not', 'lor', 'sub', 'cup', 'cap'].includes(word.toLowerCase())) {
          isAllMathFunctions = false;
          break;
        }
      }
      if (isAllMathFunctions && words.length > 0) continue;
      
      // Check if the match is surrounded by quotes
      const quotedRegex = new RegExp(`"${match}"`, 'g');
      if (text.match(quotedRegex) === null) {
        return true;
      }
    }
    
    return false;
  }

  (async () => {
    await loadData();
  })();
  
  // Capture keyboard events at the document level to control tab navigation
  onMount(() => {
    const handleKeyDown = (e) => {
      // If Tab is pressed
      if (e.key === 'Tab') {
        // Find all form inputs that should be tabbable
        const tabbableElements = document.querySelectorAll('input, button, textarea, select, a[href], [tabindex]:not([tabindex="-1"])');
        
        // Get the currently focused element
        const focusedElement = document.activeElement;
        
        // If a MathJax or math element got focus somehow, find the next input to focus
        if (
          focusedElement && 
          (focusedElement.classList.contains('MathJax') || 
           focusedElement.classList.contains('mjx-chtml') ||
           focusedElement.closest('.ascii-math-wrapper') ||
           focusedElement.closest('.problem-div')?.contains(focusedElement) && 
           !['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'A'].includes(focusedElement.tagName)
          )
        ) {
          // Find the next input element to focus
          const inputs = Array.from(document.querySelectorAll('input'));
          if (inputs.length > 0) {
            e.preventDefault();
            inputs[0].focus();
          }
        }
      }
    };
    
    // Add the event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<div class="test-container">
  {#if test_taker.page_number < pages.length}
    <div class="page-actions">
      <Button
        action={(e) => {
          open = true;
          curPage = test_taker.page_number;
        }}
        title={"Continue"}
      />
    </div>
  {/if}
  
  <div class="test-content">
    {#if loading}
      <p>Loading...</p>
    {:else}
      <h2 class="page-subtitle">{pages[test_taker.page_number - 1]}</h2>
      {#each problems as problem}
        <div class="problem-container">
          <div class="problem-div">
            {#if meltTime}
              <h5>
                <FormattedTimeLeft
                  timeLeft={problem.problem_number * parseInt(meltTime) -
                    timeElapsed / 1000}
                  totalTime={problem.problem_number * parseInt(meltTime)}
                >
                  {#snippet children({ prop: time })}
                    {#if problem.problem_number * parseInt(meltTime) - timeElapsed / 1000 < 0}
                      Melted!
                    {:else}
                      Melts in {time}
                    {/if}
                  {/snippet}
                </FormattedTimeLeft>
              </h5>
            {/if}

            <Problem
              {problem}
              log={log}
              clarification={clarifications[problem.test_problem_id]}
            />
            <div class="mt-8 w-full max-w-md">
              <div class="answer-section">
                <div class="answer-input-header">
                  <label for="answer-input-{problem.test_problem_id}" class="block text-sm font-medium mb-1">Your Answer</label>
                  <div class="tooltip-container flex items-center">
                    <InfoCircleSolid class="w-4 h-4 text-primary" />
                    <span class="tooltip w-64">
                      Utilize <a href="https://asciimath.org/#syntax" class="text-blue-200" target="_blank">AsciiMath</a> for math typesetting!
                    </span>
                  </div>
                </div>
                <div class="answer-input-container">
                  <Input
                    id="answer-input-{problem.test_problem_id}"
                    bind:value={answersMap[problem.test_problem_id]}
                    disabled={meltTime
                      ? problem.problem_number * parseInt(meltTime) -
                          timeElapsed / 1000 <
                        0
                      : false}
                    on:focus={(e) => handleFocus(e, problem.problem_number)}
                    on:keydown={(e) =>
                      e.key === "Enter" &&
                      changeAnswer(e, problem.test_problem_id, problem.problem_number)}
                    on:blur={(e) => changeAnswer(e, problem.test_problem_id, problem.problem_number, true)}
                    maxlength={127}
                  />
                </div>
              </div>
              
              {#if answersMap[problem.test_problem_id] && answersMap[problem.test_problem_id].trim() !== ''}
                <div class="preview-section">
                  <div class="preview-label-container">
                    <div class="preview-label">Preview</div>
                    {#if hasUnquotedText(answersMap[problem.test_problem_id])}
                      <div class="tooltip-container ml-2 flex items-center">
                        <InfoCircleSolid class="w-4 h-4 text-amber-500" />
                        <span class="tooltip w-64">
                          To display plain text, surround it in quotation marks: "like this"
                        </span>
                      </div>
                    {/if}
                  </div>
                  <div class="ascii-math-wrapper">
                    <AsciiMath value={answersMap[problem.test_problem_id]} />
                  </div>
                </div>
              {/if}
              
              {#if saved[problem.test_problem_id]}
                <div class="saved-message">
                  <span class="checkmark">✓</span> Answer saved: <span class="saved-value">{saved[problem.test_problem_id]}</span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
      {#if test_taker.page_number < pages.length}
        <div class="page-actions-bottom">
          <Button
            action={(e) => {
              open = true;
              curPage = test_taker.page_number;
            }}
            title={"Continue"}
          />
        </div>
      {/if}
    {/if}
  </div>
</div>

<Modal title="Submit Current Set?" bind:open={open} autoclose>
  <p>
    Are you sure you want to submit the current set{#if is_team}
      for your team{/if}? This action cannot be undone.
  </p>
  <svelte:fragment slot="footer">
    <Button title="Cancel" outline action={() => (open = false)} />
    <Button title="Submit" action={async () => {
      open = false;
      await handleContinue();
    }} />
  </svelte:fragment>
</Modal>

<style>
  .test-container {
    width: 100%;
  }
  
  
  .page-subtitle {
    margin: 1rem 0;
    font-size: 1.25rem;
    font-weight: 500;
  }
  
  .page-actions {
    margin: 1rem 0;
  }
  
  .page-actions-bottom {
    margin-top: 1rem;
    margin-bottom: 0;
    display: flex;
    justify-content: center;
  }

  .problem-container {
    display: flex;
    margin-bottom: 1rem;
  }
  
  .problem-div,
  .feedback-div {
    background-color: var(--text-color-light);
    border: 2px solid rgb(104, 104, 104);
    border-radius: 0.5rem;
    margin: 10px;
    padding: 20px;
    text-align: left;
    flex-grow: 1;
  }
  
  /* Answer section styling */
  .answer-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .answer-input-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .answer-input-container {
    width: 100%;
  }
  
  /* Preview section styling */
  .preview-section {
    margin-top: 1rem;
  }
  
  .preview-label-container {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
  }
  
  .preview-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }
  
  /* Styling for ASCII Math output */
  .ascii-math-wrapper {
    padding: 0.75rem;
    background-color: #f8f9fa;
    border-radius: 0.375rem;
    border-left: 3px solid var(--primary, #3f9656);
    min-height: 2.5rem;
    display: flex;
    align-items: center;
  }
  
  /* Styling for saved message */
  .saved-message {
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    color: var(--primary, #3f9656);
    background-color: rgba(63, 150, 86, 0.1);
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    margin-top: 0.5rem;
    gap: 0.25rem;
  }
  
  .checkmark {
    font-weight: bold;
  }
  
  .saved-value {
    font-family: monospace;
    padding: 0 0.25rem;
    background-color: rgba(63, 150, 86, 0.15);
    border-radius: 0.125rem;
  }
  
  /* Custom tooltip styles */
  :global(.tooltip-container) {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  :global(.tooltip-container .tooltip) {
    visibility: hidden;
    background-color: #333;
    color: white;
    text-align: center;
    padding: 5px 10px;
    border-radius: 6px;
    position: absolute;
    z-index: 9999;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.3s;
    white-space: normal;
    font-size: 0.875rem;
    width: auto;
    min-width: 150px;
    max-width: 250px;
    pointer-events: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  :global(.tooltip-container .tooltip::after) {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
  
  :global(.tooltip-container:hover .tooltip) {
    visibility: visible;
    opacity: 1;
  }
  
  :global(.text-primary) {
    color: var(--primary, #3f9656);
  }
  
  /* Make MathJax and math elements unfocusable via tab */
  :global(.MathJax), 
  :global(.MathJax_Display),
  :global(.mjx-chtml),
  :global(.ascii-math-wrapper *),
  :global(.problem-div .mathlifier-display),
  :global(.problem-div .mathlifier-inline) {
    outline: none !important;
    tabindex: -1 !important;
  }
  
  /* Override MathJax default focus behavior */
  :global(.MathJax:focus), 
  :global(.MathJax_Display:focus),
  :global(.mjx-chtml:focus),
  :global(.ascii-math-wrapper *:focus) {
    outline: none !important;
  }
</style>
