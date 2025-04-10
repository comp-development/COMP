<script lang="ts">
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let title: string = "Accordion Title";
  export let open: boolean = true;
  export let onClick: () => void = () => {}; // Default no-op function

  function toggleAccordion() {
    open = !open;
    onClick(); // Call the callback directly
  }
</script>

<div class="accordion">
  <button 
    class="accordion-header" 
    on:click={toggleAccordion}
    aria-expanded={open}
    type="button"
  >
    <span class="header-text font-medium">{title}</span>
    <svg 
      class="accordion-icon" 
      class:rotate={open} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 20 20" 
      fill="currentColor"
    >
      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
    </svg>
  </button>
  
  {#if open}
    <div 
      class="accordion-content" 
      transition:slide={{ duration: 300, easing: quintOut }}
    >
      <div class="p-4">
        <slot></slot>
      </div>
    </div>
  {/if}
</div>

<style>
  .accordion {
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .accordion-header {
    width: 100%;
    border-radius: 0.75rem;
    background-color: white;
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #e5e7eb;
    color: #333;
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s, border-radius 0.2s;
  }

  .accordion-header:hover {
    background-color: #f9fafb;
  }
  
  .accordion-header:focus {
    outline: 2px solid var(--primary, #3f9656);
    outline-offset: 2px;
  }
  
  .accordion-header[aria-expanded="true"] {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom-color: transparent;
    background-color: var(--primary-tint, #e6f2ea);
  }

  .header-text {
    margin-right: 1rem;
  }
  
  .accordion-icon {
    color: var(--primary, #3f9656);
    width: 20px;
    height: 20px;
    transition: transform 0.3s;
  }
  
  .rotate {
    transform: rotate(180deg);
  }

  .accordion-content {
    background-color: white;
    border-radius: 0 0 0.75rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-top: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
</style> 