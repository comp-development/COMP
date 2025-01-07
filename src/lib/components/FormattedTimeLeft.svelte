<script>
    import { formatDuration } from "$lib/dateUtils";
    export let timeLeft; // in seconds
    export let totalTime; // in seconds
    let time;
  
    // Calculate color based on the proportion of timeLeft to totalTime
    $: timeLeft = Math.max(timeLeft, 0)
    $: proportion = timeLeft / totalTime;
    $: color = `rgb(${Math.round(255 * (1 - proportion))}, 0, 0)`; // Red intensity increases as timeLeft decreases
  
    // Format the timeLeft using the provided formatDuration function
    $: time = formatDuration(timeLeft);
  </script>
  
  <div class="formatted-duration" style="color: {color};">
    <slot prop={time}>{time}</slot> <!-- Pass formattedTime directly to the slot -->
</div>
  