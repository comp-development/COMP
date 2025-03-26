<script lang="ts">
  import CustomDatePicker from "./CustomDatePicker.svelte";
  import CustomTimePicker from "./CustomTimePicker.svelte";
  import { createEventDispatcher } from "svelte";

  // Props
  let {
    date = $bindable(new Date()),
    time = $bindable("12:00"),
    amPm = $bindable("am"),
    dateLabel = "Date",
    timeLabel = "Time",
    showNowButton = true,
    required = false,
    disabled = false,
  } = $props();

  // Event dispatcher for custom events
  const dispatch = createEventDispatcher();

  // Store formatted date string
  let formattedDate = "";

  // Handle date change
  function handleDateChange(event: CustomEvent) {
    date = event.detail.date;
    formattedDate = event.detail.formattedDate;
    dispatchDateTime();
  }

  // Handle time change
  function handleTimeChange(event: CustomEvent) {
    time = event.detail.time;
    amPm = event.detail.amPm;
    dispatchDateTime();
  }

  // Set current date and time
  function setNow() {
    const now = new Date();
    date = now;
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Format time as HH:MM
    time = `${String(hours % 12 || 12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    amPm = hours >= 12 ? "pm" : "am";
    
    // Format date for display
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = now.getFullYear();
    formattedDate = `${month}/${day}/${year}`;
    
    dispatchDateTime();
  }

  // Format date for display
  function formatDateForDisplay(dateObj: Date): string {
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${month}/${day}/${year}`;
  }

  // Dispatch combined date and time
  function dispatchDateTime() {
    if (!formattedDate && date) {
      formattedDate = formatDateForDisplay(date);
    }
    
    dispatch("dateTimeChange", {
      date,
      formattedDate,
      time,
      amPm,
      formattedDateTime: `${formattedDate} ${time} ${amPm}`
    });
  }

  // Initialize formatted date on component mount
  $effect(() => {
    if (date && !formattedDate) {
      formattedDate = formatDateForDisplay(date);
    }
  });
</script>

<div class="date-time-picker">
  <CustomDatePicker 
    bind:value={date} 
    label={dateLabel}
    {required}
    {disabled}
    on:dateChange={handleDateChange}
  />
  
  <CustomTimePicker 
    bind:time
    bind:amPm
    label={timeLabel}
    {required}
    {disabled}
    on:timeChange={handleTimeChange}
  />
  
  {#if showNowButton}
    <div class="mb-4">
      <button 
        class="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
        on:click={setNow}
        type="button"
        {disabled}
      >
        Set to Current Time
      </button>
    </div>
  {/if}
</div>

<style>
  .date-time-picker {
    display: flex;
    flex-direction: column;
  }
</style> 