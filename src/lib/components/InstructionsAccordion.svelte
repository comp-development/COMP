<script lang="ts">
  import CustomAccordion from "./CustomAccordion.svelte";
  import MathJax from "$lib/components/MathJax.svelte";

  export let instructions: string;
  export let title: string = "Test Instructions";
  export let open: boolean = true;
  export let onToggle: (isOpen: boolean) => void = () => {}; // Default no-op function
  
  function handleToggle(isOpen: boolean) {
    open = isOpen;
    onToggle(isOpen); // Call the callback directly
  }
  
  // Function to check if instructions exist and are not empty
  function hasInstructions(): boolean {
    return !!instructions && instructions.trim() !== '';
  }
</script>

{#if hasInstructions()}
  <CustomAccordion 
    {title} 
    {open}
    onClick={() => handleToggle(!open)}
  >
    <MathJax math={instructions} />
  </CustomAccordion>
{/if} 