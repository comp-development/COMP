<script lang="ts">
    import { handleError } from "$lib/handleError";
    import toast from "$lib/toast.svelte";
    import { FileCopyOutline } from "flowbite-svelte-icons";

    let { text } = $props();

    async function copyText(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Successfully copied to clipboard");
        } catch (e) {
            handleError(e);
        }
    }
</script>

<p class="flex" style="justify-content: left;">
    Join Code: <span
        onclick={() => {
            copyText(text);
        }}
        class="flex"
        style="justify-content: left; margin-left: 2px; cursor: pointer;"
        ><FileCopyOutline class="w-4 h-4" />{text}</span
    >
</p>
