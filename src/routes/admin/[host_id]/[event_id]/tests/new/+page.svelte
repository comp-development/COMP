<script lang="ts">
  import { run } from "svelte/legacy";
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
    upsertTest,
    upsertTestProblems,
    upsertProblems,
    upsertIntoBucket,
    getTest,
    getTestFromComposeId,
    getProblem,
    getProblemFromComposeID,
  } from "$lib/supabase";
  import { get } from "svelte/store";
  // import { Checkbox } from "flowbite-svelte";

  let loading = $state(true);

  let open = $state(false);
  let instructions = "";
  // let name = "";
  // let description = "";
  // let isTeamTest = false;
  let uploadedFile = $state(null);
  let testData: {
    tests: any[];
    test_problems: any[];
    problem_images: any[];
    problems: any[];
  } = {
    tests: [],
    test_problems: [],
    problem_images: [],
    problems: [],
  };
  let isUploading = $state(false);

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

  function validateJson(jsonData: JSON) {
    const requiredHeaders = [
      "tests",
      "test_problems",
      "problem_images",
      "problems",
    ];
    const errors = [];

    // Check if each required header exists in the JSON data
    for (const header of requiredHeaders) {
      if (!jsonData.hasOwnProperty(header)) {
        errors.push(`Missing required header: "${header}"`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  async function handleFileUpload(event) {
    console.log("Handling file upload...");
    isUploading = true;

    const file = event.detail[0];
    if (!file) {
      isUploading = false;
      return;
    }

    try {
      // Read the file as text
      const fileText = await file.text();

      // Parse the JSON
      const jsonData = JSON.parse(fileText);

      // Validate the JSON structure
      const validation = validateJson(jsonData);

      if (!validation.isValid) {
        toast.error(
          "Invalid JSON structure. Please check the file and try again."
        );
        uploadedFile = null; // Clear the file if validation fails
      } else {
        console.log("JSON file validated successfully!");
        // Store the validated data
        testData = jsonData;
        uploadedFile = file; // Set the uploaded file
        toast.success("File uploaded and validated successfully!");
      }
    } catch (error) {
      toast.error("Error parsing JSON file: " + error.message);
      uploadedFile = null; // Clear the file if there's an error
    } finally {
      isUploading = false;
    }
  }

  // Handle basic LaTeX commands like \emph, \item, and \begin{enumerate}
  function convertLaTeXtoHTML(input) {
    // Replace \emph{...} with <em>...</em>
    input = input.replace(/\\emph\{(.*?)\}/g, "<em>$1</em>");

    // Replace \item ... with <li>...</li> — line-based
    // input = input.replace(/^\\item\s*(.*)$/gm, "<li>$1</li>");

    // Replace \begin{enumerate}... \end{enumerate} with <ol>...</ol>
    // We assume it contains multiple lines inside and we want to extract only the content
    // input = input.replace(
    //   /\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
    //   "<ol>$1</ol>"
    // );

    return input;
  }

  async function handleSubmit(event) {
    event.preventDefault(); // Ensure default form submission is prevented

    if (!uploadedFile) {
      toast.error("Please complete all fields and upload a file.");
      return;
    }

    console.log("Handling submit...");

    let event_id = $page.params.event_id;

    try {
      // Reformat test data
      testData.tests = testData.tests.map((test) => ({
        event_id: event_id,
        test_name: test.test_name,
        is_team: test.is_team,
        instructions: test.test_description,
        compose_test_id: test.id,
        visible: false,
        compose_tournament_id: test.tournament_id,
      }));

      // Upsert test data into Supabase
      console.log("Upserting test data: ", JSON.stringify(testData.tests));
      // console.log(typeof testData.tests);
      const { data, error } = await upsertTest(testData.tests);
      if (error) {
        console.error("COOOOOOKED. Error upserting test data:", error);
        throw new Error("Error uploading test data: " + error.message);
      }

      // Format and upsert problems
      console.log("Upserting problems data");

      testData.problems = Object.values(testData.problems).map((problem) => ({
        problem_latex: convertLaTeXtoHTML(problem.problem_latex),
        answer_latex: problem.answer_latex,
        solution_latex: problem.solution_latex,
        answer_type: "AsciiMath",
        host_id: $page.params.host_id,
        compose_problem_id: problem.id,
      }));
      // const problem_ids = testData.problems
      //   .map((problem) => problem.compose_problem_id)
      //   .sort((a, b) => a - b);
      // console.log("Problem IDs:", problem_ids);
      // console.log("HOST ID here:", $page.params.host_id);
      // console.log(testData.problems[1]);
      console.log("Upserting problems data: ", testData.problems);
      const { data: problemsData, error: problemsError } = await upsertProblems(
        testData.problems
      );
      if (problemsError) {
        console.error("COOOOOOKED. Error upserting problems data:", error);
        throw new Error(
          "Error uploading problems data: " + problemsError.message
        );
      }
      // log success
      console.log("Problems data upserted successfully:", problemsData);

      // Format test_problems data
      testData.test_problems = await Promise.all(
        testData.test_problems.map(async (test_problem) => {
          const test = await getTestFromComposeId(test_problem.test_id);
          const problem = await getProblemFromComposeID(
            test_problem.problem_id
          );
          return {
            test_id: test.test_id,
            problem_id: problem.problem_id,
            problem_number: test_problem.problem_number + 1,
            points: test_problem.problem_weights || 0,
          };
        })
      );

      // Upsert test_problems
      console.log("Upserting test problems data");
      const { data: testProblemsData, error: testProblemsError } =
        await upsertTestProblems(testData.test_problems);
      if (testProblemsError) {
        console.error(
          "COOOOOOKED. Error upserting test problems data:",
          testProblemsError
        );
        throw new Error(
          "Error uploading test problems data: " + testProblemsError.message
        );
      }

      // Upsert problem_images
      console.log("Upserting problem images data");
      const { data: problemImagesData, error: problemImagesError } =
        await upsertIntoBucket($page.params.host_id, testData.problem_images);
      if (problemImagesError) {
        console.error(
          "COOOOOOKED. Error upserting problem images data:",
          problemImagesError
        );
        throw new Error(
          "Error uploading problem images data: " + problemImagesError.message
        );
      }

      toast.success("Tests uploaded successfully!");
    } catch (error) {
      console.error("COOOOOOKED. Error in handleSubmit:", error);
      handleError(error); // Log and display errors
      toast.error(error.message);
    }
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
</script>

<h1>Add Tests</h1>
<div>
  <form on:submit={handleSubmit} style="padding: 20px;">
    <div class="file-upload-container">
      <FileUploader
        accept={[".json"]}
        labelTitle="Upload JSON File"
        labelDescription=".json files only. Only one file will be accepted."
        buttonLabel="Add JSON file"
        on:change={handleFileUpload}
        status={isUploading ? "loading" : uploadedFile ? "complete" : "edit"}
        maxFiles={1}
        required
      />
    </div>
    <br />

    <!-- Submit Button -->
    <Button title="Submit Form" disabled={!uploadedFile || isUploading} />
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
