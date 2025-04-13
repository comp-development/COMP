<script lang="ts">
  import { run } from "svelte/legacy";
  import Papa from "papaparse";
  import { page } from "$app/stores";
  import Button from "$lib/components/Button.svelte";
  import {
    Badge,
    Modal,
    Input,
    Textarea,
    Toggle,
    Select,
  } from "flowbite-svelte";
  import {
    formatTime,
    formatDuration,
    addTime,
    subtractTime,
    isBefore,
    isAfter,
    diffBetweenDates,
  } from "$lib/dateUtils";
  import Loading from "$lib/components/Loading.svelte";
  import {
    FileLinesOutline,
    EditOutline,
    ClipboardCheckOutline,
    TableRowOutline,
    PlusOutline,
    UploadOutline
  } from "flowbite-svelte-icons";
  import { handleError } from "$lib/handleError";
  import { onDestroy, onMount } from "svelte";
  import {
    getThisUser,
    getEventTests,
    getTeamId,
    updateTest,
    createTest,
  } from "$lib/supabase";
  import { supabase } from "$lib/supabaseClient";
  import DateTimePicker from "$lib/components/DateTimePicker.svelte";
  import TestCard from "$lib/components/TestCard.svelte";
    import toast from "$lib/toast.svelte";

  let loading = $state(true);

  let open = $state(false);
  let testModalOpen = $state(false);
  let accessRulesModalOpen = $state(false);
  let isEditMode = $state(false);

  let instructions = "";
  let name = "";

  let availableTests = [];
  let testStatusMap: Record<string, any> = $state({});
  let tests: any[] = [];
  run(() => {
    tests = Object.values(testStatusMap);
  });
  let user = null;
  let teamId = null;
  let eventId = Number($page.params.event_id);
  let subscription: any;

  interface TestData {
    test_id: string | number;
    test_name: string;
    is_team: boolean;
    division?: string;
    opening_time?: string;
    length: number;
    buffer_time: number;
    date?: string;
    time?: string;
    amPm?: string;
    status?: string;
    countdown?: string;
    instructions?: string;
    test_mode?: string;
    visible?: boolean;
    access_rules?: any;
    
  }

  let curTest: TestData = $state({} as TestData);
  let activeTest: TestData = $state({
    test_id: "",
    test_name: "",
    is_team: false,
    visible: false,
    length: 3600,
    buffer_time: 300,
    test_mode: "Standard",
    instructions: "",
  } as TestData);
  let dateValue: Date = $state(new Date());

  let isInvalid = $state(false);
  let nameError = $state("");

  function setupTime(date: Date) {
    let month, day, year, hours, minutes, currentAmPm;
    year = date.getFullYear();
    month = String(date.getMonth() + 1).padStart(2, "0"); // months are zero-indexed
    day = String(date.getDate()).padStart(2, "0");
    hours = date.getHours();
    currentAmPm = hours >= 12 ? "pm" : "am";
    hours = String(hours % 12 || 12).padStart(2, "0");
    minutes = String(date.getMinutes()).padStart(2, "0");
    curTest.date = `${month}/${day}/${year}`;
    curTest.time = `${hours}:${minutes}`;
    curTest.amPm = currentAmPm;
    dateValue = date;
  }

  const handleTestUpdate = (payload: any) => {
    console.log("TEST UPDATE PAYLOAD", payload);

    if (payload.eventType === "DELETE") {
      // Remove the deleted test from testStatusMap
      if (testStatusMap[payload.old.test_id]) {
        delete testStatusMap[payload.old.test_id];
      }
      return;
    }

    // Handle INSERT and UPDATE events
    testStatusMap[payload.new.test_id] = {
      ...testStatusMap[payload.new.test_id],
      ...payload.new,
    };
    updateStatus(testStatusMap[payload.new.test_id]);
  };

  (async () => {
    user = await getThisUser();
    console.log("USER", user);
    await getTests();
    console.log(testStatusMap);
    loading = false;

    // Subscribe to changes in the tests table
    subscription = supabase
      .channel("admin-tests-" + eventId)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all changes (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "tests",
          filter: "event_id=eq." + eventId,
        },
        handleTestUpdate
      )
      .subscribe();
  })();

  const updateStatus = (test: TestData) => {
    const currentTime = new Date();
    const newStatus = {
      status: "Closed",
      countdown: "",
    };
    if (!test.opening_time || currentTime < new Date(test.opening_time)) {
      newStatus.status = "Not Open";
      const timeTillTest = diffBetweenDates(
        test.opening_time,
        currentTime,
        "seconds"
      );
      if (test.opening_time && timeTillTest < 86400) {
        newStatus.countdown = "Time till open: " + formatDuration(timeTillTest);
      }
    } else if (
      isAfter(
        addTime(
          new Date(test.opening_time),
          test.length + test.buffer_time,
          "seconds"
        ),
        currentTime
      )
    ) {
      newStatus.status = "Open";
      newStatus.countdown =
        "Time remaining: " +
        formatDuration(
          Math.abs(
            diffBetweenDates(
              currentTime,
              addTime(
                new Date(test.opening_time),
                test.length + test.buffer_time,
                "seconds"
              ),
              "seconds"
            )
          )
        );
    }
    testStatusMap[test.test_id] = {
      ...testStatusMap[test.test_id],
      ...newStatus,
    };
  };

  const interval = setInterval(() => {
    Object.values(testStatusMap).forEach(updateStatus);
  }, 1000);

  onDestroy(() => {
    subscription?.unsubscribe();
    clearInterval(interval);
  });

  async function handleTestSubmit() {
    curTest.buffer_time = parseInt(curTest.buffer_time?.toString() || "0");
    let [hours, minutes] = (curTest.time || "12:00").split(":");
    if (curTest.amPm === "pm" && hours !== "12") {
      hours = String(parseInt(hours) + 12);
    } else if (curTest.amPm === "am" && hours === "12") {
      hours = "00"; // Handle midnight
    }

    const splitDate = (curTest.date || "01/01/2023").split("/");
    console.log(splitDate);
    const year2 = splitDate[2];
    const month2 = splitDate[0];
    const day2 = splitDate[1];

    const dateTimeString = `${year2}-${month2}-${day2}T${hours}:${minutes}:00`;
    console.log(dateTimeString);
    const timestampz = new Date(dateTimeString).toISOString(); // Supabase expects ISO format for timestamptz
    console.log(timestampz);
    const data = {
      opening_time: timestampz,
      buffer_time: curTest.buffer_time,
    };

    await updateTest(curTest.test_id, data);
    curTest.opening_time = timestampz;
    console.log("CUR", curTest);
    console.log("TEST", testStatusMap[curTest.test_id]);
    console.log(
      new Date(curTest.opening_time),
      curTest.length,
      curTest.buffer_time
    );
    console.log(
      addTime(
        new Date(curTest.opening_time),
        curTest.length + curTest.buffer_time,
        "seconds"
      )
    );
    console.log(
      formatDuration(
        Math.abs(
          diffBetweenDates(
            new Date(),
            addTime(
              new Date(curTest.opening_time),
              curTest.length + curTest.buffer_time,
              "seconds"
            ),
            "seconds"
          )
        )
      )
    );
  }

  function validateInput() {
    // Check if the value is a nonnegative integer using regex
    isInvalid = !/^\d+$/.test(curTest.buffer_time?.toString() || "");
  }

  async function getTests() {
    try {
      const fetchedTests = await getEventTests(
        Number($page.params.event_id),
        true
      );
      console.log(fetchedTests);
      if (fetchedTests) {
        for (const test of fetchedTests) {
          testStatusMap[test.test_id] = { ...test };
          updateStatus(test);
        }
      }
    } catch (error) {
      handleError(error as Error);
    }
  }

  let accessPreview = $state([]);
	async function fetchAccessPreview() {
		try {
			// Replace this with the appropriate query to fetch all students
			const {data, error} = await supabase.rpc('get_students_with_access_updated', {
				p_test_id: curTest.test_id,
			});
			console.log("DATA",data)
			// Filter out null results
			accessPreview = data
      if (error) {toast.error(error?.message);}
			console.log("ACCESS PREVIEW", accessPreview)
		} catch (error) {
			handleError(error as Error);
		}
	}

  function handleDateTimeChange(event: CustomEvent) {
    const { date, formattedDate, time, amPm } = event.detail;
    curTest.date = formattedDate;
    curTest.time = time;
    curTest.amPm = amPm;
    dateValue = date;
  }

  function closeModal() {
    open = false;
  }

  async function saveAndClose() {
    open = false;
    await handleTestSubmit();
  }

  function handleOpenClick(test: TestData) {
    curTest = test;
    setupTime(
      curTest.opening_time ? new Date(curTest.opening_time) : new Date()
    );
    open = true;
  }

  function handleSettingsClick(test: TestData) {
    openTestModal(true, test);
  }

  function handleAccessRulesClick(test: TestData){
    curTest = test;
		console.log("CURTEST", curTest);
		accessRulesModalOpen = true;
  }

  //handles the submission of test access rules, eg. info like what grade a student needs to be to be able to take a test.
  async function handleAccessRulesSubmit() {
		const data = {
			access_rules: curTest.access_rules
		};
		try {
			await updateTest(curTest.test_id, data);
			console.log("Access rules updated for test:", curTest.test_id);
		} catch (error) {
			handleError(error as Error);
		}
  }

  function openTestModal(isEdit: boolean, test?: TestData) {
    isEditMode = isEdit;

    if (isEdit && test) {
      // Edit mode - clone the existing test
      activeTest = { ...test };
    } else {
      // Create mode - initialize with defaults
      activeTest = {
        test_id: "",
        test_name: "",
        is_team: false,
        visible: false,
        length: 3600,
        buffer_time: 300,
        test_mode: "Standard",
        instructions: "",
      } as TestData;
    }

    nameError = "";
    testModalOpen = true;
  }



  function closeTestModal() {
    testModalOpen = false;
    nameError = "";
  }

  async function saveTestAndClose() {
    // Validate test name
    if (!activeTest.test_name || activeTest.test_name.trim() === "") {
      nameError = "Test name cannot be empty";
      return;
    }

    try {
      const data = {
        test_name: activeTest.test_name.trim(),
        length: parseInt(activeTest.length?.toString() || "3600"),
        buffer_time: parseInt(activeTest.buffer_time?.toString() || "300"),
        is_team: activeTest.is_team,
        visible: activeTest.visible,
        test_mode: activeTest.test_mode,
        instructions: activeTest.instructions,
      };

      if (isEditMode) {
        // Update existing test
        await updateTest(activeTest.test_id, data);
      } else {
        // Create new test
        await createTest({
          ...data,
          event_id: eventId,
        });
      }

      testModalOpen = false;
      nameError = "";
    } catch (error) {
      handleError(error as Error);
    }
  }
</script>

<br />
<div class="page-container">
  <h1 class="page-title">Tests</h1>
  <br />
  <div>
    {#if loading}
      <Loading />
    {:else if !tests || tests.length === 0}
      <div class="text-center">
        <button
          class="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none mx-auto flex items-center"
          onclick={() => openTestModal(false)}
        >
          <PlusOutline class="w-4 h-4 mr-2" />
          Create Test
        </button>
      </div>
    {:else}
      <div class="flex justify-between items-center mb-6">
        <button
          class="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none flex items-center"
          onclick={() => openTestModal(false)}
        >
          <PlusOutline class="w-4 h-4 mr-2" />
          Create Test
        </button>
        <!-- <button
          class="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none flex items-center"
          onclick={() => openTestModal(false)}
        >
        </button> -->
      </div>
      <div style="padding: 15px;">
        <a href="./tests/new">
          <button
            class="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none flex items-center"
          >
            Import Tests
          </button>
        </a>
        <button 
          class="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none mx-2 flex items-center"
          onclick={() => document.location.href= (`${$page.url.pathname}/upload`)}
        >
          <UploadOutline class="w-4 h-4 mr-2" />
          Upload Scans
        </button>
      </div>
      <div class="test-grid">
        {#each Object.values(testStatusMap).sort((a, b) => {
          // Sort by opening_time first
          const openingTimeA = a.opening_time ? new Date(a.opening_time).getTime() : 0;
          const openingTimeB = b.opening_time ? new Date(b.opening_time).getTime() : 0;
          const openingTimeComparison = openingTimeA - openingTimeB;
          if (openingTimeComparison !== 0) return openingTimeComparison;

          // Then sort by test_name
          const nameComparison = a.test_name.localeCompare(b.test_name);
          if (nameComparison !== 0) return nameComparison;

          // Finally sort by test_division
          return a.division?.localeCompare(b.division || "") || 0; // Handle undefined division
        }) as test}
          <div class="test-card-container">
            <TestCard
              {test}
              isHostView={true}
              onOpenClick={() => handleOpenClick(test)}
              onInstructionsClick={() => {}}
              onSettingsClick={() => handleSettingsClick(test)}
              onAccessRulesClick={() => handleAccessRulesClick(test)}
            />
          </div>
        {/each}
      </div>
      <br />

      <!-- Combined Test Modal (Create/Edit) -->
      <Modal
        bind:open={testModalOpen}
        size="xl"
        autoclose={false}
        class="w-full max-w-4xl"
      >
        <div class="text-center">
          <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">
            {isEditMode ? "Test Settings" : "Create New Test"}
          </h3>

          <!-- Form layout using centered columns -->
          <div
            class="flex flex-col items-center px-4 max-w-screen-md mx-auto space-y-8"
          >
            <!-- Row 1: Test Name and Visibility -->
            <div
              class="w-full flex flex-col md:flex-row justify-center md:space-x-12 space-y-6 md:space-y-0"
            >
              <div class="flex flex-col items-center">
                <span
                  class="mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Test Name <span class="text-red-500">*</span>
                </span>
                <div class="w-64">
                  <Input
                    bind:value={activeTest.test_name}
                    color={nameError ? "red" : "base"}
                  />
                  {#if nameError}
                    <p class="mt-2 text-sm text-red-600 dark:text-red-500">
                      {nameError}
                    </p>
                  {/if}
                </div>
              </div>

              <div class="flex flex-col items-center">
                <span
                  class="mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Visibility</span
                >
                <div class="flex items-center justify-center gap-3">
                  <Toggle bind:checked={activeTest.visible} />
                  <span>{activeTest.visible ? "Visible" : "Hidden"}</span>
                </div>
              </div>
            </div>

            <!-- Row 2: Test Type and Test Mode -->
            <div
              class="w-full flex flex-col md:flex-row justify-center md:space-x-12 space-y-6 md:space-y-0"
            >
              <div class="flex flex-col items-center">
                <span
                  class="mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Test Type</span
                >
                <div class="flex items-center justify-center gap-3">
                  <Toggle bind:checked={activeTest.is_team} />
                  <span>{activeTest.is_team ? "Team" : "Individual"}</span>
                </div>
              </div>

              <div class="flex flex-col items-center">
                <span
                  class="mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Test Mode</span
                >
                <div class="w-64">
                  <Select bind:value={activeTest.test_mode}>
                    <option value="Standard">Standard</option>
                    <option value="Puzzle">Puzzle</option>
                    <option value="Guts">Guts</option>
                    <option value="Meltdown">Meltdown</option>
                  </Select>
                </div>
              </div>
            </div>

            <!-- Row 3: Test Length and Buffer Time -->
            <div
              class="w-full flex flex-col md:flex-row justify-center md:space-x-12 space-y-6 md:space-y-0"
            >
              <div class="flex flex-col items-center">
                <span
                  class="mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Test Length (seconds)</span
                >
                <div class="w-64">
                  <Input type="number" bind:value={activeTest.length} />
                </div>
              </div>

              <div class="flex flex-col items-center">
                <span
                  class="mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Buffer Time (seconds)</span
                >
                <div class="w-64">
                  <Input type="number" bind:value={activeTest.buffer_time} />
                </div>
              </div>
            </div>

            <!-- Row 4: Instructions -->
            <div class="w-full flex flex-col items-center">
              <span
                class="mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Instructions</span
              >
              <div class="w-full max-w-2xl">
                <Textarea rows={5} bind:value={activeTest.instructions} />
              </div>
            </div>
          </div>

          <div class="flex justify-center gap-4 mt-8">
            <button
              class="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-100"
              onclick={closeTestModal}
            >
              Cancel
            </button>
            <button
              class="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
              onclick={saveTestAndClose}
            >
              {isEditMode ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal bind:open size="lg" autoclose={false}>
        <div class="text-center">
          <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">
            Set open time
          </h3>

          <DateTimePicker
            bind:date={dateValue}
            bind:time={curTest.time}
            bind:amPm={curTest.amPm}
            dateLabel="Test Date"
            timeLabel="Test Time"
            on:dateTimeChange={handleDateTimeChange}
          />

          <div class="mb-4">
            <div>
              <span
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Buffer Time (seconds)</span
              >
              <Input
                bind:value={curTest.buffer_time}
                color={isInvalid ? "red" : "base"}
                on:input={validateInput}
              />
              {#if isInvalid}
                <p class="mt-2 text-sm text-red-600 dark:text-red-500">
                  Input must be a nonnegative integer
                </p>
              {/if}
            </div>
          </div>

          <div class="flex justify-center gap-4 mt-6">
            <button
              class="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-100"
              onclick={closeModal}
            >
              Cancel
            </button>
            <button
              class="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
              onclick={saveAndClose}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      <Modal
			bind:open={accessRulesModalOpen}
			modalHeading="{curTest.test_name} Access Rules" 
			on:open= {async () => {
        fetchAccessPreview();
      }}
			on:close={async () => {
				accessRulesModalOpen = false;
				await handleAccessRulesSubmit();
			}}
			primaryButtonText="Save"
			secondaryButtonText="Cancel" 
			size="lg"
			on:click:button--secondary={() => (accessRulesModalOpen = false)}
			on:submit={async () => {
				accessRulesModalOpen = false;
				await handleAccessRulesSubmit();
        await fetchAccessPreview();
			}}
		>
			{curTest.test_name} Test Access Rules
			<div>
				<!-- Rules List -->
				{#if curTest.access_rules?.rules?.length > 0}
					<!-- Combine Logic -->
					{#if curTest.access_rules.rules.length > 1}
						<div class="rule-group">
							<label>Combine Logic</label>
							<select bind:value={curTest.access_rules.combine}>
								<option value="AND">AND</option>
								<option value="OR">OR</option>
							</select>
						</div>
					{/if}
					{#each curTest.access_rules.rules as rule, index}
						<div class="rule" style="display: flex; align-items: center; gap: 10px;">
							<!-- Field -->
							<Textarea
								labelText="Field"
								bind:value={rule.field}
								placeholder="Enter field name (e.g., grade, subject)"
							/>

							<!-- Operator -->
							<select bind:value={rule.operator}>
								<option value="=">Equals</option>
								<option value="!=">Not Equals</option>
								<option value=">">Greater Than</option>
								<option value="<">Less Than</option>
								<option value=">=">Greater Than or Equals</option>
								<option value="<=">Less Than or Equals</option>
								<option value="~">Contains Regex (case-sensitive)</option>
								<option value="!~">Does Not Contain Regex (case-sensitive)</option>
								<option value="~*">Contains Regex (case-insensitive)</option>
								<option value="!~*">Does Not Contain Regex (case-insensitive)</option>
								<option value="IN">One Of (comma-separated)</option>
								<option value="NOT IN">Not One Of (comma-separated)</option>
							</select>

							<!-- Value -->
							<Textarea
								labelText="Value"
								bind:value={rule.value}
								placeholder="Enter value (e.g., 7, Algebra)"
							/>

							<!-- Remove Rule Button -->
							<Button
								title="Remove Rule"
								action={() => {
									console.log("REMOVE");
									curTest.access_rules.rules = curTest.access_rules.rules.filter((_, i) => i !== index);
									if (curTest.access_rules.rules.length == 0) {
										curTest.access_rules = null;
									}
                  handleAccessRulesSubmit();
                  fetchAccessPreview();  //update the counter of number of students.
								}}

							>
								Remove Rule
							</Button>
						</div>
					{/each}
				{:else}
					<p>All students can access the test.</p>
				{/if}

				<!-- Add New Rule -->
				<Button
					title="Add Rule"
					action={() => {
						if (curTest.access_rules) {
							console.log(curTest.access_rules)
							console.log(("rules" in curTest.access_rules))
						}

						if (!curTest.access_rules || !("rules" in curTest.access_rules)) {
							curTest.access_rules = { combine: 'AND', rules: [] };
						}
						console.log("PUSHING")
						curTest.access_rules.rules.push({ field: '', operator: '==', value: '' });
						curTest.access_rules = curTest.access_rules
					}}
				>
					Add Rule
				</Button>
        
        <!-- Save Rules -->
        <Button 
          title = "Save"
          action= {async () => {
            await handleAccessRulesSubmit();
            await fetchAccessPreview();
          }}
          > Save  
        </Button>
			</div>
			{(curTest.access_rules) ? JSON.stringify(curTest.access_rules, null, 2) : "No Rules Have been Defined"}
			<div>
				<!-- Access Preview -->
				{#if accessPreview && accessPreview.length > 0}
					<h3>Number of Students Signed up for Test: {accessPreview.length}</h3>
            {#if !curTest.visible}
              Note: The test is not visible to them.
            {/if}
						<!-- {#each accessPreview as student} -->
							<!-- <li>{student.first_name} {student.last_name}</li> -->
						<!-- {/each} -->
				{:else if accessPreview && accessPreview.length === 0}
					<p>No students have access based on the current rules.</p>
				{/if}
			</div>
      <div>
      <!-- Preview Access -->
				<Button
        title="Preview Access"
        action={async () => {
          await fetchAccessPreview();
        }}
      >
        Preview Access
      </Button>
      </div>
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

  .form-field-wrapper {
    max-width: 16rem;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    justify-content: center;
  }

  .form-field-wrapper-lg {
    max-width: 32rem;
  }

  .form-field-wrapper :global(input),
  .form-field-wrapper :global(select),
  .form-field-wrapper :global(textarea) {
    width: 100%;
  }

  @media (max-width: 640px) {
    .test-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
