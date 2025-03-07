<script lang="ts">
  import { Toast } from "flowbite-svelte";
  import {
    CheckCircleSolid,
    CloseCircleSolid,
    ExclamationCircleSolid,
  } from "flowbite-svelte-icons";
  import type { Writable } from "svelte/store";
  import { fade } from "svelte/transition";

  let {
    status,
    message,
    dismissable = true,
    toastStatus,
  }: {
    status: "success" | "error" | "warning";
    message: string;
    dismissable: boolean;
    toastStatus: Writable<boolean>;
  } = $props();

  const transition = (n: Element) => fade(n, { duration: 300 });
</script>

<div style="z-index: 2000">
  {#if status == "success"}
    <Toast {dismissable} {transition} toastStatus={$toastStatus} color="green">
      <svelte:fragment slot="icon">
        <CheckCircleSolid class="w-5 h-5" />
        <span class="sr-only">Check icon</span>
      </svelte:fragment>
      {message}
    </Toast>
  {:else if status == "error"}
    <Toast {dismissable} {transition} toastStatus={$toastStatus} color="red">
      <svelte:fragment slot="icon">
        <CloseCircleSolid class="w-5 h-5" />
        <span class="sr-only">Error icon</span>
      </svelte:fragment>
      {message}
    </Toast>
  {:else if status == "warning"}
    <Toast {dismissable} {transition} toastStatus={$toastStatus} color="yellow">
      <svelte:fragment slot="icon">
        <ExclamationCircleSolid class="w-5 h-5" />
        <span class="sr-only">Warning icon</span>
      </svelte:fragment>
      {message}
    </Toast>
  {/if}
</div>
