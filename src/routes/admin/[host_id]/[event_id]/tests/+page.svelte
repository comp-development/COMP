<script lang="ts">
  import { run } from "svelte/legacy";
  import { page } from "$app/stores";
  import Loading from "$lib/components/Loading.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import ListCheckedMirror from "carbon-icons-svelte/lib/ListCheckedMirror.svelte";
  import TableSplit from "carbon-icons-svelte/lib/TableSplit.svelte";
  import { handleError } from "$lib/handleError";
  import { getThisUser, getEventTests, createTest, editTest } from "$lib/supabase";
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
  let curTest = $state();
  let isModalOpen = $state(false);
  let newResponses = $state({});
  let validationErrors = $state({});

  let editResponses = $state({});
  let editValidationErrors = $state({});

  (async () => {
    user = await getThisUser();
    console.log("USER", user);
    await getTests();
    console.log(testStatusMap);
    loading = false;
  })();

  async function getTests() {
    try {
      tests = await getEventTests($page.params.event_id);
      console.log(tests);
      for (const test of tests) {
        testStatusMap[test.test_id] = { ...test };
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

  const editFields = [
    { name: "opening_time", label: "Opening Time", custom_field_type: "datetime", required: true, editable: true },
    { name: "buffer_time", label: "Buffer Time (seconds)", custom_field_type: "number", required: true, editable: true },
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

  async function handleEditSubmit(event) {
    try {
      event.preventDefault();

      const openingDate = new Date(editResponses.opening_time);

      const testData = {
        ...editResponses,
        opening_time: openingDate.toISOString()
      };

      let newTest = await editTest(curTest, testData);
      testStatusMap[curTest] = newTest;
      
      toast.success("Test updated successfully!");
      open = false;
    } catch (e) {
      handleError(e);
    }
  }

  function formatDateTimeLocal(dateTimeString: string) {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
                <Badge color="green" rounded
                  >{test.is_team ? "Team" : "Individual"}</Badge
                >
                {#if test.division}
                  <Badge color="green" rounded>{test.division}</Badge>
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
                  editFields[0].value = formatDateTimeLocal(test.opening_time);
                  editFields[1].value = test.buffer_time;
                  curTest = test.test_id;
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
      <Modal bind:open={open} size="md" autoclose={false}>
        <div class="specificModalMax">
          <h3 class="text-xl font-medium text-gray-900 dark:text-white">
            Edit Opening Time
          </h3>
          <CustomForm
            fields={editFields}
            bind:newResponses={editResponses}
            bind:validationErrors={editValidationErrors}
            handleSubmit={handleEditSubmit}
            showBorder={false}
          />
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
