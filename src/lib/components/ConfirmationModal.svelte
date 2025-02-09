<script lang="ts">
    import { Modal, Button } from "flowbite-svelte";

    export let isShown = false;
    export let actionName = "this action";
    export let color = "red";
    export let onCancel = () => {};
    export let onConfirm = () => {};
</script>

<Modal bind:open={isShown} size="sm" autoclose={false}>
    <div class="text-center">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Do you want to confirm "{actionName}"?
        </h3>
        <br />
        <div class="flex justify-center gap-4">
            <Button color="alternative" on:click={onCancel}>Cancel</Button>
            <Button color={color} on:click={onConfirm}>Confirm</Button>
        </div>
    </div>
</Modal>
