<script lang="ts">
  import { run } from "svelte/legacy";
  import Papa from "papaparse";
  import { page } from "$app/stores";
  import Button from "$lib/components/Button.svelte";
  import {
    Toggle,
    Tag,
    Modal,
    DatePicker,
    DatePickerInput,
    TimePicker,
    TimePickerSelect,
    SelectItem,
    TextInput,
    TextArea,
    Select,
    Checkbox,
    FileUploader,
  } from "carbon-components-svelte";
  import { z } from "zod";
  import toast from "$lib/toast.svelte";
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
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import ListCheckedMirror from "carbon-icons-svelte/lib/ListCheckedMirror.svelte";
  import TableSplit from "carbon-icons-svelte/lib/TableSplit.svelte";
  import { handleError } from "$lib/handleError";
  import { onDestroy, onMount, tick } from "svelte";
  import {
    getThisUser,
    getEventTests,
    getTeamId,
    updateTest,
    insertTest,
  } from "$lib/supabase";
  // import { Checkbox } from "flowbite-svelte";

  let loading = $state(true);

  let open = $state(false);
  let instructions = "";
  let name = "";
  let description = "";

  let availableTests = [];
  let testStatusMap = $state({});
  let tests;
  run(() => {
    tests = Object.values(testStatusMap);
  });
  let user = null;
  let teamId = null;

  let curTest = $state({});

  let isInvalid = $state(false);

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

  // Add CSV schema validation
  const CSVSchema = z
    .object({
      problem_latex: z.string(),
      answer_latex: z.string(),
      problem_number: z.number().int().positive(),
    })
    .passthrough(); // Allow for any other headers, which will be ignored

  // Add state variables
  let csvData = $state<any[]>([]);
  let csvErrors = $state<string[]>([]);
  let isUploading = $state(false);
  let isSubmitting = $state(false);
  let fileUploaderRef;

  async function createTestSubmit() {
    try {
      const { data, error } = await insertTest({
        name,
        description,
        event_id: $page.params.event_id,
      });

      if (error) throw error;

      toast.success("Test added successfully!");
      await getTests(); // Refresh the test list
    } catch (error) {
      handleError(error);
    }
  }

  // Create a key to force re-render
  let fileUploaderKey = 0;

  onMount(() => {
    // Get a reference to the actual file input element
    fileInputElement = document.querySelector(".bx--file-input");
  });

  // Add CSV handler function
  async function handleCSVUpload(event: CustomEvent<{ files: FileList }>) {
    console.log("Handling CSV upload...");
    isUploading = true;
    csvData = [];
    csvErrors = [];
    console.log(event.detail);
    const file = event.detail[0];
    if (!file) {
      isUploading = false;
      return;
    }

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,

      // Do the following upon completion
      complete: async (results) => {
        console.log(results.data);
        if (results.errors.length > 0) {
          console.log("errors: " + results.errors);
          csvErrors = results.errors.map((e) => `Row ${e.row}: ${e.message}`);
          toast.error(csvErrors.join("\n"));
          isUploading = false;
          clearFileInput();
          return;
        }

        const validationErrors = validateCSV(results.data);
        if (validationErrors.length > 0) {
          csvErrors = validationErrors;
          isUploading = false;
          toast.error(csvErrors[0] + "\nReload the page and try again");

          // Force re-render the FileUploader
          isUploading = false;
          await tick();
          fileUploaderKey++;
        } else {
          csvData = results.data;
          toast.success("CSV uploaded and validated successfully!");
          isUploading = false;
        }
      },
      error: () => {
        toast.error("An error occurred while parsing the CSV file.");
        isUploading = false; // Reset on parsing failure
      },
    });
  }

  // Function to clear the file input
  function clearFileInput() {
    // Find and click the close button
    const closeButton = document.querySelector(".bx--file-close");
    if (closeButton) {
      closeButton.click();
    }

    // As a fallback, also clear the input value using DataTransfer
    if (fileInputElement) {
      // Create an empty DataTransfer object
      const dt = new DataTransfer();
      // Set the files property to the empty DataTransfer files
      fileInputElement.files = dt.files;
    }
  }

  function validateCSV(data: any[]) {
    const errors: string[] = [];

    if (!data[0]?.problem_latex) {
      console.log("Missing test_name header");
      errors.push("Missing test_name header");
    }
    if (!data[0]?.answer_latex) {
      console.log("Missing problem_question header");
      errors.push("Missing problem_question header");
    }
    if (!data[0]?.problem_number) {
      console.log("Missing problem_number header");
      errors.push("Missing problem_number header");
    }

    data.forEach((row, index) => {
      try {
        CSVSchema.parse({
          ...row,
          problem_order: Number(row.problem_order),
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          errors.push(`Row ${index + 1}: ${err.issues[0].message}`);
        }
      }
    });
    return errors;
  }

  async function submitCSVToSupabase() {
    if (csvData.length === 0) {
      toast.error("Please upload a valid CSV file first");
      return;
    }

    if (!name || !description) {
      toast.error("Test name and description are required");
      return;
    }

    isSubmitting = true;

    try {
      // 1. Create a new test
      const { data: testData, error: testError } = await insertTest({
        name,
        description,
        event_id: $page.params.event_id,
        // Add any other test properties you need
      });

      if (testError) throw testError;

      const testId = testData[0].id;

      // 2. Create problems from CSV data
      const problems = csvData.map((row) => ({
        test_id: testId,
        problem_latex: row.problem_latex,
        answer_latex: row.answer_latex,
        problem_number: row.problem_number,
      }));

      const { error: problemsError } = await supabase
        .from("problems")
        .insert(problems);

      if (problemsError) throw problemsError;

      // 3. Success handling
      toast.success("Test and problems successfully created!");

      // 4. Reset form
      name = "";
      description = "";
      csvData = [];
      fileUploaderKey++; // Reset file uploader

      // 5. Refresh tests list
      await getTests();
    } catch (error) {
      handleError(error);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleImgUpload(event: CustomEvent<{ files: FileList }>) {}
</script>

<br />
<h1>Add Test</h1>
<br />
<div>
  <form on:submit|preventDefault style="padding: 20px;">
    <TextInput
      bind:value={name}
      class="textInput"
      label="Test Name"
      placeholder="Test Name (required)"
      required
    />
    <br />
    <TextArea
      bind:value={description}
      label="Test Description"
      class="textArea"
      placeholder="Test Description (required)"
      required
    />
    <br />
    <div>
      <Checkbox labelText="Is this a team test?" />
    </div>
    <br />
    <div class="csv-container">
      <FileUploader
        key={fileUploaderKey}
        accept={[".csv"]}
        labelTitle="Upload CSV"
        labelDescription=".csv files only. Only one file will be accepted."
        buttonLabel="Add CSV file"
        on:add={handleCSVUpload}
        status={isUploading
          ? "loading"
          : csvErrors.length > 0
            ? "error"
            : "complete"}
        required
      />
      <!-- </div>
    <div class="img-container"> -->
      <FileUploader
        accept={[".txt"]}
        labelTitle="Upload Text File of Image Links"
        labelDescription=".txt files only. Only one file will be accepted."
        buttonLabel="Add .txt file"
        on:add={handleImgUpload}
        status={isUploading ? "uploading" : "complete"}
        required
      />
    </div>
    <br />
    <Button
      action={submitCSVToSupabase}
      title={isSubmitting ? "Creating Test..." : "Create Test"}
      disabled={isSubmitting || csvData.length === 0}
    />
  </form>
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

  button:disabled,
  button[disabled] {
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

  .csv-container {
    display: flex;
    justify-content: center;
    width: 100%;
    margin: 2rem 0;
  }

  .csv-upload-section {
    width: 80%;
    max-width: 800px;
    padding: 2rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .csv-upload-section {
    margin-bottom: 2rem;
    padding: 1rem;
    /* border: 1px solid #e0e0e0; */
    border-radius: 8px;
  }

  .validation-errors {
    width: 100%;
    max-width: 600px;
    margin: 1rem auto;
  }

  .csv-preview {
    margin: 1rem auto;
    max-width: 100%;
  }

  .csv-preview table {
    margin: 1rem auto;
  }

  .csv-preview th,
  .csv-preview td {
    padding: 0.5rem;
    /* border: 1px solid #e0e0e0; */
    text-align: left;
  }

  .csv-preview th {
    background-color: #f4f4f4;
  }
</style>
