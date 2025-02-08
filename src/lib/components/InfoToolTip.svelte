<script lang="ts">
    import { Popover } from "flowbite-svelte";
    import { QuestionCircleSolid } from "flowbite-svelte-icons";

    let { text } = $props();
    
    // Generate a unique ID for each instance
    const uniqueId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="flex mr-2">
    <button id={uniqueId}>
        <QuestionCircleSolid class="w-5 h-5 ms-1.5" />
        <span class="sr-only">Show information</span>
    </button>
</div>
<Popover
    triggeredBy="#{uniqueId}"
    class="w-72 text-sm bg-white font-normal"
>
    <div class="p-3">
        {text}
    </div>
</Popover>
