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
    // Ensure content is not focusable
    makeUnfocusable();
  });
  
  run(() => {
    tex = renderMath(parser.parse(value));
    if (container) {
      container.innerHTML = tex;
      // Ensure content is not focusable after updates
      makeUnfocusable();
    }
  });
  
  // Make all elements inside unfocusable
  function makeUnfocusable() {
    if (!container) return;
    
    // Get all focusable elements
    const elements = container.querySelectorAll('*');
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.setAttribute('tabindex', '-1');
      }
    });
  }
</script>

<div bind:this={container} style="font-size: {size};" tabindex="-1"></div>
