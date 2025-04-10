<script lang="ts">
  import Puzzle from "$lib/components/Puzzle.svelte";
  import {
    TableRowSolid,
    TableColumnSolid,
    CodePullRequestSolid,
    KeyboardSolid,
    TrashBinSolid,
  } from "flowbite-svelte-icons";

  let {
    puzzle = $bindable(),
    is_solution = false,
    handleReplaceSolution = () => {},
  } = $props();

  function addRow() {
    const maxY = Math.max(...puzzle.map((item) => item.loc[0][1]));
    for (let x = 0; x <= Math.max(...puzzle.map((item) => item.loc[0][0])); x++) {
      puzzle.push({
        loc: [[x, maxY + 1]],
        type: "point",
        state: "true",
      });
    }
  }

  function addColumn() {
    const maxX = Math.max(...puzzle.map((item) => item.loc[0][0]));
    for (let y = 0; y <= Math.max(...puzzle.map((item) => item.loc[0][1])); y++) {
      puzzle.push({
        loc: [[maxX + 1, y]],
        type: "point",
        state: "true",
      });
    }
  }

  function addPoint(x, y) {
    puzzle.push({
      loc: [[x, y]],
      type: "point",
      state: "true",
    });
  }

  function addText(x, y, text) {
    puzzle.push({
      loc: [[x, y]],
      type: "text",
      state: text,
    });
  }

  function addSurface(points, color = "#bad6ff") {
    puzzle.push({
      loc: points,
      type: "surface",
      state: color,
    });
  }

  function deleteItem(index) {
    puzzle.splice(index, 1);
  }
</script>

<div style="display: flex; gap: 5px;">
  <div class="tooltip-container">
    <button class="test-button empty" onclick={addRow}>
      <TableRowSolid class="w-5 h-5 icon" />
    </button>
    <span class="tooltip">Add Row</span>
  </div>

  <div class="tooltip-container">
    <button class="test-button empty" onclick={addColumn}>
      <TableColumnSolid class="w-5 h-5 icon" />
    </button>
    <span class="tooltip">Add Column</span>
  </div>

  <div class="tooltip-container">
    <button
      class="test-button empty"
      onclick={() => addPoint(0, 0)}
    >
      <KeyboardSolid class="w-5 h-5 icon" />
    </button>
    <span class="tooltip">Add Point</span>
  </div>

  <div class="tooltip-container">
    <button
      class="test-button empty"
      onclick={() => addText(0, 0, "A")}
    >
      <KeyboardSolid class="w-5 h-5 icon" />
    </button>
    <span class="tooltip">Add Text</span>
  </div>

  <div class="tooltip-container">
    <button
      class="test-button empty"
      onclick={() => addSurface([[0, 0], [1, 0], [1, 1], [0, 1]])}
    >
      <KeyboardSolid class="w-5 h-5 icon" />
    </button>
    <span class="tooltip">Add Surface</span>
  </div>

  <div class="tooltip-container">
    <button
      class="test-button empty"
      onclick={() => deleteItem(0)}
    >
      <TrashBinSolid class="w-5 h-5 icon" />
    </button>
    <span class="tooltip">Delete Mode</span>
  </div>

  {#if is_solution}
    <div class="tooltip-container">
      <button class="test-button empty" onclick={handleReplaceSolution}>
        <CodePullRequestSolid class="w-5 h-5 icon" />
      </button>
      <span class="tooltip">Replace Solution with Puzzle</span>
    </div>
  {/if}
</div>

<Puzzle bind:puzzle is_puzzle={true} isAdmin={true} onChange={() => {}} />
