<script lang="ts">
    import { Toast } from 'flowbite-svelte';
    import { CheckCircleSolid, CloseCircleSolid, ExclamationCircleSolid } from "flowbite-svelte-icons";
    import { slide } from 'svelte/transition';

    export let text: string;
    export let type: string = "Success";
    export let timer: number = 3;
    export let dismissable: boolean = false;

    let toastStatus = true;


    function timeout() {
        if (--timer > 0) return setTimeout(timeout, 1000);
        toastStatus = false;
    }
    timeout();
    
</script>

{#if type == "Success"}

    <Toast dismissable={dismissable} transition={slide} bind:toastStatus color="green">
        <svelte:fragment slot="icon">
        <CheckCircleSolid class="w-5 h-5" />
        <span class="sr-only">Check icon</span>
        </svelte:fragment>
        {text}
    </Toast>
{:else if type == "Error"}
    <Toast dismissable={dismissable} transition={slide} bind:toastStatus color="red">
        <svelte:fragment slot="icon">
        <CloseCircleSolid class="w-5 h-5" />
        <span class="sr-only">Error icon</span>
        </svelte:fragment>
        {text}
    </Toast>
{:else if type == "Warning"}
    <Toast dismissable={dismissable} transition={slide} bind:toastStatus color="red">
        <svelte:fragment slot="icon">
        <ExclamationCircleSolid class="w-5 h-5" />
        <span class="sr-only">Warning icon</span>
        </svelte:fragment>
        {text}
    </Toast>
{/if}

<style>
</style>
