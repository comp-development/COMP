<script lang="ts">
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";
  import { FileCopyOutline } from "flowbite-svelte-icons";

  let { text, frontText=null, successMessage="Successfully copied to clipboard" } = $props();

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch (e) {
      handleError(e);
    }
  }
</script>

<p class="flex" style="justify-content: left;">
  <span
    onclick={() => {
      copyText(text);
    }}
    class="flex hover:scale-110 transition-transform duration-200"
    style="justify-content: left; margin-left: 2px; cursor: pointer;"
    ><FileCopyOutline class="w-4 h-4" />{frontText ? frontText : text}</span
  >
</p>
