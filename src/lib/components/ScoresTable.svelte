<script lang="ts">
  import { onMount } from "svelte";
  import { getGradedTestAnswers, getTestTakers } from "$lib/supabase/";
  import SortAscending from "carbon-icons-svelte/lib/SortAscending.svelte";
  import SortDescending from "carbon-icons-svelte/lib/SortDescending.svelte";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";
  import CloseLarge from "carbon-icons-svelte/lib/CloseLarge.svelte";
  import { Chart, registerables } from "chart.js";
  import ChartDataLabels from "chartjs-plugin-datalabels"; // Import the data labels plugin
  import ChartAnnotation from "chartjs-plugin-annotation"; // Import the annotation plugin
  import { supabase } from "$lib/supabaseClient";
  Chart.register(...registerables);

  let { test } = $props();
  let testTakersMap = $state({});
  let sortColumn = $state("");
  let sortOrder = $state("asc");
  let problemChartInstance;
  let histogramChartInstance;

  let chartData = {
    labels: Array.from({ length: test.num_problems }, (_, i) => `${i + 1}`),
    datasets: [
      { label: "Correct", data: [], backgroundColor: "rgba(76, 175, 80, 0.6)" },
      { label: "Wrong", data: [], backgroundColor: "rgba(244, 67, 54, 0.6)" },
      {
        label: "Ungraded",
        data: [],
        backgroundColor: "rgba(255, 193, 7, 0.6)",
      },
      { label: "Blank", data: [], backgroundColor: "rgba(158, 158, 158, 0.6)" },
    ],
  };

  onMount(async () => {
    await fetchTestTakers();
    await updateTable();
    setInterval(updateTable, 5000);
  });

  async function fetchTestTakers() {
    const testTakers = await getTestTakers(test.test_id, true);
    testTakers.forEach((obj) => {
      testTakersMap[obj.test_taker_id] = obj;
    });
  }

  async function updateTable() {
    const data = await getGradedTestAnswers(test.test_id);



    data.forEach((obj) => {
      testTakersMap[obj.test_taker_id][obj.test_problem_number] = { ...obj };
    });
    Object.values(testTakersMap).forEach((testTaker) => {
      const totalPoints = Object.keys(testTaker).reduce((sum, key) => {
        return sum + (testTaker[key]?.points || 0);
      }, 0);
      testTaker.points = totalPoints;
    });
    updateChartData();
    updateHistogramData();
  }

  function exportToCSV() {
    const rows = [];
    const headers = [
      "Front ID",
      "Taker Name",
      "Start Time",
      "Points",
      ...Array.from({ length: test.num_problems }, (_, i) => `A${i + 1}`),
      ...Array.from({ length: test.num_problems }, (_, i) => `C${i + 1}`),
      ...Array.from({ length: test.num_problems }, (_, i) => `P${i + 1}`),
      ...Array.from({ length: test.num_problems }, (_, i) => `T${i + 1}`),
      ...Array.from({ length: test.num_problems }, (_, i) => `ST${i + 1}`),
    ];
    rows.push(headers.join(","));

    Object.values(testTakersMap).forEach((testTaker) => {
      if (testTaker.front_id == "MM12") {
        console.log(testTaker.front_id, testTaker);
        console.log(testTaker[1]?.correct ? 1 : 0 || 0);
      }
      const totalPoints = Object.keys(testTaker).reduce((sum, key) => {
        return sum + (testTaker[key]?.points || 0);
      }, 0);
      const row = [
        `"${testTaker.front_id}"`,
        `"${testTaker.taker_name}"`,
        `"${testTaker.start_time}"`,
        totalPoints,
        ...Array.from(
          { length: test.num_problems },
          (_, i) =>
            `"${String(testTaker[i + 1]?.answer_latex || "").replace(/"/g, '""')}"`,
        ),
        ...Array.from({ length: test.num_problems }, (_, i) =>
          testTaker[i + 1]?.correct ? 1 : 0 || 0,
        ),
        ...Array.from(
          { length: test.num_problems },
          (_, i) => testTaker[i + 1]?.points || 0,
        ),
        ...Array.from(
          { length: test.num_problems },
          (_, i) => testTaker[i + 1]?.last_updated || "",
        ),
        ...Array.from(
          { length: test.num_problems },
          (_, i) =>
          testTaker[i + 1]?.last_edited_time || "",
        ),
      ];
      if (testTaker.front_id == "MM12") {
        console.log(row);
      }
      rows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", test.test_name + " scores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getCellValue(entry) {
    if (!entry || !entry.answer_latex)
      return { style: "color:#a7a7a7; background-color:white", value: "—" };
    if (entry.correct === null)
      return { style: "color:#eebc69; background-color:#f8ebcc", value: "?" };
    return entry.correct
      ? { style: "color:#5f974a; background-color:#d3f4d8", value: "✓" }
      : { style: "color:#e45e52; background-color:#f4d8d8", value: "✗" };
  }

  function sortTable(column) {
    if (sortColumn === column) {
      if (sortOrder === "asc") {
        sortOrder = "desc";
      } else if (sortOrder === "desc") {
        sortColumn = ""; // Remove sorting
        sortOrder = "asc"; // Reset order
      } else {
        sortColumn = column; // Set to current column
        sortOrder = "asc"; // Default to ascending
      }
    } else {
      sortColumn = column;
      sortOrder = "asc";
    }

    // Sort logic
    const sortedTakers = Object.values(testTakersMap).sort((a, b) => {
      if (column === "front_id" || column === "taker_name") {
        return sortOrder === "asc"
          ? a[column].localeCompare(b[column])
          : b[column].localeCompare(a[column]);
      } else if (column === "points") {
        return sortOrder === "asc"
          ? (a.points || 0) - (b.points || 0)
          : (b.points || 0) - (a.points || 0);
      } else {
        const order = { "✓": 0, "?": 1, "—": 2, "✗": 3 };
        return sortOrder === "asc"
          ? order[getCellValue(a[column]).value] -
              order[getCellValue(b[column]).value]
          : order[getCellValue(b[column]).value] -
              order[getCellValue(a[column]).value];
      }
    });

    sortedTakers.forEach((taker, index) => {
      taker.order = index; // Assigning order based on sorted position
    });

    testTakersMap = Object.fromEntries(
      sortedTakers.map((taker) => [taker.test_taker_id, taker]),
    );
  }

  function updateHistogramData() {
    const points = Object.values(testTakersMap).map(
      (taker) => taker.points || 0,
    );
    const frequency = Array.from({ length: Math.max(...points) + 1 }, () => 0);

    points.forEach((point) => {
      frequency[point]++;
    });

    const density = frequency.map((freq, index) => freq / points.length); // Calculate density

    if (histogramChartInstance) {
      histogramChartInstance.data.datasets[0].data = frequency;
      histogramChartInstance.data.datasets[1].data = density;
      histogramChartInstance.update();
    } else {
      const ctx = document.getElementById("histogramChart").getContext("2d");
      histogramChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: Array.from({ length: frequency.length }, (_, i) => i),
          datasets: [
            {
              label: "Frequency",
              data: frequency,
              backgroundColor: "rgba(76, 175, 80, 0.6)",
            },
            {
              label: "Density",
              data: density,
              type: "line",
              borderColor: "rgba(244, 67, 54, 0.6)",
              fill: false,
              yAxisID: "density",
            },
          ],
        },
        options: {
          scales: {
            y: {
              title: {
                display: true,
                text: "Frequency",
              },
            },
            density: {
              type: "linear",
              position: "right",
              title: {
                display: true,
                text: "Density",
              },
              grid: {
                drawOnChartArea: false,
              },
            },
          },
          plugins: {
            datalabels: {
              anchor: "end",
              align: "end",
            },
          },
        },
      });
    }
  }

  function updateChartData() {
    const correctCounts = new Array(test.num_problems).fill(0);
    const wrongCounts = new Array(test.num_problems).fill(0);
    const ungradedCounts = new Array(test.num_problems).fill(0);
    const blankCounts = new Array(test.num_problems).fill(0);

    Object.values(testTakersMap).forEach((testTaker) => {
      for (let i = 1; i <= test.num_problems; i++) {
        const entry = testTaker[i];
        if (entry) {
          if (entry.correct == true) correctCounts[i - 1]++;
          else if (entry.correct == false) wrongCounts[i - 1]++;
          else if (!entry.answer_latex || entry.answer_latex.trim() == "")
            blankCounts[i - 1]++;
          else ungradedCounts[i - 1]++;
        } else {
          blankCounts[i - 1]++;
        }
      }
    });
    chartData.datasets[0].data = correctCounts;
    chartData.datasets[1].data = wrongCounts;
    chartData.datasets[2].data = ungradedCounts;
    chartData.datasets[3].data = blankCounts;

    if (problemChartInstance) {
      problemChartInstance.data.datasets[0].data = correctCounts;
      problemChartInstance.data.datasets[1].data = wrongCounts;
      problemChartInstance.data.datasets[2].data = ungradedCounts;
      problemChartInstance.data.datasets[3].data = blankCounts;
      problemChartInstance.update(); // Animate the transition
    } else {
      const ctx = document.getElementById("scoresChart").getContext("2d");
      problemChartInstance = new Chart(ctx, {
        type: "bar",
        data: chartData,
        options: {
          scales: {
            x: {
              stacked: true,
              title: {
                display: true,
                text: "Problem #",
              },
            },
            y: {
              stacked: true,
              title: {
                display: true,
                text: "Taker Count",
              },
            },
          },
        },
      });
    }
  }
</script>

<div>
  <h2 style="text-align: center">Scores</h2>
  <button onclick={exportToCSV}>Export to CSV</button>
  <table class="scoresTable">
    <thead>
      <tr>
        <th onclick={() => sortTable("front_id")}>
          Front ID
          {#if sortColumn === "front_id"}
            {#if sortOrder === "asc"}
              <SortAscending />
            {:else if sortOrder === "desc"}
              <SortDescending />
            {/if}
          {/if}
        </th>
        <th onclick={() => sortTable("taker_name")}>
          Taker Name
          {#if sortColumn === "taker_name"}
            {#if sortOrder === "asc"}
              <SortAscending />
            {:else}
              <SortDescending />
            {/if}
          {/if}
        </th>
        <th onclick={() => sortTable("points")}>
          Points
          {#if sortColumn === "points"}
            {#if sortOrder === "asc"}
              <SortAscending />
            {:else}
              <SortDescending />
            {/if}
          {/if}
        </th>
        {#each { length: test.num_problems } as _, i}
          <th onclick={() => sortTable(i + 1)}>
            Problem {i + 1}
            {#if sortColumn === i + 1}
              {#if sortOrder === "asc"}
                <SortAscending />
              {:else}
                <SortDescending />
              {/if}
            {/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each Object.values(testTakersMap).sort((a, b) => a.order - b.order) as testTaker}
        <tr>
          <td>{testTaker.front_id}</td>
          <td>{testTaker.taker_name}</td>
          <td>{testTaker.points || 0}</td>
          {#each { length: test.num_problems } as _, i}
            {@const cell = getCellValue(testTaker[i + 1])}
            <td
              style="font-size: 2em; {cell.style}; justify-content: center; align-items: center; height: 100%; min-height: 50px"
              ><b>{cell.value}</b></td
            >
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<canvas id="scoresChart"></canvas>
<canvas id="histogramChart"></canvas>

<style>
  .scoresTable {
    width: 100%;
    border-collapse: collapse;
  }
  .scoresTable th,
  .scoresTable td {
    border: 1px solid #000;
    padding: 8px;
    text-align: center;
  }
  .scoresTable th {
    background-color: var(--primary);
    color: white;
  }
  canvas {
    max-width: 100%;
    height: 400px;
  }
</style>
