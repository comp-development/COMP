<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Search,
    Checkbox,
    Dropdown,
    DropdownItem,
    Button,
    Badge,
  } from "flowbite-svelte";
  import { onMount } from 'svelte';

  // Props definitions using runes API - updated to use arrays
  const props = $props<{
    data: any[]; // Changed from Record<string | number, any> to any[]
    columns: {
      key: string;
      label: string;
      visible: boolean;
      format?: (value: any, row: any) => { text: string; isBadge: boolean; color?: string } | string;
      searchable?: boolean;
      dataType?: 'string' | 'number' | 'date' | 'boolean'; // Added dataType for sorting
    }[];
    customFields: { 
      custom_field_id: number; 
      label: string; 
      key: string;
      dataType?: 'string' | 'number' | 'date' | 'boolean'; // Added dataType for custom fields
    }[];
    entityType: 'student' | 'team' | 'org';
    isLoading: boolean;
    event_id: number;
    idField?: string; // Field to use as unique ID, defaults to primary key of entity
  }>();

  console.log("PROPS", props)

  // Internal states
  let searchTerm = $state('');
  let internalVisibleColumns = $state<Record<string, boolean>>({});
  let sortColumn = $state<string | null>(null);
  let sortDirection = $state<'asc' | 'desc'>('asc');
  
  // Get the ID field to use for each row
  const idField = $derived(props.idField || `${props.entityType}_id`);

  // Initialize visibility from columns' visible property
  function initializeVisibility() {
    const initial: Record<string, boolean> = {};
    
    // Set default visibility from column definitions
    props.columns.forEach((column: { key: string; visible: boolean }) => {
      initial[column.key] = column.visible;
    });
    
    // Set all custom fields to be visible by default
    props.customFields.forEach((field: { key: string }) => {
      initial[`custom_field.${field.key}`] = true;
    });
    
    return initial;
  }

  // Handle column sorting
  function handleSort(columnKey: string) {
    console.log("SORTING", columnKey)
    if (sortColumn === columnKey) {
      // Toggle direction if same column is clicked again
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, set as ascending sort
      sortColumn = columnKey;
      sortDirection = 'asc';
    }
    
    // Save sort settings to localStorage
    saveTableState();
  }

  // Get the data type for a column
  function getColumnDataType(columnKey: string): 'string' | 'number' | 'date' | 'boolean' {
    // Check if it's a regular column
    const column = props.columns.find((col: { key: string; dataType?: 'string' | 'number' | 'date' | 'boolean' }) => col.key === columnKey);
    if (column && column.dataType) {
      return column.dataType;
    }

    // Check if it's a custom field
    if (columnKey.startsWith('custom_field.')) {
      const fieldKey = columnKey.replace('custom_field.', '');
      const customField = props.customFields.find((field: { key: string; dataType?: 'string' | 'number' | 'date' | 'boolean' }) => field.key === fieldKey);
      if (customField && customField.dataType) {
        return customField.dataType;
      }
    }

    // Default to string if type isn't specified
    return 'string';
  }

  // Compare values based on data type
  function compareValues(valueA: any, valueB: any, dataType: 'string' | 'number' | 'date' | 'boolean', direction: 'asc' | 'desc'): number {
    // Handle undefined or null values
    if (valueA === undefined || valueA === null) valueA = '';
    if (valueB === undefined || valueB === null) valueB = '';

    let result: number;

    switch (dataType) {
      case 'number':
        // Convert to numbers for numerical comparison
        const numA = Number(valueA);
        const numB = Number(valueB);
        result = isNaN(numA) && isNaN(numB) ? 0 : 
                isNaN(numA) ? -1 : 
                isNaN(numB) ? 1 : 
                numA - numB;
        break;

      case 'date':
        // Convert to Date objects for date comparison
        const dateA = valueA ? new Date(valueA) : null;
        const dateB = valueB ? new Date(valueB) : null;
        result = !dateA && !dateB ? 0 :
                !dateA ? -1 :
                !dateB ? 1 :
                dateA.getTime() - dateB.getTime();
        break;

      case 'boolean':
        // Convert to booleans
        const boolA = Boolean(valueA);
        const boolB = Boolean(valueB);
        result = boolA === boolB ? 0 : boolA ? 1 : -1;
        break;

      case 'string':
      default:
        // String comparison
        const strA = String(valueA).toLowerCase();
        const strB = String(valueB).toLowerCase();
        result = strA.localeCompare(strB);
    }

    // Apply sort direction
    return direction === 'asc' ? result : -result;
  }

  // Sort data function - updated for array data with type-aware sorting
  function sortData(data: any[], column: string | null, direction: 'asc' | 'desc'): any[] {
    if (!column || !data.length) return data;

    // Get the data type for this column
    const dataType = getColumnDataType(column);

    return [...data].sort((rowA, rowB) => {
      let valueA = rowA[column];
      let valueB = rowB[column];

      return compareValues(valueA, valueB, dataType, direction);
    });
  }

  // Derived filtered data - with explicit type and updated for arrays
  const filteredData = $derived<any[]>(
    searchTerm.trim() === '' 
      ? sortData(props.data, sortColumn, sortDirection)
      : sortData(filterData(props.data, searchTerm, props.columns, props.customFields), sortColumn, sortDirection)
  );

  // Get formatted value for display
  function getFormattedValue(column: any, row: any) {
    if (column.format) {
      const formatted = column.format(row[column.key], row);
      if (typeof formatted === 'string') {
        return { text: formatted, isBadge: false };
      }
      return formatted;
    }
    
    return { text: row[column.key]?.toString() || '-', isBadge: false };
  }

  // Function to filter data with explicit return type - updated for arrays
  function filterData(
    data: any[],
    searchTerm: string,
    columns: any[],
    customFields: any[]
  ): any[] {
    if (!searchTerm) return data;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Get searchable column keys, default all to searchable if not specified
    const searchableColumnKeys = columns
      .filter(col => col.searchable !== false)
      .map(col => col.key);
    
    // Add custom fields to searchable keys
    const customFieldKeys = customFields.map(field => `custom_field.${field.key}`);
    
    // Combine all searchable keys
    const allSearchableKeys = [...searchableColumnKeys, ...customFieldKeys];
    
    // Filter the array directly
    return data.filter(row => {
      // Check each searchable field for matches
      return allSearchableKeys.some(key => {
        const value = row[key];
        if (value === null || value === undefined) return false;
        
        const stringValue = value.toString().toLowerCase();
        return stringValue.includes(lowerSearchTerm);
      });
    });
  }
  
  // Save table state to localStorage (columns visibility, sorting, and filtering)
  function saveTableState() {
    try {
      if (props.event_id && props.entityType) {
        // Save column visibility
        localStorage.setItem(`event_${props.event_id}_${props.entityType}_columns`, JSON.stringify(internalVisibleColumns));
        
        // Save sorting state
        localStorage.setItem(`event_${props.event_id}_${props.entityType}_sort`, JSON.stringify({
          column: sortColumn,
          direction: sortDirection
        }));
        
        // Save search/filter term
        localStorage.setItem(`event_${props.event_id}_${props.entityType}_search`, searchTerm);
      }
    } catch (e) {
      console.error(`Error saving table state to localStorage:`, e);
    }
  }

  // Load table state from localStorage
  function loadTableState() {
    try {
      if (props.event_id && props.entityType) {
        // Load column visibility
        const savedColumns = localStorage.getItem(`event_${props.event_id}_${props.entityType}_columns`);
        if (savedColumns) {
          internalVisibleColumns = { ...JSON.parse(savedColumns) };
        } else {
          internalVisibleColumns = initializeVisibility();
        }
        
        // Load sorting state
        const savedSorting = localStorage.getItem(`event_${props.event_id}_${props.entityType}_sort`);
        if (savedSorting) {
          const { column, direction } = JSON.parse(savedSorting);
          sortColumn = column;
          sortDirection = direction;
          console.log("SORTING FROM STORAGE", sortColumn, sortDirection)
        }
        
        // Load search/filter term
        const savedSearch = localStorage.getItem(`event_${props.event_id}_${props.entityType}_search`);
        if (savedSearch) {
          searchTerm = savedSearch;
        }
        
        return true;
      }
      return false;
    } catch (e) {
      console.error(`Error loading table state from localStorage:`, e);
      return false;
    }
  }

  // Toggle column visibility
  function toggleColumn(columnKey: string) {
    // Create a new object to ensure reactivity
    internalVisibleColumns = { 
      ...internalVisibleColumns, 
      [columnKey]: !internalVisibleColumns[columnKey] 
    };
    saveTableState();
  }

  // Initialize when component mounts
  onMount(() => {
    // Load all table state from localStorage
    loadTableState();
  });

  // Watch for search term changes to save state
  $effect(() => {
    if (searchTerm !== undefined) {
      saveTableState();
    }
  });
</script>

{#if props.isLoading}
  <p>Loading data...</p>
{:else}
  <div class="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
    <Search size="md" placeholder={`Search ${props.entityType}s...`} class="search-input" bind:value={searchTerm} />
    
    <div class="relative">
      <Button color="light" class="btn-primary">Show/Hide Columns</Button>
      <Dropdown class="w-48">
        {#each props.columns as column}
          <DropdownItem class="flex items-center gap-2">
            <Checkbox checked={internalVisibleColumns[column.key]} on:change={() => toggleColumn(column.key)}>
              {column.label}
            </Checkbox>
          </DropdownItem>
        {/each}
        {#each props.customFields as field}
          <DropdownItem class="flex items-center gap-2">
            <Checkbox checked={internalVisibleColumns[`custom_field.${field.key}`]} on:change={() => toggleColumn(`custom_field.${field.key}`)}>
              {field.key}
            </Checkbox>
          </DropdownItem>
        {/each}
      </Dropdown>
    </div>
  </div>
  
  <div class="overflow-x-auto">
    <Table striped={false} hoverable={true} class="table-compact themed-table">
      <TableHead class="border-b">
        {#each props.columns as column}
          {#if internalVisibleColumns[column.key]}
            <TableHeadCell 
              on:click={() => handleSort(column.key)}
            >
                {column.label}
                {#if (sortColumn === column.key)}
                  {#if (sortDirection == 'asc')}
                    <span class="text-sm">▲</span>
                  {:else}
                    <span class="text-sm">▼</span>
                  {/if}
                {/if}
            </TableHeadCell>
          {/if}
        {/each}
        {#each props.customFields as field}
          {#if internalVisibleColumns[`custom_field.${field.key}`]}
            <TableHeadCell 
              on:click={() => handleSort(`custom_field.${field.key}`)}
            >
                {field.key} 
                {#if (sortColumn === `custom_field.${field.key}`)}
                  {#if (sortDirection == 'asc')}
                    <span class="text-sm">▲</span>
                  {:else}
                    <span class="text-sm">▼</span>
                  {/if}
                {/if}
            </TableHeadCell>
          {/if}
        {/each}
      </TableHead>
      <TableBody>
        {#each filteredData as row (row[idField])}
          <TableBodyRow>
            {#each props.columns as column}
              {#if internalVisibleColumns[column.key]}
                <TableBodyCell>
                  {#if getFormattedValue(column, row).isBadge}
                    <Badge color={getFormattedValue(column, row).color || "blue"}>
                      {getFormattedValue(column, row).text}
                    </Badge>
                  {:else}
                    {getFormattedValue(column, row).text}
                  {/if}
                </TableBodyCell>
              {/if}
            {/each}
            {#each props.customFields as field}
              {#if internalVisibleColumns[`custom_field.${field.key}`]}
                <TableBodyCell>
                  {row[`custom_field.${field.key}`] || '-'}
                </TableBodyCell>
              {/if}
            {/each}
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>
{/if}

<style>
  /* Styles will be inherited from parent component */
</style> 