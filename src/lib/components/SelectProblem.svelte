<script lang="ts">
    import {
        DataTable,
        Toolbar,
        ToolbarContent,
        ToolbarSearch,
        Pagination,
    } from "carbon-components-svelte";
    import Button from "$lib/components/Button.svelte";
    import MathJax from "$lib/components/MathJax.svelte";
    import { getAllProblems } from "$lib/supabase";

    let pageSize = 25;
    let pageT = 1;

    export let open: boolean;
    export let onSelect;
    export let closeModal;
    export let changeNewProblem;

    let allProblems;

    (async () => {
        allProblems = await getAllProblems();
        allProblems.forEach((problem) => {
            problem.id = problem.problem_id;
        });
    })();
</script>

{#if open}
    <div class="modal-overlay" on:click={closeModal}>
        <div class="modal" on:click|stopPropagation>
            <button class="close-button" on:click={closeModal}>✖</button>
            <h2>Select Problem</h2>
            <br />
            <Button title="Write New Problem" action={changeNewProblem} />
            <br /><br />
            <DataTable
                expandable
                sortable
                size="compact"
                headers={[
                    { key: "edit", value: "Select", width: "50px" },
                    { key: "id", value: "ID", width: "50px" },
                    {
                        key: "problem_latex",
                        value: "Problem Latex",
                        width: "250px",
                    },
                ]}
                rows={allProblems}
                {pageSize}
                page={pageT}
            >
                <Toolbar size="sm">
                    <ToolbarContent>
                        <ToolbarSearch persistent shouldFilterRows />
                    </ToolbarContent>
                </Toolbar>

                <svelte:fragment slot="cell" let:row let:cell let:rowIndex>
                    <div>
                        {#if cell.key === "edit"}
                            <button class="arrow-button" on:click={() => {onSelect(row)}}
                                >✅</button
                            >
                        {:else}
                            <div class="cell-content">
                                {cell.value == null || cell.value == ""
                                    ? "None"
                                    : cell.value}
                            </div>
                        {/if}
                    </div>
                </svelte:fragment>

                <svelte:fragment slot="expanded-row" let:row>
                    <MathJax math={row.problem_latex} />
                </svelte:fragment>
            </DataTable>

            <Pagination
                bind:pageSize
                bind:page={pageT}
                totalItems={allProblems.length}
                pageSizeInputDisabled
            />
        </div>
    </div>
{/if}

<style>
    .cell-content {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal {
        background-color: white;
        padding: 20px;
        width: 600px;
        max-width: 90%;
        max-height: 500px;
        overflow-y: auto;
        border-radius: 8px;
        position: relative;
    }

    .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
    }

    button {
		border: none;
		outline: none;
		background-color: none;
	}
</style>
