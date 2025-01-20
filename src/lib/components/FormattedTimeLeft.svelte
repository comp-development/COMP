<script lang="ts">
  import { run } from 'svelte/legacy';

    import { formatDuration } from "$lib/dateUtils";
  let { timeLeft = $bindable(), totalTime, children } = $props();
    let time = $derived(formatDuration(timeLeft));
  
    // Calculate color based on the proportion of timeLeft to totalTime
    run(() => {
    timeLeft = Math.max(timeLeft, 0)
  });
    let proportion = $derived(timeLeft / totalTime);
    let color = $derived(`rgb(${Math.round(255 * (1 - proportion))}, 0, 0)`); // Red intensity increases as timeLeft decreases
  
    // Format the timeLeft using the provided formatDuration function
    
  </script>
  
  <div class="formatted-duration" style="color: {color};">
    {#if children}{@render children({ prop: time, })}{:else}{time}{/if} <!-- Pass formattedTime directly to the slot -->
</div>
  