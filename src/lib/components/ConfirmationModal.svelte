<script>
    export let isShown = false;
    export let actionName = "this action";
    export let onCancel = () => {};
    export let onConfirm = () => {};
</script>

{#if isShown}
    <div
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
        <div class="bg-white p-6 rounded-lg shadow-xl">
            <h2 class="text-lg font-semibold mb-4">
                Do you want to confirm "{actionName}"?
            </h2>
            <div class="flex justify-end space-x-4">
                <button
                    on:click={onCancel}
                    class="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                    Cancel
                </button>
                <button
                    on:click={onConfirm}
                    class="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                >
                    Confirm
                </button>
            </div>
        </div>
    </div>
{/if}
