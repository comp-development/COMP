<script>
  import Puzzle from "$lib/components/Puzzle.svelte";

  let selectedProblem = $state(0);
  let { puzzles = $bindable([]), isAdmin = $bindable(false) } = $props();

  async function updatePuzzle() {
    //to be implemented
  }
</script>

<br />
<h1>Puzzle</h1>
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
    <div style="border: 1px solid gray; border-radius: 10px; padding: 10px;">
      <h3>Problem {selectedProblem + 1}</h3>
      <p>Problem</p>
      {#if isAdmin}
        <Puzzle puzzle={puzzles[selectedProblem].puzzle} />
        <h2>Solution</h2>
        <p>
          This is modifiable, and will directly change the solution stored in
          the database.
        </p>
        <Puzzle
          puzzle={puzzles[selectedProblem].solution}
          onChange={updatePuzzle}
        />
      {:else}
        <div style="justify-content: center; display:flex">
          <Puzzle
            puzzle={puzzles[selectedProblem]}
            editable={true}
            is_puzzle={true}
          />
        </div>
      {/if}
      <br />
      <p>Answer</p>
      <div>Answer {selectedProblem + 1}</div>
    </div>
    <br /><br />
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

  h3,
  p {
    font-weight: bold;
  }

  h3 {
    font-size: 24px;
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
