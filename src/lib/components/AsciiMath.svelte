<script lang="ts">
  import { run } from "svelte/legacy";

  import { math } from "mathlifier";
  import AsciiMathParser from "asciimath2tex";
  import { onMount } from "svelte";

  const parser = new AsciiMathParser();
  interface Props {
    value?: string;
    size?: string;
  }

  let { value = "", size = "1.2em" }: Props = $props();

  let tex = $state("");
  let container = $state();

  function renderMath(texString) {
    const parsed = math(texString);
    return parsed.includes("ParseError") ? value : parsed;
  }

  onMount(() => {
    container.innerHTML = tex;
  });
  run(() => {
    tex = renderMath(parser.parse(value));
    if (container) {
      container.innerHTML = tex;
    }
  });
</script>

<div bind:this={container} style="font-size: {size};"></div>
