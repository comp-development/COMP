<script lang="ts">
  import { page } from "$app/stores";
  import { onDestroy } from "svelte";
  import { Button, Badge, Modal } from "flowbite-svelte";
  import { FileLinesSolid } from "flowbite-svelte-icons";
  import {
    formatDuration,
    addTime,
    isAfter,
    diffBetweenDates,
  } from "$lib/dateUtils";
  import toast from "$lib/toast.svelte";
  import { handleError } from "$lib/handleError";
  import {
    getEventTests,
    getTeamId,
    addTestTaker,
    getTestTaker,
    getTeam,
  } from "$lib/supabase";
  import MathJax from "$lib/components/MathJax.svelte";
  import Loading from "$lib/components/Loading.svelte";
  import { supabase } from "$lib/supabaseClient";
  import { user } from "$lib/sessionStore";
  import TestCard from "$lib/components/TestCard.svelte";
  import SimpleLinkCard from "$lib/components/SimpleLinkCard.svelte";
  import { getTeamCustomFieldValue } from "$lib/supabase/teams";

  // Define test interface
  interface TestData {
    test_id: string;
    test_name: string;
    is_team: boolean;
    division?: string;
    opening_time?: string;
    length: number;
    buffer_time: number;
    status?: string;
    countdown?: string;
    disabled?: boolean;
    instructions?: string;
    start_time?: string;
    end_time?: string;
    link?: string | null;
  }

  let loading = $state(true);

  let open = $state(false);
  let instructions = $state("");
  let name = $state("");

  let currentTime: Date;

  let availableTests: TestData[] = [];
  let testStatusMap: Record<string, TestData> = $state({});
  let tests = $derived(Object.values(testStatusMap));
  let teamId: number | null = null;
  let teamDetails: any | null = null;
  let eventId = Number($page.params.event_id);

  let subscription: any;
  let statusUpdateInterval: any;

  const handleTestUpdate = (payload: any) => {
    console.log("TEST PAYLOAD", payload.new);
    testStatusMap[payload.new.test_id] = {
      ...testStatusMap[payload.new.test_id],
      ...payload.new,
    };
    return;
  };

  const handleTestTakerUpdate = (payload: any) => {
    console.log("TAKER PAYLOAD", payload.new);
    testStatusMap[payload.new.test_id] = {
      ...testStatusMap[payload.new.test_id],
      ...payload.new,
    };
  };

  (async () => {
    teamId = await getTeamId($user!.id, eventId);
    console.log("teamId", teamId);
    if (teamId) {
      try {
        teamDetails = await getTeam(teamId);
        console.log("Team Details:", teamDetails);
      } catch (error) {
        handleError(error as Error);
      }
    }
    await getTests();
    loading = false;

    // Listen to inserts
    subscription = supabase
      .channel("test-takers-" + teamId)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "test_takers",
          filter: "team_id=eq." + teamId,
        },
        handleTestTakerUpdate,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "test_takers",
          filter: "student_id=eq." + $user!.id,
        },
        handleTestTakerUpdate,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tests",
          filter: "event_id=eq." + eventId,
        },
        handleTestUpdate,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tests",
          filter: "event_id=eq." + eventId,
        },
        handleTestUpdate,
      )
      .subscribe();
  })();

  onDestroy(async () => {
    subscription ?? subscription.unsubscribe();
    statusUpdateInterval ?? clearInterval(statusUpdateInterval);
  });

  const updateStatus = (test: TestData) => {
    currentTime = new Date();
    const newStatus = {
      status: "Closed",
      countdown: "",
      disabled: true,
    };

    if (
      test.start_time &&
      test.end_time &&
      currentTime < new Date(test.end_time) &&
      currentTime > new Date(test.start_time)
    ) {
      newStatus.status = "Continue";
      newStatus.disabled = false;
      newStatus.countdown =
        "Time remaining: " +
        formatDuration(
          Math.abs(
            diffBetweenDates(currentTime, new Date(test.end_time), "seconds"),
          ),
        );
    } else if (
      !test.end_time &&
      (!test.opening_time || currentTime < new Date(test.opening_time))
    ) {
      newStatus.status = "Not Open";
      const timeTillTest = diffBetweenDates(
        test.opening_time,
        currentTime,
        "seconds",
      );

      if (test.opening_time && timeTillTest < 86400) {
        newStatus.countdown = "Time till test: " + formatDuration(timeTillTest);
      }
    } else if (
      isAfter(
        addTime(
          new Date(test.opening_time || ""),
          test.length + test.buffer_time,
          "seconds",
        ),
        currentTime,
      ) &&
      !test.start_time
    ) {
      newStatus.status = "Start";
      newStatus.countdown =
        "Time remaining: " +
        formatDuration(
          Math.min(
            test.length,
            Math.abs(
              diffBetweenDates(
                currentTime,
                addTime(
                  new Date(test.opening_time || ""),
                  test.length + test.buffer_time,
                  "seconds",
                ),
                "seconds",
              ),
            ),
          ),
        );
      newStatus.disabled = false;
    }
    testStatusMap[test.test_id] = {
      ...testStatusMap[test.test_id],
      ...newStatus,
    };
  };

  statusUpdateInterval = setInterval(() => {
    Object.values(testStatusMap).forEach(updateStatus);
  }, 1000);

  async function handleTestStart(test: TestData) {
    console.log("START TEST", test);
    let res;
    if (!test.start_time || !test.end_time) {
      res = await addTestTaker(test.test_id);
    }
    if (
      !res ||
      res == "A test taker entry for this taker already exists." ||
      res == "Inserted test_taker"
    ) {
      window.location.href = `./tests/${test.test_id}`;
    } else {
      toast.error(res);
    }
  }

  async function getTests() {
    try {
      const testList = (await getEventTests(Number($page.params.event_id), false)) ?? [];
      
      // Fetch team details once if needed for event 9 checks
      if (eventId === 9 && teamId !== null && !teamDetails) {
        try {
          teamDetails = await getTeam(teamId);
          console.log("Fetched Team Details for Event 9 checks:", teamDetails);
        } catch (error) {
          console.error("Error fetching team details for event 9 checks:", error);
          handleError(error as Error);
          // Decide how to proceed - maybe prevent tests from loading?
          // For now, we'll allow it to continue, but access checks might fail later.
        }
      } else if (eventId === 9 && teamId === null) {
         console.error("Team ID is null, cannot fetch team details for event 9 checks.");
         // Handle this case - perhaps show an error or prevent loading event 9 tests.
      }

      const testProcessingPromises = testList.map(async (test) => {
        try {
          const testTaker =
            (await getTestTaker(
              test.test_id,
              test.is_team ? teamId : $user!.id,
              test.is_team,
            )) ?? {};
          
          let { data: has_access, error: accessError } = await supabase.rpc('check_test_access', {
            p_test_id: test.test_id,
          });

          if (accessError) {
            console.error(`Error checking access for test ${test.test_id}:`, accessError);
            toast.error(`Error checking access for test ${test.test_name}: ${accessError.message}`);
            return null; // Skip this test on access check error
          }

          // Perform event 9 specific checks if user initially has access
          if (has_access && eventId === 9) {
             if (!teamDetails && teamId !== null) {
               // This case should ideally be handled by the pre-fetch, but as a fallback:
               console.warn("Fetching teamDetails inside map, should have been prefetched.");
               try {
                 teamDetails = await getTeam(teamId);
               } catch (error) {
                 console.error("Fallback fetch failed:", error);
                 has_access = false; // Deny access if fallback fetch fails
               }
             }
            
             if (!teamDetails) {
               console.error(`Cannot perform event 9 checks for test ${test.test_name} because teamDetails are missing.`);
               has_access = false;
             } else {
               // Apply Foal/Colt/Stallion checks
               const frontId = teamDetails.front_id;
               if (test.test_name?.includes('Foal') && !frontId?.endsWith('F')) {
                 has_access = false;
               }
               if (test.test_name?.includes('Colt') && !frontId?.endsWith('C')) {
                 has_access = false;
               }
               if (test.test_name?.includes('Stallion') && !frontId?.endsWith('S')) {
                 has_access = false;
               }
             }
          }

          if (has_access) {
            let linkValue: string | null = null;
            // Check for the specific test ID (ensure types match - test_id seems to be string from interface)
            if (test.test_id === 322 && teamId !== null) { 
              try {
                linkValue = await getTeamCustomFieldValue(teamId, 979);
                console.log(`Link for test ${test.test_id}:`, linkValue);
              } catch(linkError) {
                 console.error(`Error fetching custom field for test ${test.test_id}:`, linkError);
                 // Decide if this error should prevent the test from showing or just show without the link
              }
            }
            
            // Return the combined data for this test
            return { ...test, ...testTaker, link: linkValue };
          } else {
            return null; // User doesn't have access
          }
        } catch (error) {
           console.error(`Error processing test ${test.test_id} (${test.test_name}):`, error);
           handleError(error as Error); // Log the error
           return null; // Indicate failure for this specific test
        }
      });

      // Wait for all test processing promises to resolve
      const processedTests = (await Promise.all(testProcessingPromises))
                              .filter(test => test !== null) as TestData[]; // Filter out nulls (errors/no access)

      // Update the state with the processed tests
      const newTestStatusMap: Record<string, TestData> = {};
      for (const testData of processedTests) {
         if (testData) { // Ensure testData is not null before proceeding
           newTestStatusMap[testData.test_id] = testData;
           updateStatus(testData); // Initial status calculation
         }
      }
      testStatusMap = newTestStatusMap; // Update the state variable reactively

    } catch (error) {
      // Handle errors from getEventTests or Promise.all itself
      handleError(error as Error);
    }
  }

  function handleInstructionsClick(test: TestData) {
    open = true;
    instructions = test.instructions || "";
    name = test.test_name;
  }
</script>

<br />
<div class="page-container">
  <h1 class="page-title">Tests</h1>
  <br />
  <div>
    {#if loading}
      <Loading />
    {:else if tests.length === 0}
      <p>No available tests!</p>
    {:else}
      <div class="test-grid">
        {#each tests.sort((a, b) => {
          // Sort by status priority first
          const statusOrder: Record<string, number> = { Continue: 1, Start: 2, "Not Open": 3, Closed: 4 };
          const statusComparison = (statusOrder[a.status || ""] || 0) - (statusOrder[b.status || ""] || 0);
          if (statusComparison !== 0) return statusComparison;

          // Then sort by opening_time
          const timeA = a.opening_time ? new Date(a.opening_time).getTime() : 0;
          const timeB = b.opening_time ? new Date(b.opening_time).getTime() : 0;
          return timeA - timeB;
        }) as test}
          <div class="test-card-container">
            {#if test.test_id === 322}
              <SimpleLinkCard test={test} />
            {:else if test.test_id !== 322}
              <TestCard 
                test={test}
                isHostView={false}
                onOpenClick={(e) => {
                  if (e) e.preventDefault();
                  handleTestStart(test);
                }}
                onInstructionsClick={() => handleInstructionsClick(test)}
              />
            {/if}
          </div>
        {/each}
      </div>
      <br />
      <Modal bind:open title={name} on:open on:close>
        <div style="text-align:left"><MathJax math={instructions} /></div>
      </Modal>
    {/if}
  </div>
</div>

<style>
  .page-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .page-title {
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 1.75rem;
    font-weight: 600;
    color: #333;
  }

  .test-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .test-card-container {
    height: 100%;
  }

  @media (max-width: 640px) {
    .test-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
