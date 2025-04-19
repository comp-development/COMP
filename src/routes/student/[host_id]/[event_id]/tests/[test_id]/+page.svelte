<script lang="ts">
  import { page } from "$app/stores";
  import toast from "$lib/toast.svelte";
  import { formatTime, addTime, subtractTime, formatDuration } from "$lib/dateUtils";

  import TestView from "$lib/components/TestView.svelte";
  import MathJax from "$lib/components/MathJax.svelte";
  import Button from "$lib/components/Button.svelte";
  import Alert from "$lib/components/Alert.svelte";
  import { handleError } from "$lib/handleError";
  import { getTestTaker, getTest, getTeamId } from "$lib/supabase";
  import { getEventInformation } from "$lib/supabase";
  import { user } from "$lib/sessionStore";
  import Loading from "$lib/components/Loading.svelte";
  import InstructionsAccordion from "$lib/components/InstructionsAccordion.svelte";
  import CustomAccordion from "$lib/components/CustomAccordion.svelte";
  import FormattedTimeLeft from "$lib/components/FormattedTimeLeft.svelte";
  import { onDestroy, onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";


  let loading = $state(true);
  let disallowed = $state(false);
  let instructionsOpen = $state(true); // Track if instructions are open

  let event_id = Number($page.params.event_id);
  let test_id = Number($page.params.test_id);

  let test = $state<any>({});
  let test_taker = $state();
  let event_name = $state('');
  
  // Timer state variables
  let formattedTime = $state("0:00:00");
  let timeRemaining = $state(0);
  let timeElapsed = $state(0);
  let timerInterval: number;
  let endTimeMs: number;
  let startTimeMs: number;
  
  // Function to toggle instructions state
  function handleInstructionsToggle(isOpen: boolean) {
    instructionsOpen = isOpen;
  }
  
  // Function to check if there are instructions
  function hasInstructions(): boolean {
    return !!test?.instructions && test.instructions.trim() !== '';
  }
  
  (async () => {
    try {
      test = await getTest(test_id);
      const eventInfo = await getEventInformation(event_id);
      event_name = eventInfo.event_name;
      await getThisTestTaker();
      
      if (test_taker) {
        // Initialize timer variables
        startTimeMs = new Date(test_taker.start_time).getTime();
        endTimeMs = new Date(test_taker.end_time).getTime();
        updateTimer(); // Initial update
        timerInterval = setInterval(updateTimer, 1000);
      }
    } catch (error) {
      handleError(error);
    } finally {
      loading = false;
    }
  })();

  function updateTimer() {
    if (!test_taker || !test_taker.end_time) return;

    const now = new Date().getTime(); // Current time in milliseconds

    timeRemaining = endTimeMs - now; // Calculate the time difference
    timeElapsed = now - startTimeMs;
    
    // If time has passed, stop the timer
    if (timeRemaining <= 0 || now < startTimeMs) {
      console.log("OUT OF TIME");
      timeRemaining = 0;
      clearInterval(timerInterval);
      window.location.href = "./";
      return;
    }

    // Format the time remaining
    formattedTime = formatDuration(timeRemaining / 1000);
  }
  
  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });

  async function getThisTestTaker() {
    const is_team = (await getTest(test_id)).is_team;
    let taker_id = $user!.id;
    if (is_team) {
      taker_id = await getTeamId(taker_id, event_id);
    }
    test_taker = await getTestTaker(test_id, taker_id, is_team);

    const { data : has_access } = await supabase.rpc('check_test_access', {
				  p_test_id: test.test_id,
		});

    if (!test_taker) {
      disallowed = true;
      loading = false;
      throw new Error(
        "Test with id " + $page.params.test_id + " doesn't exist!",
      );
    }
    if (!has_access){
      disallowed = true;
      loading = false;
      throw new Error(
        "This user/team does not have access to this test",
      );
    }
  }
</script>

<div class="page-wrapper">
  <header class="fixed-header">
    {#if loading}
      <Loading />
    {:else if disallowed}
      <div class="text-center py-8">
        <h2 class="text-xl font-medium text-red-600">You are not authorized to view this test!</h2>
      </div>
    {:else}
      <div class="header-content">
        <div class="header-top-row">
          <div class="left-section">
            <a href="../tests" class="back-button">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Back</span>
            </a>
          </div>
          
          <div class="title-section">
            <h1 class="page-title">{test.test_name}</h1>
            {#if event_name}
              <h2 class="event-name">{event_name}</h2>
            {/if}
          </div>
          
          <div class="right-section">
            <div class="timer-container">
              <div class="timer-box">
                <div class="timer-content flex-col">
                  <div class="timer-label">Time Left:</div>
                  <FormattedTimeLeft
                    timeLeft={timeRemaining / 1000}
                    totalTime={(endTimeMs - startTimeMs) / 1000}
                  >
                    <span class="timer-value flex items-center">{formattedTime}</span>
                  </FormattedTimeLeft>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="instructions-container" class:hidden={!hasInstructions()}>
          <InstructionsAccordion 
            instructions={test.instructions} 
            open={instructionsOpen}
            onToggle={handleInstructionsToggle}
          />
        </div>
      </div>
    {/if}
  </header>
  
  <main class="main-content" class:instructions-collapsed={!instructionsOpen || !hasInstructions()}>
    {#if !loading && !disallowed}
      <div class="test-container">
        <TestView 
          {test_taker} 
          is_team={test.is_team} 
          settings={test.settings} 
          timeRemaining={timeRemaining}
          timeElapsed={timeElapsed}
        />
      </div>
      
      <Alert 
        message="Answers are automatically submitted when time expires."
        class="mt-3" 
      />
    {/if}
  </main>
</div>

<style>
  .page-wrapper {
    width: 100%;
    position: relative;
  }
  
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: white;
    padding: 1rem 2rem;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .header-content {
    max-width: 1600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
  
  .left-section, .right-section {
    flex: 1;
  }
  
  .title-section {
    text-align: center;
    flex: 2;
  }
  
  .page-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
  
  .event-name {
    font-size: 1rem;
    font-weight: 500;
    color: #666;
    margin-top: 0.25rem;
  }
  
  .back-button {
    display: flex;
    align-items: center;
    color: var(--primary, #3f9656);
    font-weight: 500;
    gap: 0.5rem;
    text-decoration: none;
    transition: opacity 0.2s;
  }
  
  .back-button:hover {
    opacity: 0.8;
  }
  
  .timer-container {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  
  .timer-box {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--primary-tint, #e6f2ea);
    border: 1px solid var(--primary-light, #a7f0ba);
    border-radius: 0.5rem;
    padding: 0.5rem 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    min-width: 120px;
  }
  
  .timer-content {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
  }
  
  .timer-label {
    font-size: 0.85rem;
    color: var(--primary, #3f9656);
    text-align: center;
    font-weight: 500;
  }
  
  .timer-value {
    font-weight: 700;
    font-size: 1.4rem;
    color: var(--primary, #3f9656);
    display: flex;
    align-items: center;
    line-height: 1;
  }
  
  .instructions-container {
    margin-top: 0.5rem;
    transition: all 0.3s ease;
  }
  
  .hidden {
    display: none;
  }
  
  .main-content {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 2rem;
    padding-top: calc(180px + 1rem); /* Height of fixed header + extra space */
    transition: padding-top 0.3s ease;
  }
  
  .instructions-collapsed {
    padding-top: calc(120px + 1rem); /* Reduced padding when instructions are collapsed */
  }
  
  .test-container {
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);
    padding: 1.25rem;
  }
  
  /* Define text-primary class for the icon */
  :global(.text-primary) {
    color: var(--primary, #3f9656);
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
    padding: 8px 12px;
    border-radius: 6px;
    position: absolute;
    z-index: 9999;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.2s, visibility 0.2s;
    white-space: normal;
    font-size: 0.875rem;
    width: auto;
    min-width: 180px;
    max-width: 250px;
    pointer-events: none; /* Initially none */
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
  
  /* Show tooltip on hover of icon or tooltip itself */
  :global(.tooltip-container:hover .tooltip) {
    visibility: visible;
    opacity: 1;
    pointer-events: auto; /* Enable pointer events when visible */
  }
  
  /* Keep tooltip visible when hovering on the tooltip itself */
  :global(.tooltip-container .tooltip:hover) {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
  }
</style>
