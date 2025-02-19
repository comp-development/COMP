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

  let {
    actionType = "delete",
    action,
    items = [],
    org_id = null,
    columns = [
      {
        label: "First Name",
        value: (item) => item.person.first_name,
        sortable: true,
      },
      {
        label: "Last Name",
        value: (item) => item.person.last_name,
        sortable: true,
      },
    ],
    deleteUserId = $bindable(),
  } = $props();

  let showDeleteConfirmation = $state(false);
</script>

<Table
  {items}
  class="w-full"
  filter={(item, searchTerm) =>
    columns.some((col) => {
      const value = col.value(item)?.toString().toLowerCase() || "";
      return value.includes(searchTerm.toLowerCase());
    })}
>
  <TableHead>
    {#if actionType != "none"}
      <TableHeadCell></TableHeadCell>
    {/if}
    {#each columns as column}
      <TableHeadCell
        class="center-text"
        sort={column.sortable
          ? (a, b) => column.value(a).localeCompare(column.value(b))
          : undefined}
      >
        {column.label}
      </TableHeadCell>
    {/each}
  </TableHead>

  <TableBody tableBodyClass="divide-y">
    <TableBodyRow slot="row" let:item>
      {#if actionType != "none"}
        <TableBodyCell class="px-0 py-1 text-center">
          {#if actionType === "delete"}
            <button
              class="select_button"
              onclick={() => {
                showDeleteConfirmation = true;
                deleteUserId = item.admin_id;
              }}
            >
              🗑️
            </button>
          {:else if actionType == "select_student"}
            <button
              class="select_button"
              onclick={(e) => action(e, item, org_id)}
            >
              ✅
            </button>
          {:else if actionType == "edit"}
            <button class="select_button" onclick={(e) => action(e, item)}>
              ✏️
            </button>
          {:else}
            <button class="select_button" onclick={(e) => action(e, item)}>
              ✅
            </button>
          {/if}
        </TableBodyCell>
      {/if}
      {#each columns as column}
        <TableBodyCell class="px-0 py-0 text-center">
          {column.value(item)}
        </TableBodyCell>
      {/each}
    </TableBodyRow>
  </TableBody>
</Table>

<ConfirmationModal
  isShown={showDeleteConfirmation}
  actionName="remove this user from host"
  onCancel={() => {
    showDeleteConfirmation = false;
    deleteUserId = null;
  }}
  onConfirm={() => {
    action();
    showDeleteConfirmation = false;
    deleteUserId = false;
  }}
/>

<style>
  :global(.center-text button) {
    text-align: center;
  }

  :global(#table-search) {
    width: 100%;
  }
</style>
