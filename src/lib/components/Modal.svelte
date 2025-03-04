<script>
  import { Modal } from "flowbite-svelte";

  let {
    open = $bindable(),
    size = "md",
    autoclose = true,
    outsideclose = false,
    classBody = "overflow-y-auto max-h-[80vh] text-center",
  } = $props();
</script>

<Modal bind:open={open} {size} {autoclose} {outsideclose} {classBody}>
  <slot />
</Modal>
