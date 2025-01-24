<script lang="ts">
  import Toast from "$lib/components/Toast.svelte";
  import toast from "$lib/toast.svelte";
  import type { Writable } from "svelte/store";

  let messages: [
    number,
    {
      status: "success" | "error" | "warning";
      message: string;
      toastStatus: Writable<boolean>;
    },
  ][] = $state([]);

  toast.subscribe(() => {
    messages = [...toast.messages.entries()];
  });

</script>

<div style={`position: fixed; top: 10px; right: 10px;`}>
{#each messages.toReversed() as [_, data]}
    <Toast dismissable={true} {...data}></Toast>
{/each}
</div>

<style>
</style>
