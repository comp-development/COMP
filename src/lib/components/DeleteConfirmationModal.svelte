<script lang="ts">
  import { Modal, Button } from "flowbite-svelte";

  export let isShown = false;
  export let title = "Delete Item";
  export let message = "Are you sure you want to delete this item? This action cannot be undone.";
  export let confirmText = "Delete";
  export let cancelText = "Cancel";
  export let onCancel = () => {};
  export let onConfirm = () => {};
</script>

<Modal bind:open={isShown} size="sm" autoclose={false}>
  <div class="text-center">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
    <div class="flex justify-center gap-4">
      <Button color="alternative" on:click={onCancel}>{cancelText}</Button>
      <Button color="red" on:click={onConfirm}>{confirmText}</Button>
    </div>
  </div>
</Modal> 