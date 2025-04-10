<script lang="ts">
  import Puzzle from "$lib/components/Puzzle.svelte";

  let { puzzle = $bindable() } = $props();

  function updateJson() {
    //do nothing
    console.log("hello");
  }
</script>

<Puzzle bind:puzzle is_puzzle={true} onChange={updateJson} />