<script lang="ts">
  import { Modal, Button } from "flowbite-svelte";

  export let isShown = false;
  export let actionName = "Are you sure?";
  export let warning = null;
  export let color = "red";
  export let onCancel = () => {};
  export let onConfirm = () => {};
</script>

<Modal bind:open={isShown} size="sm" autoclose={false}>
  <div class="text-center">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
      Are you sure you want to {actionName}?
    </h3>
    {#if warning}
      <p class="text-sm text-gray-600 dark:text-gray-400">{warning}</p>
    {/if}
    <br />
    <div class="flex justify-center gap-4">
      <Button color="alternative" onclick={onCancel}>Cancel</Button>
      <Button {color} onclick={onConfirm}>Confirm</Button>
    </div>
  </div>
</Modal>
