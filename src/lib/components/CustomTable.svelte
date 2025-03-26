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
    Select,
    Input,
    Popover,
    Modal,
    Toggle,
  } from "flowbite-svelte";
  
  // Import Flowbite Svelte Icons
  import { 
    FilterSolid, 
    CloseOutline, 
    PlusOutline, 
    CaretDownSolid, 
    CaretUpSolid,
    TableRowOutline,
    TableColumnOutline,
    ClockSolid
  } from "flowbite-svelte-icons";
  
  import { onMount, type Snippet } from 'svelte';
  // Using custom icons instead of svelte-heros-v2 to avoid dependency issues

  // Props definitions using runes API - updated to use arrays
  const props: {
    data: any[]; // Changed from Record<string | number, any> to any[]
    columns: ({
      key: string;
      label: string;
      visible: boolean;
      format?: "column-snippet" | ((value: any, row: any) => { text: string; isBadge: boolean; color?: string } | string | { component: Element });
      searchable?: boolean;
      dataType?: 'string' | 'number' | 'date' | 'boolean'; // Added dataType for sorting
    })[];
    // A custom renderer for specific columns.
    // Takes in the column being processed and the row (as any).
    component_renderer?: Snippet<[UnifiedColumn, any]>;
    customFields: { 
      custom_field_id: number; 
      label: string; 
      key: string;
      dataType?: 'string' | 'number' | 'date' | 'boolean'; // Added dataType for custom fields
    }[];
    entityType: 'student' | 'team' | 'org' | 'ticket';
    isLoading: boolean;
    event_id: number;
    event_name?: string; // Added event_name as an optional prop
    idField?: string; // Field to use as unique ID, defaults to primary key of entity
  } = $props();

  console.log("PROPS", props)

  // Internal states
  let internalVisibleColumns = $state<Record<string, boolean>>({});
  let sortColumn = $state<string | null>(null);
  let sortDirection = $state<'asc' | 'desc'>('asc');
  
  // Get the ID field to use for each row
  const idField = $derived(props.idField || `${props.entityType}_id`);

  // Filter related states
  interface FilterCondition {
    id: string;
    column: string;
    operator: string;
    value: string;
  }
  
  let filters = $state<FilterCondition[]>([]);
  let pendingFilters = $state<FilterCondition[]>([]);
  let filterText = $state('');
  let showColumnDropdown = $state(false);
  let activeFilterId = $state<string | null>(null);
  let showFilterEditor = $state(false);

  // A unified array that combines regular columns and custom fields
  export interface UnifiedColumn {
    key: string;
    label: string;
    visible: boolean;
    type: 'regular' | 'custom';
    displayKey: string;
    dataKey: string;
    displayLabel: string;
    custom_field_id?: number;
    format?: "column-snippet" | ((value: any, row: any) => { text: string; isBadge: boolean; color?: string } | string);
    searchable?: boolean;
    dataType?: 'string' | 'number' | 'date' | 'boolean';
  }

  let allColumns = $state<UnifiedColumn[]>([]);
  
  // Export settings
  let exportVisibleColumnsOnly = $state(false);
  let exportFilteredRowsOnly = $state(false);

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

  // Get available operators based on column data type
  function getOperatorsForDataType(dataType: 'string' | 'number' | 'date' | 'boolean'): { value: string; label: string }[] {
    const commonOperators = [
      { value: 'eq', label: 'Equals (=)' },
      { value: 'neq', label: 'Not Equals (≠)' },
      { value: 'contains', label: 'Contains' },
      { value: 'startswith', label: 'Starts With' },
      { value: 'endswith', label: 'Ends With' }
    ];
    
    const numberDateOperators = [
      { value: 'gt', label: 'Greater Than (>)' },
      { value: 'gte', label: 'Greater Than or Equal (≥)' },
      { value: 'lt', label: 'Less Than (<)' },
      { value: 'lte', label: 'Less Than or Equal (≤)' }
    ];
    
    switch (dataType) {
      case 'number':
      case 'date':
        return [...commonOperators, ...numberDateOperators];
      case 'boolean':
        return [{ value: 'eq', label: 'Equals (=)' }];
      case 'string':
      default:
        return commonOperators;
    }
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

  // Apply a single filter condition
  function applyFilterCondition(row: any, filter: FilterCondition): boolean {
    const { column, operator, value } = filter;
    
    // Get the actual value from the row
    let rowValue = row[column];
    if (rowValue === null || rowValue === undefined) rowValue = '';
    
    // Determine the data type for this column
    const dataType = getColumnDataType(column);
    
    // Convert the value based on data type
    let typedRowValue: any = rowValue;
    let typedFilterValue: any = value;
    
    switch (dataType) {
      case 'number':
        typedRowValue = Number(rowValue);
        typedFilterValue = Number(value);
        break;
      case 'date':
        typedRowValue = rowValue ? new Date(rowValue) : null;
        typedFilterValue = value ? new Date(value) : null;
        break;
      case 'boolean':
        typedRowValue = Boolean(rowValue);
        typedFilterValue = value.toLowerCase() === 'true';
        break;
      case 'string':
      default:
        typedRowValue = String(rowValue).toLowerCase();
        typedFilterValue = String(value).toLowerCase();
        break;
    }
    
    // Apply the filter based on the operator
    switch (operator) {
      case 'eq': // Equals
        return typedRowValue === typedFilterValue;
      case 'neq': // Not Equals
        return typedRowValue !== typedFilterValue;
      case 'gt': // Greater Than
        return typedRowValue > typedFilterValue;
      case 'gte': // Greater Than or Equal
        return typedRowValue >= typedFilterValue;
      case 'lt': // Less Than
        return typedRowValue < typedFilterValue;
      case 'lte': // Less Than or Equal
        return typedRowValue <= typedFilterValue;
      case 'contains': // Contains
        return String(typedRowValue).includes(typedFilterValue);
      case 'startswith': // Starts With
        return String(typedRowValue).startsWith(typedFilterValue);
      case 'endswith': // Ends With
        return String(typedRowValue).endsWith(typedFilterValue);
      default:
        return true;
    }
  }

  // Apply all filter conditions
  function applyFilters(data: any[], filters: FilterCondition[]): any[] {
    if (!filters.length) return data;
    
    return data.filter(row => {
      // All conditions must be true (AND logic)
      return filters.every(filter => applyFilterCondition(row, filter));
    });
  }

  // Derived filtered data - updated to use the new filter system
  const filteredData = $derived<any[]>(
    sortData(applyFilters(props.data, filters), sortColumn, sortDirection)
  );

  // Get formatted value for display
  function getFormattedValue(column: UnifiedColumn, row: any): { text: string; isBadge: true; color?: string; }|{ text: any; isBadge: false; } {
    // Handle regular columns with formatters
    if (column.type === 'regular' && column.format && column.format != "column-snippet") {
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

  // Add a new filter condition without requiring column selection first
  function addFilter() {
    const id = Math.random().toString(36).substring(2, 9); // Generate a random ID
    
    // Get the first available column as default
    const defaultColumn = allColumns.length > 0 ? allColumns[0].displayKey : '';
    
    const newFilter: FilterCondition = {
      id,
      column: defaultColumn,
      operator: 'eq', // Default to equals
      value: ''
    };
    
    pendingFilters = [...pendingFilters, newFilter];
    activeFilterId = id;
    showColumnDropdown = false;
    filterText = '';
  }

  // Update a pending filter
  function updatePendingFilter(id: string, updates: Partial<FilterCondition>) {
    pendingFilters = pendingFilters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    );
  }

  // Remove a pending filter
  function removePendingFilter(id: string) {
    pendingFilters = pendingFilters.filter(filter => filter.id !== id);
    if (activeFilterId === id) {
      activeFilterId = null;
    }
  }

  // Clear all pending filters and apply changes
  function clearAllFilters() {
    pendingFilters = [];
    activeFilterId = null;
    // Apply the empty filters and close the modal
    filters = [];
    showFilterEditor = false;
    saveTableState();
  }

  // Save and apply filters
  function saveFilters() {
    filters = [...pendingFilters];
    showFilterEditor = false;
    saveTableState();
  }
  
  // Cancel filter editing
  function cancelFilterEditing() {
    pendingFilters = [...filters];
    showFilterEditor = false;
    activeFilterId = null;
  }

  // Open filter editor
  function openFilterEditor() {
    pendingFilters = [...filters];
    showFilterEditor = true;
  }

  // Get filtered columns for dropdown based on search text
  const filteredColumns = $derived(
    filterText.trim() === '' 
      ? allColumns
      : allColumns.filter(col => 
          col.displayLabel.toLowerCase().includes(filterText.toLowerCase())
        )
  );
  
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
        
        // Save filters
        localStorage.setItem(`event_${props.event_id}_${props.entityType}_filters`, JSON.stringify(filters));
        
        // Save export settings
        localStorage.setItem(`event_${props.event_id}_${props.entityType}_export_settings`, JSON.stringify({
          visibleColumnsOnly: exportVisibleColumnsOnly,
          filteredRowsOnly: exportFilteredRowsOnly
        }));
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
        
        // Load filters
        const savedFilters = localStorage.getItem(`event_${props.event_id}_${props.entityType}_filters`);
        if (savedFilters) {
          filters = JSON.parse(savedFilters);
        }
        
        // Load export settings
        const savedExportSettings = localStorage.getItem(`event_${props.event_id}_${props.entityType}_export_settings`);
        if (savedExportSettings) {
          const { visibleColumnsOnly, filteredRowsOnly } = JSON.parse(savedExportSettings);
          exportVisibleColumnsOnly = visibleColumnsOnly;
          exportFilteredRowsOnly = filteredRowsOnly;
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
  function exportToCSV() {
    // Get columns for the headers based on export settings
    const columnsToExport = exportVisibleColumnsOnly
      ? allColumns.filter(col => internalVisibleColumns[col.displayKey])
      : allColumns;
    
    // Create headers array
    const headers = columnsToExport.map(col => col.displayLabel);
    
    // Get rows based on export settings
    const rowsToExport = exportFilteredRowsOnly 
      ? filteredData 
      : props.data;
    
    // Create rows arrays for each data item
    const rows = rowsToExport.map((row: Record<string, any>) => {
      return columnsToExport.map(col => {
        // Get the value using the unified approach
        const value = row[col.dataKey];
        // For CSV export, we don't want to include the dash for empty values
        return (value === null || value === undefined || value === '') ? '' : 
               (col.type === 'regular' && col.format && col.format != "column-snippet") ? getFormattedValue(col, row as Record<string, any>).text : 
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
    const exportType = exportVisibleColumnsOnly ? 'visible' : 'all';
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
    // Initialize pending filters with current filters
    pendingFilters = [...filters];
  });

  // Watch for filter changes to save state
  $effect(() => {
    if (filters.length > 0 || filters.length === 0) {
      saveTableState();
    }
  });
</script>

{#if props.isLoading}
  <div class="w-full">
    <!-- Table header skeleton -->
    <div class="mb-4 flex flex-row justify-between w-full">
      <div class="flex items-center gap-2">
        <div class="h-9 w-24 bg-[color:var(--primary-tint)] bg-opacity-30 dark:bg-opacity-20 rounded animate-pulse"></div>
        <div class="h-9 w-40 bg-[color:var(--primary-tint)] bg-opacity-30 dark:bg-opacity-20 rounded animate-pulse"></div>
      </div>
      <div class="flex items-center">
        <div class="h-9 w-24 bg-[color:var(--primary-tint)] bg-opacity-30 dark:bg-opacity-20 rounded animate-pulse"></div>
      </div>
    </div>
    
    <!-- Table skeleton -->
    <div class="overflow-x-auto">
      <div class="w-full border-b border-[color:var(--primary-tint)] border-opacity-20 dark:border-opacity-20">
        <!-- Skeleton header -->
        <div class="grid grid-cols-4 gap-4 py-3 bg-[color:var(--primary-tint)] bg-opacity-10 dark:bg-opacity-10">
          {#each Array(4) as _, i}
            <div class="h-6 bg-[color:var(--primary-tint)] bg-opacity-30 dark:bg-opacity-20 rounded animate-pulse"></div>
          {/each}
        </div>
        
        <!-- Skeleton rows -->
        {#each Array(5) as _, i}
          <div class="grid grid-cols-4 gap-4 py-4 border-b border-[color:var(--primary-tint)] border-opacity-10 dark:border-opacity-10">
            {#each Array(4) as _, j}
              <div class="h-5 bg-[color:var(--primary-tint)] bg-opacity-20 dark:bg-opacity-15 rounded animate-pulse"></div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>
{:else}
  <div class="mb-4 flex flex-row justify-between w-full">
    <!-- Left-aligned buttons -->
    <div class="flex items-center gap-2">
      <Button color="primary" class="btn-primary flex items-center gap-1" on:click={openFilterEditor}>
        <FilterSolid class="w-4 h-4" />
        Filters
        {#if filters.length > 0}
          <Badge color="none" class="ml-1 bg-[color:var(--primary-light)] text-white">{filters.length}</Badge>
        {/if}
      </Button>
      
      <div class="relative">
        <Button color="primary" class="btn-primary flex items-center gap-1">
          <TableColumnOutline class="w-4 h-4" />
          Show/Hide Columns
        </Button>
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
    
    <!-- Right-aligned buttons -->
    <div class="flex items-center ml-auto">
      <div class="relative">
        <Button color="primary" class="flex items-center gap-1">
          <TableRowOutline class="w-4 h-4" />
          Export
        </Button>
        <Dropdown class="w-64 p-3">
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <Toggle checked={exportVisibleColumnsOnly} on:change={() => {
                exportVisibleColumnsOnly = !exportVisibleColumnsOnly;
                saveTableState();
              }} />
              <span class="text-sm">Include shown columns only</span>
            </div>
            <div class="flex items-center gap-2">
              <Toggle checked={exportFilteredRowsOnly} on:change={() => {
                exportFilteredRowsOnly = !exportFilteredRowsOnly;
                saveTableState();
              }} />
              <span class="text-sm">Include filtered rows only</span>
            </div>
            <div class="pt-2 border-t border-gray-200 dark:border-gray-600">
              <Button size="sm" color="primary" class="w-full" on:click={exportToCSV}>Export to CSV</Button>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  </div>
  
  <!-- Filter Editor Modal using Flowbite Modal component -->
  <Modal title="Edit Filters" bind:open={showFilterEditor} size="xl" autoclose={false} classBody="w-full">
    <!-- Content -->
    <div class="w-full space-y-4">
      <!-- Add Filter Button -->
      <div class="mb-4">
        <Button color="light" class="flex items-center gap-1" on:click={addFilter}>
          <PlusOutline class="w-4 h-4" />
          Add Filter
        </Button>
      </div>
      
      <!-- Filter list -->
      {#if pendingFilters.length === 0}
        <div class="text-center p-4 text-gray-500 dark:text-gray-400">
          No filters added. Click "Add Filter" to create one.
        </div>
      {:else}
        <div class="w-full space-y-4">
          {#each pendingFilters as filter}
            <div class="w-full bg-gray-50 dark:bg-gray-700 rounded-md p-3">
              <div class="flex flex-row flex-nowrap items-center gap-2 w-full">
                <!-- Column selector - approx 30% -->
                <div class="w-[40%]">
                  <Select 
                    value={filter.column}
                    on:change={(e) => {
                      const target = e.target as HTMLSelectElement;
                      updatePendingFilter(filter.id, { column: target.value });
                    }}
                    class="text-sm w-full"
                  >
                    {#each allColumns as column}
                      <option value={column.displayKey}>{column.displayLabel}</option>
                    {/each}
                  </Select>
                </div>
                
                <!-- Operator selector - approx 30% -->
                <div class="w-[10%]">
                  <Select 
                    value={filter.operator}
                    on:change={(e) => {
                      const target = e.target as HTMLSelectElement;
                      updatePendingFilter(filter.id, { operator: target.value });
                    }}
                    class="text-sm w-full"
                  >
                    {#each getOperatorsForDataType(getColumnDataType(filter.column)) as op}
                      <option value={op.value}>{op.label}</option>
                    {/each}
                  </Select>
                </div>
                
                <!-- Value input - approx 30% -->
                <div class="w-[40%]">
                  <Input 
                    type={getColumnDataType(filter.column) === 'date' ? 'date' : 'text'}
                    value={filter.value}
                    on:input={(e) => {
                      const target = e.target as HTMLInputElement;
                      updatePendingFilter(filter.id, { value: target.value });
                    }}
                    class="text-sm w-full"
                    placeholder="Enter value"
                  />
                </div>
                
                <!-- Remove button - approx 10% -->
                <div class="flex-shrink-0 flex justify-center">
                  <button 
                    class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 p-2"
                    on:click={() => removePendingFilter(filter.id)}
                    aria-label="Remove filter"
                  >
                    <CloseOutline class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- Modal actions -->
    <svelte:fragment slot="footer">
      <div class="flex w-full justify-between items-center">
        <div class="flex gap-3">
          <Button color="red" on:click={clearAllFilters} disabled={pendingFilters.length === 0 && filters.length === 0}>Clear All Filters</Button>
          <Button color="alternative" on:click={cancelFilterEditing}>Cancel</Button>
          <Button color="primary" on:click={saveFilters}>Apply Filters</Button>
        </div>
      </div>
    </svelte:fragment>
  </Modal>
  
  <div class="overflow-x-auto">
    <Table striped={false} hoverable={false} class="table-compact themed-table">
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
                      <CaretUpSolid class="w-3 h-3 ml-1" />
                    {:else}
                      <CaretDownSolid class="w-3 h-3 ml-1" />
                    {/if}
                  {/if}
                </span>
            </TableHeadCell>
          {/if}
        {/each}
      </TableHead>
      <TableBody>
        {#if filteredData.length === 0}
          <TableBodyRow class="hover:bg-transparent no-hover">
            <TableBodyCell colspan={Object.values(internalVisibleColumns).filter(v => v).length || 1} class="text-center py-8 text-gray-500 dark:text-gray-400">
              <div class="flex flex-col items-center justify-center">
                {#if props.data.length === 0}
                  <!-- No data at all -->
                  <div class="mb-2 text-[color:var(--primary-light)] opacity-40">
                    <ClockSolid class="w-10 h-10" />
                  </div>
                  <p class="font-medium">
                    No {props.entityType}s registered yet, check back later!
                  </p>
                {:else}
                  <!-- Data exists but filtered out -->
                  <div class="mb-2 text-[color:var(--primary-light)] opacity-40">
                    <FilterSolid class="w-10 h-10" />
                  </div>
                  <p class="font-medium">No rows to display</p>
                  {#if filters.length > 0}
                    <p class="text-sm mt-1">Try adjusting your filter criteria</p>
                  {/if}
                {/if}
              </div>
            </TableBodyCell>
          </TableBodyRow>
        {:else}
          {#each filteredData as row (row[idField])}
            <TableBodyRow>
              {#each allColumns as column}
                {#if internalVisibleColumns[column.displayKey]}
                  <TableBodyCell>
                    {#if column.type === 'regular' && getFormattedValue(column, row).isBadge}
                      <Badge color={(getFormattedValue(column, row) as any).color || "blue"}>
                        {getFormattedValue(column, row).text}
                      </Badge>
                    {:else if column.type === 'regular' && column.format == "column-snippet"}
                      <!-- use the custom snippet renderer for this column -->
                      {@render props.component_renderer!(column, row)}
                    {:else}
                      {getFormattedValue(column, row).text}
                    {/if}
                  </TableBodyCell>
                {/if}
              {/each}
            </TableBodyRow>
          {/each}
        {/if}
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

  /* Prevent hover effects on "No rows to display" message */
  :global(.no-hover:hover) {
    background-color: transparent !important;
  }
  
  :global(tr.no-hover:hover td) {
    background-color: transparent !important;
  }
</style> 
