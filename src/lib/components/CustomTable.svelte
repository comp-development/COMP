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
    event_name?: string; // Added event_name as an optional prop
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

  // A unified array that combines regular columns and custom fields
  interface UnifiedColumn {
    key: string;
    label: string;
    visible: boolean;
    type: 'regular' | 'custom';
    displayKey: string;
    dataKey: string;
    displayLabel: string;
    custom_field_id?: number;
    format?: (value: any, row: any) => { text: string; isBadge: boolean; color?: string } | string;
    searchable?: boolean;
    dataType?: 'string' | 'number' | 'date' | 'boolean';
  }

  let allColumns = $state<UnifiedColumn[]>([]);

  $effect(() => {
    // Map regular columns
    const regularColumns = props.columns.map((column: any) => ({
      ...column,
      type: 'regular' as const,
      displayKey: column.key, // The key as displayed/used in the component
      dataKey: column.key, // The key used to access data in the row object
      displayLabel: column.label // The label displayed in the header
    }));
    
    // Map custom fields
    const customFieldColumns = props.customFields.map((field: any) => ({
      ...field,
      type: 'custom' as const,
      displayKey: `custom_field.${field.key}`, // The key as displayed/used in the component
      dataKey: `custom_field.${field.key}`, // The key used to access data in the row object
      displayLabel: field.key, // The label displayed in the header
      visible: true // Custom fields are visible by default
    }));
    
    // Update allColumns
    allColumns = [...regularColumns, ...customFieldColumns];
  });

  // Initialize visibility from columns' visible property
  function initializeVisibility() {
    const initial: Record<string, boolean> = {};
    
    // Initialize all columns using the unified approach
    for (const column of allColumns) {
      initial[column.displayKey] = column.type === 'regular' ? column.visible : true;
    }
    
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
    // Find the column in our unified array
    const column = allColumns.find(col => col.displayKey === columnKey);
    if (column && column.dataType) {
      return column.dataType;
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
    // Handle regular columns with formatters
    if (column.type === 'regular' && column.format) {
      const formatted = column.format(row[column.dataKey], row);
      if (typeof formatted === 'string') {
        return { text: formatted || '-', isBadge: false };
      }
      return formatted;
    }
    
    // Handle regular columns without formatters or custom fields
    const value = row[column.dataKey];
    return { text: (value === null || value === undefined || value === '') ? '-' : value.toString(), isBadge: false };
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

  // Function to export table data to CSV
  function exportToCSV(exportAllColumns = false) {
    // Get columns for the headers - either all or only visible ones using the unified approach
    const columnsToExport = exportAllColumns 
      ? allColumns 
      : allColumns.filter(col => internalVisibleColumns[col.displayKey]);
    
    // Create headers array
    const headers = columnsToExport.map(col => col.displayLabel);
    
    // Create rows arrays for each data item
    const rows = filteredData.map(row => {
      return columnsToExport.map(col => {
        // Get the value using the unified approach
        const value = row[col.dataKey];
        // For CSV export, we don't want to include the dash for empty values
        return (value === null || value === undefined || value === '') ? '' : 
               (col.type === 'regular' && col.format) ? getFormattedValue(col, row).text : 
               String(value);
      });
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCSVValue).join(','),
      ...rows.map(row => row.map(escapeCSVValue).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set filename - include event name if available
    const now = new Date();
    const date = now.toISOString().split('T')[0].replaceAll('-','.');
    const time = now.toISOString().substr(11, 8).replaceAll(':', ''); // Extract HHMM in GMT (no colon)
    const exportType = exportAllColumns ? 'all' : 'visible';
    const eventNamePart = props.event_name 
      ? `${props.event_name.toLowerCase().replace(/\s+/g, '-')}_` 
      : '';
    const filename = `${eventNamePart}${props.entityType}_${date}.${time}.csv`;
    
    // Trigger download
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Helper function to escape CSV values
  function escapeCSVValue(value: any): string {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    // If value contains comma, newline or double-quote, enclose in double quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      // Replace double quotes with two double quotes
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
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
    
    <div class="flex items-center gap-2">
      <div class="relative">
        <Button color="primary">Export to CSV</Button>
        <Dropdown class="w-52">
          <DropdownItem on:click={() => exportToCSV(false)}>
            Export Visible Columns
          </DropdownItem>
          <DropdownItem on:click={() => exportToCSV(true)}>
            Export All Columns
          </DropdownItem>
        </Dropdown>
      </div>
      <div class="relative">
        <Button color="light" class="btn-primary">Show/Hide Columns</Button>
        <Dropdown class="w-64">
          {#each allColumns as column}
            <DropdownItem class="px-2 py-1">
              <Checkbox checked={internalVisibleColumns[column.displayKey]} on:change={() => toggleColumn(column.displayKey)} class="text-left w-full">
                <span class="text-sm break-words whitespace-normal">{column.displayLabel}</span>
              </Checkbox>
            </DropdownItem>
          {/each}
        </Dropdown>
      </div>
    </div>
  </div>
  
  <div class="overflow-x-auto">
    <Table striped={false} hoverable={true} class="table-compact themed-table">
      <TableHead class="border-b" theadClass="text-xs uppercase align-middle">
        {#each allColumns as column}
          {#if internalVisibleColumns[column.displayKey]}
            <TableHeadCell 
              on:click={() => handleSort(column.displayKey)}
              padding="px-6 py-3"
              class="align-middle select-none sortable-header"
            >
                <span class="inline-flex items-center select-none header-label">
                  {column.displayLabel}
                  {#if (sortColumn === column.displayKey)}
                    {#if (sortDirection == 'asc')}
                      <span class="ml-1">▲</span>
                    {:else}
                      <span class="text-sm ml-1">▼</span>
                    {/if}
                  {/if}
                </span>
            </TableHeadCell>
          {/if}
        {/each}
      </TableHead>
      <TableBody>
        {#each filteredData as row (row[idField])}
          <TableBodyRow>
            {#each allColumns as column}
              {#if internalVisibleColumns[column.displayKey]}
                <TableBodyCell>
                  {#if column.type === 'regular' && getFormattedValue(column, row).isBadge}
                    <Badge color={getFormattedValue(column, row).color || "blue"}>
                      {getFormattedValue(column, row).text}
                    </Badge>
                  {:else}
                    {getFormattedValue(column, row).text}
                  {/if}
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
  
  /* Table header hover effects */
  :global(.sortable-header) {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }
  
  :global(.sortable-header:hover .header-label) {
    font-weight: bold;
    font-size: 110%;
    color: var(--primary-tint);
    transition: all 0.2s ease-in-out;
  }
</style> 