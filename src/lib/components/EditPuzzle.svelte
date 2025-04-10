<script lang="ts">
  import Puzzle from "$lib/components/Puzzle.svelte";
  import {
    TableRowSolid,
    TableColumnSolid,
    CodePullRequestSolid,
    KeyboardSolid,
    TrashBinSolid
  } from "flowbite-svelte-icons";

  let {
    puzzle = $bindable(),
    is_solution = false,
    handleReplaceSolution = () => {},
  } = $props();

  function updateJson() {
    //do nothing
    console.log("hello");
  }
</script>

<div style="display: flex; gap: 5px;">
  <div class="tooltip-container">
    <button class="test-button empty" onclick={() => {}}>
      <TableRowSolid class="w-5 h-5 icon" />
    </button>
    <span class="tooltip">Add Row</span>
  </div>

  <div class="tooltip-container">
    <button class="test-button empty" onclick={() => {}}>
      <TableColumnSolid class="w-5 h-5 icon" />
    </button>
    <span class="tooltip">Add Column</span>
  </div>

  <div class="tooltip-container">
    <button class="test-button empty" onclick={() => {}}>
      <KeyboardSolid class="w-5 h-5 icon" />
    </button>
    <span class="tooltip">Add Text</span>
  </div>

  <div class="tooltip-container">
    <button class="test-button empty" onclick={() => {}}>
      <KeyboardSolid class="w-5 h-5 icon" />
    </button>
    <span class="tooltip">Add Surface</span>
  </div>

  <div class="tooltip-container">
    <button class="test-button empty" onclick={() => {}}>
      <KeyboardSolid class="w-5 h-5 icon" />
    </button>
    <span class="tooltip">Edit Notepad Version</span>
  </div>

  <div class="tooltip-container">
    <button class="test-button empty" onclick={() => {}}>
      <KeyboardSolid class="w-5 h-5 icon" />
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

<Puzzle bind:puzzle is_puzzle={true} onChange={updateJson} />
