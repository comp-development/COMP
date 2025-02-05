<script lang="ts">
    import {
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
    } from "flowbite-svelte";
    import ConfirmationModal from "$lib/components/ConfirmationModal.svelte";

    let { actionType = "delete", action, items, org_id=null } = $props();
    let showDeleteConfirmation = $state(false);
</script>

<Table
    {items}
    class="w-full"
    filter={(item, searchTerm) =>
        item.person.first_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        item.person.last_name.toLowerCase().includes(searchTerm.toLowerCase())}
>
    <TableHead>
        <TableHeadCell></TableHeadCell>
        <TableHeadCell
            class="center-text"
            sort={(a, b) =>
                a.person.first_name.localeCompare(b.person.first_name)}
            defaultSort>First Name</TableHeadCell
        >
        <TableHeadCell
            class="center-text"
            sort={(a, b) =>
                a.person.last_name.localeCompare(b.person.last_name)}
            >Last Name</TableHeadCell
        >
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        <TableBodyRow slot="row" let:item>
            <TableBodyCell class="px-0 py-1 text-center">
                {#if actionType === "delete"}
                    <button
                        class="select_button"
                        onclick={(e) => {
                            showDeleteConfirmation = true;
                        }}>🗑️</button
                    >
                    <ConfirmationModal
                        isShown={showDeleteConfirmation}
                        actionName="remove this coach from organization"
                        onCancel={() => {
                            showDeleteConfirmation = false;
                        }}
                        onConfirm={() => {
                            action(item.coach_id);
                        }}
                    />
                {:else if actionType == "select_student"}
                    <button
                        class="select_button"
                        onclick={(e) => action(e, item, org_id)}
                        >✅</button
                    >
                {:else}
                    <button
                        class="select_button"
                        onclick={(e) => action(e, item)}
                        >✅</button
                    >
                {/if}
            </TableBodyCell>
            <TableBodyCell class="px-0 py-0 text-center"
                >{item.person.first_name}</TableBodyCell
            >
            <TableBodyCell class="px-0 py-0 text-center"
                >{item.person.last_name}</TableBodyCell
            >
        </TableBodyRow>
    </TableBody>
</Table>
