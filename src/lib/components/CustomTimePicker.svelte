<script lang="ts">
  import { createEventDispatcher } from "svelte";

  // Props
  let {
    time = $bindable("12:00"),
    amPm = $bindable("am"),
    label = "Time",
    required = false,
    disabled = false,
    showLabel = true,
  } = $props();

  // Event dispatcher for custom events
  const dispatch = createEventDispatcher();

  // Format time for input (24-hour format)
  let inputValue = $state(formatTimeForInput(time, amPm));

  // Format time for input (convert 12-hour to 24-hour)
  function formatTimeForInput(timeStr: string, amPmStr: string): string {
    if (!timeStr) return "";
    
    let [hours, minutes] = timeStr.split(":").map(Number);
    
    // Convert to 24-hour format
    if (amPmStr === "pm" && hours < 12) {
      hours += 12;
    } else if (amPmStr === "am" && hours === 12) {
      hours = 0;
    }
    
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  // Handle time change
  function handleTimeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const timeValue = target.value;
    
    if (timeValue) {
      const [hours24, minutes] = timeValue.split(":").map(Number);
      
      // Convert to 12-hour format
      let hours12 = hours24 % 12;
      if (hours12 === 0) hours12 = 12;
      
      // Determine AM/PM
      const newAmPm = hours24 >= 12 ? "pm" : "am";
      
      // Update the time and amPm props
      time = `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      amPm = newAmPm;
      
      // Dispatch the time change event
      dispatch("timeChange", { 
        time,
        amPm,
        formattedTime: `${time} ${amPm}`
      });
    }
  }

  // Update the input value when time or amPm changes
  $effect(() => {
    inputValue = formatTimeForInput(time, amPm);
  });
</script>

<div class="mb-4">
  {#if showLabel}
    <label for="time-input" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
      {label} {#if required}<span class="text-red-500">*</span>{/if}
    </label>
  {/if}
  <div class="relative">
    <input
      id="time-input"
      type="time"
      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
      bind:value={inputValue}
      on:change={handleTimeChange}
      {disabled}
      {required}
    />
  </div>
</div>

<style>
  /* Style the time input to match Flowbite-Svelte components */
  input[type="time"] {
    appearance: none;
    -webkit-appearance: none;
    position: relative;
  }

  /* Remove the default time icon in some browsers */
  input[type="time"]::-webkit-calendar-picker-indicator {
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

  /* Add a custom clock icon */
  .relative::after {
    content: "";
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' /%3E%3C/svg%3E");
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