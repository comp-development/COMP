<script lang="ts">
  import { run } from "svelte/legacy";
  import { page } from "$app/stores";
  import {
    DatePicker,
    DatePickerInput,
    TimePicker,
    TimePickerSelect,
    SelectItem,
    TextInput,
  } from "carbon-components-svelte";
  import {
    formatDuration,
    addTime,
    isAfter,
    diffBetweenDates,
  } from "$lib/dateUtils";
  import Loading from "$lib/components/Loading.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import ListCheckedMirror from "carbon-icons-svelte/lib/ListCheckedMirror.svelte";
  import TableSplit from "carbon-icons-svelte/lib/TableSplit.svelte";
  import { handleError } from "$lib/handleError";
  import { getThisUser, getEventTests, updateTest, createTest } from "$lib/supabase";
  import { Badge, Button, Modal } from "flowbite-svelte";
  import CustomForm from "$lib/components/CustomForm.svelte";
    import toast from "$lib/toast.svelte";

  let loading = $state(true);
  let open = $state(false);
  let name = "";
  let testStatusMap = $state({});
  let tests;

  run(() => {
    tests = Object.values(testStatusMap);
  });

  let user = null;
  let curTest = $state({});
  let isInvalid = $state(false);
  let isModalOpen = $state(false);
  let newResponses = $state({});
  let validationErrors = $state({});

  function setupTime(date) {
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
  }

  (async () => {
    user = await getThisUser();
    console.log("USER", user);
    await getTests();
    console.log(testStatusMap);
    loading = false;
  })();

  const updateStatus = (test) => {
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
        "seconds",
      );
      if (test.opening_time && timeTillTest < 86400) {
        newStatus.countdown = "Time till open: " + formatDuration(timeTillTest);
      }
    } else if (
      isAfter(
        addTime(
          new Date(test.opening_time),
          test.length + test.buffer_time,
          "seconds",
        ),
        currentTime,
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
                "seconds",
              ),
            ),
          ),
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

  async function handleSubmit() {
    curTest.buffer_time = parseInt(curTest.buffer_time);
    let [hours, minutes] = curTest.time.split(":");
    if (curTest.amPm === "pm" && hours !== "12") {
      hours = parseInt(hours) + 12;
    } else if (curTest.amPm === "am" && hours === "12") {
      hours = "00"; // Handle midnight
    }

    const splitDate = curTest.date.split("/");
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
      curTest.buffer_time,
    );
    console.log(
      addTime(
        new Date(curTest.opening_time),
        curTest.length + curTest.buffer_time,
        "seconds",
      ),
    );
    console.log(
      formatDuration(
        Math.abs(
          diffBetweenDates(
            new Date(),
            addTime(
              new Date(curTest.opening_time),
              curTest.length + curTest.buffer_time,
              "seconds",
            ),
            "seconds",
          ),
        ),
      ),
    );
  }

  function validateInput() {
    // Check if the value is a nonnegative integer using regex
    isInvalid = !/^\d+$/.test(curTest.buffer_time);
  }

  async function getTests() {
    try {
      tests = await getEventTests($page.params.event_id);
      console.log(tests);
      for (const test of tests) {
        testStatusMap[test.test_id] = { ...test };
        updateStatus(test);
      }
    } catch (error) {
      handleError(error);
    }
  }

  const fields = [
    { name: "test_name", label: "Test Name", custom_field_type: "text", required: true },
    { name: "buffer_time", label: "Buffer Time (seconds)", custom_field_type: "number", required: true },
    { name: "instructions", label: "Instructions", custom_field_type: "paragraph", required: true },
    { name: "opening_time", label: "Opening Time", custom_field_type: "datetime", required: true },
    { name: "division", label: "Division", custom_field_type: "text", required: true },
    { name: "length", label: "Length (minutes)", custom_field_type: "number", required: true },
    { name: "is_team", label: "Is Team", custom_field_type: "toggle", required: true },
    { name: "visible", label: "Visible", custom_field_type: "toggle", required: true },
    { name: "test_mode", label: "Test Mode", custom_field_type: "dropdown", required: true, choices: ["Standard", "Puzzle", "Guts", "Meltdown"] },
  ];

  async function handleFormSubmit(event) {
    try {
      event.preventDefault();

      const openingDate = new Date(newResponses.opening_time);

      const testData = {
        ...newResponses,
        is_team: newResponses.is_team ?? false,
        visible: newResponses.visible ?? false,
        event_id: $page.params.event_id,
        opening_time: openingDate.toISOString(),
        settings: { pages: [""] },
        release_results: false,
        access_rules: null,
      };

      const newTest = await createTest(testData);
      testStatusMap[newTest.test_id] = newTest;
      toast.success("Test created successfully!");
      isModalOpen = false;
    } catch (e) {
      handleError(e);
    }
  }
</script>

<h1>Tests</h1>
<br />
<Button
  pill
  color="primary"
  onclick={() => { isModalOpen = true; }}>Create Test</Button
>
<br /><br />
<div>
  {#if loading}
    <Loading />
  {:else if tests.length === 0}
    <p>No available tests!</p>
  {:else}
    <div class="buttonContainer">
      {#each Object.values(testStatusMap).sort((a, b) => {
        // Sort by opening_time first
        const openingTimeComparison = new Date(a.opening_time) - new Date(b.opening_time);
        if (openingTimeComparison !== 0) return openingTimeComparison;

        // Then sort by test_name
        const nameComparison = a.test_name.localeCompare(b.test_name);
        if (nameComparison !== 0) return nameComparison;

        // Finally sort by test_division
        return a.division?.localeCompare(b.division || "") || 0; // Handle undefined division
      }) as test}
        <div>
          <div class="problemContainer">
            <div>
              <div
                class="flex"
                style="align-items: center; justify-content: left;"
              >
                <h4>
                  {test.test_name}
                </h4>
                <Badge color="primary" rounded
                  >{test.is_team ? "Team" : "Individual"}</Badge
                >
                {#if test.division}
                  <Badge color="primary" rounded>{test.division}</Badge>
                {/if}
              </div>
              {#if test.status == "Not Open" && test.opening_time}
                <p>
                  Start Time: {new Date(test.opening_time).toLocaleString([], {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              {/if}
              <p style="text-align: left;">Duration: {test.length / 60} mins</p>
              <p style="text-align: left;">
                Buffer: {test.buffer_time / 60} mins
              </p>
            </div>
            <div class="flex" style="gap: 5px">
              <p style="margin-right: 5px;">
                {test.countdown}
              </p>
              <!--
                                <Toggle
                                    labelText="Visible"
                                    on:toggle={(e) => console.log(e.detail)}
                                />
                            -->

              <div class="tooltip-container">
                <a href="./tests/{test.test_id}">
                  <button class="test-button empty">
                    <Edit />
                  </button>
                  <span class="tooltip">Edit Test</span>
                </a>
              </div>
              <div class="tooltip-container">
                <a href="./tests/{test.test_id}/grade">
                  <button class="test-button empty">
                    <ListCheckedMirror />
                  </button>
                  <span class="tooltip">Grade Test</span>
                </a>
              </div>
              <div class="tooltip-container">
                <a href="./tests/{test.test_id}/results">
                  <button class="test-button empty">
                    <TableSplit />
                  </button>
                  <span class="tooltip">Results</span>
                </a>
              </div>
              <button
                class="test-button full"
                onclick={(e) => {
                  curTest = test;
                  setupTime(
                    curTest.openingTime
                      ? new Date(curTest.openingTime)
                      : new Date(),
                  );
                  open = true;
                }}
              >
                Open
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
    <br />
    <div class="modalExterior">
      <Modal bind:open={open} size="lg" autoclose={false}>
        <div class="specificModalMax">
          <h3 class="text-xl font-medium text-gray-900 dark:text-white">
            {name}
          </h3>
          <div>
            Set open time:
            <DatePicker bind:value={curTest.date} datePickerType="single" on:change>
              <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
            </DatePicker>

            <TimePicker
              labelText="Time"
              placeholder="hh:mm"
              bind:value={curTest.time}
            >
              <TimePickerSelect bind:value={curTest.amPm}>
                <SelectItem value="am" text="AM" />
                <SelectItem value="pm" text="PM" />
              </TimePickerSelect>
            </TimePicker>

            <Button color="primary" onclick={() => { setupTime(new Date()); }} pill>Now</Button>

            <TextInput
              labelText="Buffer Time (seconds)"
              bind:value={curTest.buffer_time}
              invalid={isInvalid}
              invalidText="Input must be a nonnegative integer"
              on:input={validateInput}
            />
          </div>
        </div>
      </Modal>
    </div>
  {/if}
</div>

<div class="modalExterior">
  <Modal bind:open={isModalOpen} size="md" autoclose={false}>
    <div class="specificModalMax">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">
        Create Test
      </h3>
      <CustomForm
        {fields}
        bind:newResponses
        bind:validationErrors
        handleSubmit={handleFormSubmit}
        showBorder={false}
      />
    </div>
  </Modal>
</div>

<style>
  .test-button {
    border-radius: 10px;
    border: 1px solid #a7f0ba;
  }

  .full {
    background-color: #a7f0ba;
    padding: 10px 20px;
  }

  .empty {
    padding: 10px 10px;
  }

  button:disabled {
    cursor: not-allowed;
  }

  .test-button:not([disabled]):hover {
    transform: scale(1.05);
    cursor: pointer;
  }

  .full:not([disabled]):hover {
    border: 2px solid #3f9656;
  }

  .empty:not([disabled]):hover {
    border: 2px solid #494949;
  }

  :global(.specificModalMax .registrationForm) {
    padding: 0px;
  }
</style>
