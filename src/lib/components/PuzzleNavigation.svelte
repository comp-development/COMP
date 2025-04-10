<script lang="ts">
  import Puzzle from "$lib/components/Puzzle.svelte";

  let selectedProblem = $state(0);

  let { puzzles = $bindable([]) } = $props();
</script>

<br />
<h1>Puzzles</h1>
<br />
<div class="row">
  <div>
    {#each puzzles as puzzle, index}
      <button
        class="problem_click"
        style="background-color: {index === selectedProblem
          ? 'var(--secondary-light)'
          : 'var(--primary-light)'};"
        onclick={() => {
          selectedProblem = index;
        }}>{index + 1}</button
      >
      <br />
    {/each}
  </div>
  <div>
    {#if puzzles.length != 0}
      <div style="border: 1px solid gray; border-radius: 10px; padding: 10px;">
        <h2>Problem {selectedProblem + 1}</h2>
        <p>Problem</p>
        <div style="justify-content: center; display:flex">
          <Puzzle
            puzzle={puzzles[selectedProblem]}
            editable={true}
            is_puzzle={true}
          />
        </div>
      </div>
      <br /><br />
    {:else}
      <p>No puzzle available</p>
    {/if}
  </div>

  
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: 10% auto;
    column-gap: 20px;
    padding: 20px;
    text-align: left;
  }

  .problem_click {
    width: 100%;
    border-radius: 50px;
    padding: 5px 10px;
    border: none;
    outline: none;
    margin-bottom: 10px;
  }

  button {
    background-color: #efefef;
    padding: 5px 10px;
    border: 1px solid black;
  }

  .grid {
    display: grid;
    grid-template-columns: 24% 24% 24% 24%;
    column-gap: 10px;
    row-gap: 10px;
  }

  .answerbox {
    padding: 10px;
    border-radius: 5px;
    display: grid;
    grid-template-columns: 75% 25%;
    min-height: 50px;
  }

  .answer {
    overflow-x: scroll;
    overflow-y: hidden;
  }

  .arrow-button {
    padding: 0px;
    cursor: pointer;
    background-color: transparent;
    border: none;
    margin-left: 2px;
  }
</style>
