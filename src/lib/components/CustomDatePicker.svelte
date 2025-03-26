<script lang="ts">
  import { createEventDispatcher } from "svelte";

  // Props
  let {
    value = $bindable(),
    label = "Date",
    required = false,
    disabled = false,
    showLabel = true,
    min = "",
    max = "",
    placeholder = "",
  } = $props();

  // Event dispatcher for custom events
  const dispatch = createEventDispatcher();

  // Format date as YYYY-MM-DD for the input value
  let inputValue = $state("");
  
  // Update inputValue whenever value changes
  $effect(() => {
    inputValue = formatDateForInput(value);
  });

  // Format date for input (YYYY-MM-DD)
  function formatDateForInput(date: Date | null | undefined): string {
    if (!date) return "";
    
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  }

  // Format date as MM/DD/YYYY for the output
  function formatDateForOutput(dateString: string): string {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}/${year}`;
  }

  // Handle date change
  function handleDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const dateString = target.value;
    
    if (!dateString) {
      value = undefined;
      dispatch("dateChange", { date: null, formattedDate: "" });
      return;
    }
    
    try {
      // Update the value prop with a Date object
      const [year, month, day] = dateString.split("-").map(Number);
      const newDate = new Date(year, month - 1, day);
      
      // Check if the date is valid
      if (isNaN(newDate.getTime())) {
        console.error("Invalid date created:", dateString);
        return;
      }
      
      value = newDate;
      
      // Format the date as MM/DD/YYYY for the output
      const formattedDate = formatDateForOutput(dateString);
      
      // Dispatch the date change event
      dispatch("dateChange", { 
        date: newDate,
        formattedDate: formattedDate
      });
    } catch (e) {
      console.error("Error processing date change:", e);
    }
  }
</script>

<div class="mb-4">
  {#if showLabel}
    <label for="date-input" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
      {label} {#if required}<span class="text-red-500">*</span>{/if}
    </label>
  {/if}
  <div class="relative">
    <input
      id="date-input"
      type="date"
      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
      bind:value={inputValue}
      on:change={handleDateChange}
      on:blur
      {disabled}
      {required}
      {min}
      {max}
      {placeholder}
    />
  </div>
</div>

<style>
  /* Style the date input to match Flowbite-Svelte components */
  input[type="date"] {
    appearance: none;
    -webkit-appearance: none;
    position: relative;
  }

  /* Remove the default calendar icon in some browsers */
  input[type="date"]::-webkit-calendar-picker-indicator {
    background: transparent;
    color: transparent;
    cursor: pointer;
    height: 100%;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
  }

  /* Add a custom calendar icon */
  .relative::after {
    content: "";
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z' /%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-size: contain;
    pointer-events: none;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .relative::after {
      filter: invert(1);
    }
  }
</style> 