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
  } from "$lib/supabase";
  import MathJax from "$lib/components/MathJax.svelte";
  import Loading from "$lib/components/Loading.svelte";
  import { supabase } from "$lib/supabaseClient";
  import { user } from "$lib/sessionStore";
  import TestCard from "$lib/components/TestCard.svelte";

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
      for (const test of testList) {
        const testTaker =
          (await getTestTaker(
            test.test_id,
            test.is_team ? teamId : $user!.id,
            test.is_team,
          )) ?? {};
        console.log("TAKER", testTaker, test);
        testStatusMap[test.test_id] = { ...test, ...testTaker };
        updateStatus(test);
      }
    } catch (error) {
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
            <TestCard 
              test={test}
              isHostView={false}
              onOpenClick={(e) => {
                if (e) e.preventDefault();
                handleTestStart(test);
              }}
              onInstructionsClick={() => handleInstructionsClick(test)}
            />
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
