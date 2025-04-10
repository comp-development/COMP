<!--
  CustomTable Component
  
  A flexible and powerful table component with support for:
  - Sorting
  - Filtering
  - Searching
  - Column visibility toggling
  - CSV export
  - Custom formatting
  - Frozen columns (using the `frozen: true` property on column definitions)
  - Linked columns

  Usage:
  ```svelte
  <CustomTable 
    data={data}
    columns={[
      { key: 'id', label: 'ID', visible: false },
      { key: 'name', label: 'Name', visible: true, frozen: true },  // This column will be frozen
      { key: 'email', label: 'Email', visible: true }
    ]}
    entityType="user"
    idField="id"
    tableId="users_table"
  />
  ```

  Column Properties:
  - key: Unique identifier for the column (required)
  - label: Display label for the column (required)
  - visible: Whether the column is initially visible (default: true)
  - searchable: Whether the column is included in search (default: true)
  - dataType: The data type of the column ('string', 'number', 'date', 'boolean')
  - format: Function to format the cell value
  - frozen: When true, the column stays fixed on the left side while scrolling horizontally
  - linkedToColumn: Associates this column with another visible column for search/filtering/export
-->

<script lang="ts">
  import {
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
    Alert,
    Spinner
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
    ClockSolid,
    SearchOutline,
    DownloadSolid,
    PenSolid,
    TrashBinSolid,
    CogOutline,
    CogSolid
  } from "flowbite-svelte-icons";
  
  import { onMount, createEventDispatcher, onDestroy, type Snippet } from 'svelte';
  // Using custom icons instead of svelte-heros-v2 to avoid dependency issues

  // Define the TableColumn type
  type TableColumn = {
    key: string;
    label: string;
    visible: boolean;
    searchable?: boolean;
    dataType?: 'string' | 'number' | 'date' | 'boolean';
    format?: (value: any, row: any) => any;
    displayKey?: string;
    dataKey?: string;
    displayLabel?: string;
    linkedToColumn?: string; // New property to link this column to another column
  };

  // Fixed return type for formatted values
  type FormattedValue = 
    | { text: string; isBadge: true; color?: string; cellStyle?: string; } 
    | { text: any; isBadge: false; cellStyle?: string; component?: any; props?: any; };

  // Define row action type
  type RowAction = {
    icon: any; // Icon component
    callback: (row: any) => void;
    tooltip?: string;
    color?: string;
  };

  // Props definitions using runes API - updated to use arrays
  const props: {
    data: any[]; // Changed from Record<string | number, any> to any[]
    columns: ({
      key: string;
      label: string;
      visible: boolean;
      searchable?: boolean;
      dataType?: 'string' | 'number' | 'date' | 'boolean'; // Added dataType for sorting
      format?: "column-snippet" | ((value: any, row: any) => { text: string; isBadge: boolean; color?: string } | string);
      linkedToColumn?: string; // Add linkedToColumn property to props interface
    }[]);
    entityType: string;  // Changed from enum to string to make it more generic
    // A custom renderer for specific columns.
    // Takes in the column being processed and the row (as any).
    component_renderer?: Snippet<[UnifiedColumn, any]>;
    isLoading: boolean;
    event_id?: number; // Made optional
    event_name?: string; // Added event_name as an optional prop
    idField?: string; // Field to use as unique ID, defaults to primary key of entity
    selectable?: boolean; // New prop to control if checkboxes should be shown
    tableId?: string; // Optional unique identifier for the table (for localStorage)
    identityColumns?: string[]; // New prop to specify which columns should be frozen and always visible
    debounceSearch?: number; // Optional debounce time in milliseconds for search input
    lazyLoad?: boolean; // Optional flag to enable lazy loading of table rows
    initialBatchSize?: number; // Initial number of rows to render when using lazy loading
    batchSize?: number; // Number of rows to add in each batch when using lazy loading
    actions?: Snippet;
    rowActions?: RowAction[]; // New prop for row actions
    forceLoadVisibility?: boolean; // New prop to force load visibility from localStorage on initial render
  } = $props();

  console.log("PROPS", props)

  // Internal states
  let internalVisibleColumns = $state<Record<string, boolean>>({});
  let sortColumn = $state<string | null>(null);
  let sortDirection = $state<'asc' | 'desc'>('asc');
  
  // Get the ID field to use for each row
  const idField = $derived(props.idField || 'id');

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

  // A simplified column interface that doesn't distinguish between regular and custom columns
  export interface UnifiedColumn {
    key: string;
    label: string;
    visible: boolean;
    displayKey: string;
    dataKey: string;
    displayLabel: string;
    custom_field_id?: number;
    format?: "column-snippet" | ((value: any, row: any) => { text: string; isBadge: boolean; color?: string } | string);
    searchable?: boolean;
    dataType?: 'string' | 'number' | 'date' | 'boolean';
    linkedToColumn?: string; 
    frozen?: boolean; // New property to determine if a column should be frozen
  };

  let allColumns = $state<UnifiedColumn[]>([]);
  
  // Export settings
  let exportVisibleColumnsOnly = $state(false);
  let exportFilteredRowsOnly = $state(false);

  // Search states
  let searchTerm = $state('');
  let debouncedSearchTerm = $state('');
  let searchTimeout: number | null = null;
  let isDebouncing = $state(false); // Track if debouncing is active
  
  // Create event dispatcher
  const dispatch = createEventDispatcher<{
    selectionChange: { 
      selectedRows: Set<string | number>; 
      selectedData: any[];
      count: number;
      allSelected: boolean;
      someSelected: boolean;
    };
  }>();

  // Debounce function for search
  function debounceSearch(value: string) {
    // Default debounce time to 300ms if not provided
    const debounceTime = props.debounceSearch ?? 300;
    
    // Set debouncing flag
    isDebouncing = true;
    
    // Clear any existing timeout
    if (searchTimeout !== null) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout to update the debounced search term
    searchTimeout = setTimeout(() => {
      debouncedSearchTerm = value;
      isDebouncing = false; // Reset debouncing flag
      // Save to local storage when the debounced value changes
      saveTableState();
    }, debounceTime) as unknown as number;
  }
  
  // Watch for searchTerm changes to debounce
  $effect(() => {
    debounceSearch(searchTerm);
  });

  // Function to check if a row matches the search term
  function rowMatchesSearch(row: any): boolean {
    if (!debouncedSearchTerm.trim()) return true;
    
    const term = debouncedSearchTerm.trim().toLowerCase();
    
    // Check visible columns
    const hasMatch = allColumns.some(column => {
      // Check if this column is visible directly or via linked parent visibility
      const isDirectlyVisible = internalVisibleColumns[column.displayKey];
      
      // Check if this column is linked to a visible parent column
      const isVisibleViaLinkedParent = column.linkedToColumn && 
                                    internalVisibleColumns[column.linkedToColumn];
      
      // Skip if neither directly visible nor visible via linked parent
      if (!isDirectlyVisible && !isVisibleViaLinkedParent) return false;
      
      const value = row[column.dataKey];
      if (value === null || value === undefined) return false;
      
      // Convert to string and check if it contains the search term
      return String(value).toLowerCase().includes(term);
    });
    
    return hasMatch;
  }

  // Apply search to data
  function applySearch(data: any[]): any[] {
    if (!debouncedSearchTerm.trim()) return data;
    return data.filter(row => rowMatchesSearch(row));
  }

  // Derived filtered data - updated to include search
  const filteredData = $derived<any[]>(
    sortData(applySearch(applyFilters(props.data, filters)), sortColumn, sortDirection)
  );
  
  // New state for selected rows - moved here after filteredData is defined
  let selectedRows = $state<Set<string | number>>(new Set());
  
  // Track if all rows are selected
  const allRowsSelected = $derived(
    filteredData.length > 0 && selectedRows.size === filteredData.length
  );
  
  // Track if some but not all rows are selected
  const someRowsSelected = $derived(
    selectedRows.size > 0 && selectedRows.size < filteredData.length
  );

  // Dispatch selection changes to parent
  $effect(() => {
    dispatch('selectionChange', {
      selectedRows: selectedRows,
      selectedData: getSelectedRowData(),
      count: selectedRows.size,
      allSelected: allRowsSelected,
      someSelected: someRowsSelected
    });
  });

  // Check if a specific row is selected
  function isRowSelected(rowId: string | number): boolean {
    return selectedRows.has(rowId);
  }
  
  // Toggle selection for a single row
  function toggleRowSelection(rowId: string | number): void {
    const newSelectedRows = new Set(selectedRows);
    
    if (newSelectedRows.has(rowId)) {
      newSelectedRows.delete(rowId);
    } else {
      newSelectedRows.add(rowId);
    }
    
    selectedRows = newSelectedRows;
  }
  
  // Toggle selection for all rows
  function toggleAllRows(): void {
    if (allRowsSelected) {
      // Deselect all rows
      selectedRows = new Set();
    } else {
      // Select all rows
      const newSelectedRows = new Set<string | number>();
      filteredData.forEach((row, index) => {
        const rowId = row[idField] !== undefined ? row[idField] : `row_${index}`;
        newSelectedRows.add(rowId);
      });
      selectedRows = newSelectedRows;
    }
  }
  
  // Helper function to get selected row objects
  function getSelectedRowData(): any[] {
    return filteredData.filter((row, index) => {
      const rowId = row[idField] !== undefined ? row[idField] : `row_${index}`;
      return selectedRows.has(rowId);
    });
  }

  // Effect to re-process columns when they change
  $effect(() => {
    if (props.columns) {
      allColumns = populateAllColumns();
      // Reinitialize visibility if needed
      if (Object.keys(internalVisibleColumns).length === 0) {
        internalVisibleColumns = initializeVisibility();
      }
    }
  });

  // Initialize columns with merged custom fields
  function populateAllColumns() {
    // Combine all column types to unify the interface
    let result: UnifiedColumn[] = [];
    
    // Process regular columns
    const regularColumns = props.columns || [];
    regularColumns.forEach((column: any) => {
      // Check if this is a simple string column
      if (typeof column === 'string') {
        result.push({
          key: column,
          label: column,
          visible: true,
          displayKey: column,
          dataKey: column,
          displayLabel: column,
          frozen: props.identityColumns?.includes(column) || false // Set frozen based on identityColumns for backward compatibility
        });
      } else {
        // This is an object-based column
        const displayKey = column.key;
        const dataKey = column.key;
        const isFrozen = column.frozen || (props.identityColumns && props.identityColumns.includes(displayKey)) || false;
        
        result.push({
          ...column,
          displayKey: column.key, // The key as displayed/used in the component
          dataKey: column.key, // The key used to access data in the row object
          displayLabel: column.label, // The label displayed in the header
          frozen: isFrozen // Set frozen state from column property or identityColumns
        });
      }
    });
    
    return result;
  }

  // Initialize visibility from columns' visible property
  function initializeVisibility() {
    const savedState = getSavedState();
    
    if (savedState?.visibility) {
      // Initialize from saved state
      const mergedVisibility: Record<string, boolean> = {};
      
      // Start with all columns with their default visibility
      allColumns.forEach(col => {
        // Frozen columns must always be visible
        if (col.frozen) {
          mergedVisibility[col.displayKey] = true;
        } 
        // Use saved visibility if available, otherwise use column definition
        else if (savedState.visibility[col.displayKey] !== undefined) {
          mergedVisibility[col.displayKey] = savedState.visibility[col.displayKey];
        } else {
          mergedVisibility[col.displayKey] = col.visible;
        }
      });
      
      return mergedVisibility;
    } else {
      // Initialize from provided columns
      let initialVisibility: Record<string, boolean> = {};
      
      // Set visibility for all columns based on their definition
      allColumns.forEach(col => {
        // Frozen columns must always be visible
        if (col.frozen) {
          initialVisibility[col.displayKey] = true;
        } else {
          initialVisibility[col.displayKey] = col.visible;
        }
      });
      
      return initialVisibility;
    }
  }

  // Function to get saved state from localStorage
  function getSavedState() {
    if (!props.tableId) return null;
    
    try {
      const visibilityJson = localStorage.getItem(`${props.tableId}_visibility`);
      const columnsJson = localStorage.getItem(`${props.tableId}_columns`);
      
      if (!visibilityJson) return null;
      
      const visibility = JSON.parse(visibilityJson);
      let columns = null;
      
      if (columnsJson) {
        columns = JSON.parse(columnsJson);
      }
      
      return { visibility, columns };
    } catch (error) {
      console.error("Error loading saved state:", error);
      return null;
    }
  }

  // Function to save column state to localStorage
  function saveColumnState() {
    if (!props.tableId) return;
    
    try {
      const visibilityJson = JSON.stringify(internalVisibleColumns);
      localStorage.setItem(`${props.tableId}_visibility`, visibilityJson);
      
      // Save frozen state
      const columnsJson = JSON.stringify(allColumnsToJsonMap());
      localStorage.setItem(`${props.tableId}_columns`, columnsJson);
    } catch (error) {
      console.error("Error saving column state:", error);
    }
  }

  // Create a JSON representation of columns for saving
  function allColumnsToJsonMap() {
    // Create a new array with just the properties we want to serialize
    return allColumns.map(col => ({
      key: col.key,
      visible: col.visible,
      frozen: col.frozen // Include frozen state in JSON
    }));
  }

  // Toggle column visibility
  function toggleColumn(columnKey: string) {
    // Frozen columns cannot be hidden
    if (allColumns.find(col => col.displayKey === columnKey)?.frozen) {
      return;
    }
    
    internalVisibleColumns[columnKey] = !internalVisibleColumns[columnKey];
    saveColumnState();
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

  // Get formatted value for display
  function getFormattedValue(column: UnifiedColumn, row: any): FormattedValue {
    // Handle columns with formatters
    if (column.format && column.format != "column-snippet") {
      const formatted = column.format(row[column.dataKey], row);
      if (typeof formatted === 'string') {
        return { text: formatted || '-', isBadge: false };
      }
      return formatted as FormattedValue;
    }
    
    // Handle columns without formatters
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
      // Generate a table identifier
      const tableId = props.tableId || 
        (props.event_id && props.entityType ? `event_${props.event_id}_${props.entityType}` : null);
      
      if (tableId) {
        // Save column visibility
        localStorage.setItem(`${tableId}_columns`, JSON.stringify(internalVisibleColumns));
        
        // Save sorting state
        localStorage.setItem(`${tableId}_sort`, JSON.stringify({
          column: sortColumn,
          direction: sortDirection
        }));
        
        // Save filters
        localStorage.setItem(`${tableId}_filters`, JSON.stringify(filters));
        
        // Save search term - we save the raw search term, not the debounced one
        localStorage.setItem(`${tableId}_search`, searchTerm);
        
        // Save export settings
        localStorage.setItem(`${tableId}_export_settings`, JSON.stringify({
          visibleColumnsOnly: exportVisibleColumnsOnly,
          filteredRowsOnly: exportFilteredRowsOnly
        }));
      }
    } catch (e) {
      console.error(`Error saving table state to localStorage:`, e);
    }
  }

  // Function to load table state from localStorage
  function loadTableState() {
    if (!props.tableId) return false;
    
    try {
      // Load column visibility
      const visibilityJson = localStorage.getItem(`${props.tableId}_visibility`);
      const columnsJson = localStorage.getItem(`${props.tableId}_columns`);
      
      if (!visibilityJson) return false;
      
      // Parse saved state
      const savedVisibility = JSON.parse(visibilityJson);
      
      // Check if frozen columns exist in the saved visibility
      const frozenColumns = allColumns.filter(col => col.frozen).map(col => col.displayKey);
      
      // Merge saved visibility with default values for columns not in saved state
      // Ensure frozen columns are always visible
      const mergedVisibility: Record<string, boolean> = {};
      
      // Start with all columns with their default visibility
      allColumns.forEach(col => {
        // Frozen columns must always be visible
        if (col.frozen) {
          mergedVisibility[col.displayKey] = true;
        } 
        // Use saved visibility if available, otherwise use column definition
        else if (savedVisibility[col.displayKey] !== undefined) {
          mergedVisibility[col.displayKey] = savedVisibility[col.displayKey];
        } else {
          mergedVisibility[col.displayKey] = col.visible;
        }
      });
      
      // Set internal state
      internalVisibleColumns = mergedVisibility;
      
      // Load sorting state
      const sortJson = localStorage.getItem(`${props.tableId}_sort`);
      if (sortJson) {
        const savedSort = JSON.parse(sortJson);
        if (savedSort.column && allColumns.some(col => col.displayKey === savedSort.column)) {
          sortColumn = savedSort.column;
          sortDirection = savedSort.direction || 'asc';
        }
      }
      
      // Load filters
      const filtersJson = localStorage.getItem(`${props.tableId}_filters`);
      if (filtersJson) {
        const savedFilters = JSON.parse(filtersJson);
        // Validate each filter to ensure column exists
        filters = savedFilters.filter((filter: FilterCondition) => 
          allColumns.some(col => col.displayKey === filter.column)
        );
        pendingFilters = [...filters];
      }
      
      // Load search term
      const savedSearch = localStorage.getItem(`${props.tableId}_search`);
      if (savedSearch !== null) {
        searchTerm = savedSearch;
        // Setting searchTerm will trigger the debounce via the effect
      }
      
      // Load export settings
      const exportSettingsJson = localStorage.getItem(`${props.tableId}_export_settings`);
      if (exportSettingsJson) {
        const savedExportSettings = JSON.parse(exportSettingsJson);
        exportVisibleColumnsOnly = savedExportSettings.visibleColumnsOnly || false;
        exportFilteredRowsOnly = savedExportSettings.filteredRowsOnly || false;
      }
      
      return true;
    } catch (error) {
      console.error("Error loading table state:", error);
      return false;
    }
  }

  // Set up mutation observer to detect DOM changes
  let mutationObserver: MutationObserver | null = null;
  
  // Function to load more rows
  function loadMoreRows() {
    console.time('Loading more rows');
    visibleRowCount += batchSize;
    console.timeEnd('Loading more rows');
  }
  
  // Set up intersection observer once DOM is mounted
  function setupIntersectionObserver() {
    if (!isLazyLoading) return;
    
    // Clean up any existing observer
    if (intersectionObserver) {
      intersectionObserver.disconnect();
    }
    
    // If tableBottomRef isn't available yet, try to find it
    if (!tableBottomRef) {
      tableBottomRef = document.querySelector('[data-table-bottom-ref]');
      if (!tableBottomRef) {
        console.log('tableBottomRef element not found, will try again later');
        // Try again after a short delay
        setTimeout(() => setupIntersectionObserver(), 100);
        return;
      }
    }
    
    console.log('Setting up intersection observer', tableBottomRef);
    
    // Create new observer
    intersectionObserver = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry && entry.isIntersecting && visibleRowCount < filteredData.length) {
        console.log('Loading more rows triggered by intersection', visibleRowCount, filteredData.length);
        loadMoreRows();
      }
    }, { 
      rootMargin: '200px',
      threshold: 0.1 // Add threshold to ensure more reliable triggering
    });
    
    // Start observing
    try {
      intersectionObserver.observe(tableBottomRef);
    } catch (err) {
      console.error('Error observing table bottom reference:', err);
    }
  }
  
  // Use effect to set up observer when tableBottomRef changes or when filteredData changes
  $effect(() => {
    // Only reset visible row count when filtered data changes significantly
    // This condition prevents resetting during small changes that might happen during search
    if (tableBottomRef && filteredData.length > 0) {
      if (props.lazyLoad) {
        setupIntersectionObserver();
      }
    }
  });

  // Override the component lifecycle
  onMount(() => {
    // Initially populate columns
    allColumns = populateAllColumns();
    
    // Initialize table state
    if (!loadTableState()) {
      // If no saved state, initialize with defaults
      internalVisibleColumns = initializeVisibility();
    }
    
    // Initialize pending filters
    pendingFilters = [...filters];
    
    // Set up observers with a slight delay to ensure DOM is ready
    setTimeout(() => {
      // First attempt at setting up intersection observer
      if (props.lazyLoad) {
        setupIntersectionObserver();
      }
      
      // Set up a resize observer to recalculate positions when window resizes
      const resizeObserver = new ResizeObserver(() => {
        // When resize happens, re-setup the intersection observer
        if (props.lazyLoad) {
          setupIntersectionObserver();
        }
      });
      
      // Set up mutation observer to detect DOM changes that might affect column widths
      mutationObserver = new MutationObserver((mutations) => {
        // Re-initialize intersection observer when DOM changes
        if (props.lazyLoad) {
          setupIntersectionObserver();
        }
      });
      
      // Observe the container element for resize
      const container = document.querySelector('.overflow-x-auto');
      if (container) {
        resizeObserver.observe(container);
        
        // Observe table for DOM changes
        const table = container.querySelector('table');
        if (table && mutationObserver) {
          mutationObserver.observe(table, { 
            childList: true, 
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
          });
        }
      }
    }, 100);
    
    // Additional safety check for lazy loading after a longer delay
    if (props.lazyLoad) {
      setTimeout(() => {
        if (!intersectionObserver || !tableBottomRef) {
          console.log('Delayed setup of intersection observer');
          setupIntersectionObserver();
        }
      }, 500);
    }
    
    return () => {
      // Clean up observers on component destroy
      if (intersectionObserver) intersectionObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
    };
  });
  
  // When component is updated due to tab switching or other events that change visibility
  $effect(() => {
    // If lazy loading is enabled, ensure the observer is set up after the UI updates
    if (props.lazyLoad && filteredData.length > visibleRowCount) {
      // Small delay to allow DOM to update
      setTimeout(() => {
        setupIntersectionObserver();
      }, 10);
    }
  });
  
  // Handle when data changes
  $effect(() => {
    if (props.data.length > 0 && props.lazyLoad) {
      // Reset visible count when data source changes
      visibleRowCount = props.initialBatchSize || 50;
      
      // Re-setup observer with a slight delay to allow DOM to update
      setTimeout(() => {
        setupIntersectionObserver();
      }, 50);
    }
  });

  // Function to export table data to CSV
  function exportToCSV() {
    // Get visible columns and columns linked to visible columns
    const visibleAndLinkedColumns = allColumns.filter(col => {
      // Include directly visible columns
      const isDirectlyVisible = exportVisibleColumnsOnly ? internalVisibleColumns[col.displayKey] : true;
      
      // Include columns linked to visible parent columns
      const isVisibleViaLinkedParent = col.linkedToColumn && 
                                     (exportVisibleColumnsOnly ? internalVisibleColumns[col.linkedToColumn] : true);
      
      return isDirectlyVisible || isVisibleViaLinkedParent;
    });
    
    // Create headers array - use column keys instead of labels
    const headers = visibleAndLinkedColumns.map(col => col.key);
    
    // Get rows based on export settings
    const rowsToExport = exportFilteredRowsOnly 
      ? filteredData 
      : props.data;
    
    // Create rows arrays for each data item
    const rows = rowsToExport.map((row: Record<string, any>) => {
      return visibleAndLinkedColumns.map(col => {
        // Get the value
        const value = row[col.dataKey];
        // For CSV export, we don't want to include the dash for empty values
        return (value === null || value === undefined || value === '') ? '' : 
               (col.format && col.format != "column-snippet") ? getFormattedValue(col, row as Record<string, any>).text : 
               String(value);
      });
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCSVValue).join(','),
      ...rows.map((row: Record<string, any>) => row.map(escapeCSVValue).join(','))
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

  // Watch for filter changes to save state
  $effect(() => {
    if (filters.length > 0 || filters.length === 0) {
      saveTableState();
    }
  });

  function formatCellValue(item: any, column: TableColumn): FormattedValue {
    // Use the column's format function if provided
    if (column.format) {
      const formatted = column.format(item[column.key], item);
      
      // If the formatted value is a complex object with component info
      if (formatted && typeof formatted === 'object' && !Array.isArray(formatted)) {
        if (formatted.component) {
          // Return the component with props
          return { 
            text: formatted.text, 
            isBadge: formatted.isBadge, 
            color: formatted.color, 
            component: formatted.component, 
            props: formatted.props,
            cellStyle: formatted.cellStyle
          } as FormattedValue;
        } else if ('text' in formatted) {
          // Return a standard formatted value
          return { 
            text: formatted.text, 
            isBadge: formatted.isBadge || false, 
            color: formatted.color,
            cellStyle: formatted.cellStyle
          } as FormattedValue;
        }
      }
      return { text: String(formatted), isBadge: false };
    }
    
    // Default formatting if no format function is provided
    return { text: (item[column.key] === null || item[column.key] === undefined || item[column.key] === '') ? '-' : item[column.key].toString(), isBadge: false };
  }

  // Lazy loading states
  let visibleRowCount = $state(props.initialBatchSize || 50); // Default to 50 rows initially
  let batchSize = $derived(props.batchSize || 50); // Default to loading 50 rows at a time
  let isLazyLoading = $derived(props.lazyLoad !== false); // Default to true if not specified
  
  // Element reference for infinite scrolling
  let tableBottomRef: HTMLElement | null = null;
  let intersectionObserver: IntersectionObserver | null = null;
  
  // Get visible rows based on lazy loading settings
  function getVisibleRows(): any[] {
    if (!isLazyLoading) return filteredData;
    return filteredData.slice(0, visibleRowCount);
  }
  
  // Track if we're showing all rows or have more to load
  const hasMoreRows = $derived(filteredData.length > visibleRowCount);
  const visibleRows = $derived(getVisibleRows());

  // Effect to handle force loading visibility from localStorage on initial render
  let visibilityInitialized = $state(false);

  $effect(() => {
    if (!visibilityInitialized && props.forceLoadVisibility && props.tableId && props.columns) {
      visibilityInitialized = true;
      // Small delay to ensure allColumns is populated first
      setTimeout(() => {
        const savedState = getSavedState();
        if (savedState?.visibility) {
          const mergedVisibility: Record<string, boolean> = {};
          
          // Start with all columns with their default visibility
          allColumns.forEach(col => {
            // Frozen columns must always be visible
            if (col.frozen) {
              mergedVisibility[col.displayKey] = true;
            } 
            // Use saved visibility if available, otherwise use column definition
            else if (savedState.visibility[col.displayKey] !== undefined) {
              mergedVisibility[col.displayKey] = savedState.visibility[col.displayKey];
            } else {
              mergedVisibility[col.displayKey] = col.visible;
            }
          });
          
          internalVisibleColumns = mergedVisibility;
        }
      }, 0);
    }
  });
</script>

{#if props.isLoading}
  <div class="w-full">
    <!-- Table header skeleton -->
    <div class="mb-4 flex flex-row justify-between w-full">
      <div class="flex items-center gap-2">
        <div
          class="h-9 w-24 bg-[color:var(--primary-tint)] bg-opacity-30 dark:bg-opacity-20 rounded animate-pulse"
        ></div>
        <div
          class="h-9 w-40 bg-[color:var(--primary-tint)] bg-opacity-30 dark:bg-opacity-20 rounded animate-pulse"
        ></div>
      </div>
      <div class="flex items-center">
        <div
          class="h-9 w-24 bg-[color:var(--primary-tint)] bg-opacity-30 dark:bg-opacity-20 rounded animate-pulse"
        ></div>
      </div>
    </div>

    <!-- Table skeleton -->
    <div class="overflow-x-auto">
      <div
        class="w-full border-b border-[color:var(--primary-tint)] border-opacity-20 dark:border-opacity-20"
      >
        <!-- Skeleton header -->
        <div
          class="grid grid-cols-4 gap-4 py-3 bg-[color:var(--primary-tint)] bg-opacity-10 dark:bg-opacity-10"
        >
          {#each Array(4) as _, i}
            <div
              class="h-6 bg-[color:var(--primary-tint)] bg-opacity-30 dark:bg-opacity-20 rounded animate-pulse"
            ></div>
          {/each}
        </div>

        <!-- Skeleton rows -->
        {#each Array(5) as _, i}
          <div
            class="grid grid-cols-4 gap-4 py-4 border-b border-[color:var(--primary-tint)] border-opacity-10 dark:border-opacity-10"
          >
            {#each Array(4) as _, j}
              <div
                class="h-5 bg-[color:var(--primary-tint)] bg-opacity-20 dark:bg-opacity-15 rounded animate-pulse"
              ></div>
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
      <Button color="primary" class="btn-primary flex items-center gap-1" onclick={openFilterEditor}>
        <FilterSolid class="w-4 h-4" />
        Filters
        {#if filters.length > 0}
          <Badge color="none" class="ml-1 bg-[color:var(--primary-light)] text-white">{filters.length}</Badge>
        {/if}
      </Button>
      
      <div class="relative">
        <Button id="columnToggleButton" color="primary" class="btn-primary flex items-center gap-1">
          <TableColumnOutline class="w-4 h-4" />
          Show/Hide Columns
        </Button>
        <Dropdown triggeredBy="#columnToggleButton" class="w-64">
          <div class="column-dropdown-content max-h-64 overflow-y-auto bg-white rounded shadow-lg py-2">
            {#each allColumns.filter(column => !column.frozen && !column.linkedToColumn) as column}
              <DropdownItem class="px-2 py-1">
                <div class="flex items-center">
                  <Checkbox 
                    checked={internalVisibleColumns[column.displayKey]} 
                    on:change={() => toggleColumn(column.displayKey)} 
                    class="text-left w-full"
                  >
                    <span class="text-sm break-words whitespace-normal">
                      {column.displayLabel}
                    </span>
                  </Checkbox>
                </div>
              </DropdownItem>
            {/each}
          </div>
        </Dropdown>
      </div>
      
      <!-- Slot for custom action buttons -->
      {#if props.actions}
        {@render props.actions()}
      {/if}
    </div>
    
    <!-- Right-aligned buttons -->
    <div class="flex items-center ml-auto">
      <div class="relative">
        <Button id="exportButton" color="primary" class="flex items-center gap-1">
          <TableRowOutline class="w-4 h-4" />
          Export
        </Button>
        <Dropdown triggeredBy="#exportButton" class="w-64 p-3">
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
              <Button size="sm" color="primary" class="w-full" onclick={exportToCSV}>Export to CSV</Button>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  </div>
  
  {#if !props.isLoading}
    <!-- Search bar row - new addition -->
    <div class="mb-4 mt-2 w-full relative">
      <Search size="md" placeholder="Search across all visible columns..." bind:value={searchTerm} class="w-full" />
      {#if isDebouncing}
        <div class="absolute right-8 top-0 h-full flex items-center">
          <div class="animate-pulse">
            <ClockSolid class="w-4 h-4 text-gray-400" />
          </div>
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Filter Editor Modal using Flowbite Modal component -->
  <Modal title="Edit Filters" bind:open={showFilterEditor} autoclose={false} size="lg">
    <!-- Filter edit form -->
    <div class="space-y-4">
      <!-- Add Filter Button -->
      <div class="mb-4">
        <Button color="light" class="flex items-center gap-1" onclick={addFilter}>
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
                    onclick={() => removePendingFilter(filter.id)}
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
          <Button color="red" onclick={clearAllFilters} disabled={pendingFilters.length === 0 && filters.length === 0}>Clear All Filters</Button>
          <Button color="alternative" onclick={cancelFilterEditing}>Cancel</Button>
          <Button color="primary" onclick={saveFilters}>Apply Filters</Button>
        </div>
      </div>
    </svelte:fragment>
  </Modal>
  
  <!-- Improved table container with better overflow handling -->
  <div class="relative rounded-md border border-gray-200 shadow-lg">
    <div class="max-h-[650px] table-wrapper">
      <table class="w-full text-sm text-left border-collapse table-compact themed-table table-auto">
        <thead class="text-xs uppercase border-b align-middle sticky top-0 z-30 bg-[color:var(--primary)] text-white">
          <tr>
            {#if props.selectable !== false}
              <th class="w-10 px-4 py-3 whitespace-nowrap align-middle identity-column-checkbox">
                <Checkbox checked={allRowsSelected} indeterminate={someRowsSelected} on:change={toggleAllRows} class="header-checkbox checkbox" />
              </th>
            {/if}
            {#if props.rowActions && props.rowActions.length > 0}
              <th class="w-10 px-4 py-3 whitespace-nowrap align-middle identity-column-actions">
                <div class="flex justify-center items-center">
                  <CogSolid class="w-4 h-4 text-white" />
                </div>
              </th>
            {/if}
            {#each allColumns as column, colIndex}
              {#if internalVisibleColumns[column.displayKey]}
                {@const frozenColumns = allColumns.filter(c => c.frozen && internalVisibleColumns[c.displayKey]).map(c => c.displayKey)}
                {@const frozenIndex = frozenColumns.indexOf(column.displayKey)}
                {@const isSticky = column.frozen}
                {@const isLastSticky = column.frozen && frozenIndex === (frozenColumns.length - 1)}
                {@const hasRowActions = props.rowActions && props.rowActions.length > 0}
                {@const leftPosition = props.selectable !== false 
                  ? (hasRowActions ? 80 : 40) + (frozenIndex * 150) 
                  : (hasRowActions ? 40 : 0) + (frozenIndex * 150)}
                <th 
                  onclick={() => handleSort(column.displayKey)}
                  class="px-6 py-3 align-middle select-none sortable-header whitespace-nowrap
                         {isSticky ? 'identity-column-sticky' : ''}
                         {isLastSticky ? 'identity-column-last-sticky' : ''}"
                  style={isSticky ? `left: ${leftPosition}px !important; min-width: 150px;` : ''}
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
                </th>
              {/if}
            {/each}
          </tr>
        </thead>
        <tbody>
          {#if filteredData.length === 0}
            <tr class="no-hover">
              <td colspan={Object.values(internalVisibleColumns).filter(v => v).length + (props.selectable !== false ? 1 : 0)} class="py-4 text-center text-gray-500 dark:text-gray-400">
                No rows to display.
              </td>
            </tr>
          {:else}
            {#each visibleRows as row, index (row[idField] !== undefined ? row[idField] : `row_${index}`)}
              <tr class="border-b border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 custom-table-row">
                {#if props.selectable !== false}
                  <td class="w-10 px-4 py-3 whitespace-nowrap align-middle identity-column-checkbox">
                    <Checkbox 
                      checked={isRowSelected(row[idField] !== undefined ? row[idField] : `row_${index}`)} 
                      on:change={() => toggleRowSelection(row[idField] !== undefined ? row[idField] : `row_${index}`)} 
                      class="checkbox"
                    />
                  </td>
                {/if}
                {#if props.rowActions && props.rowActions.length > 0}
                  <td class="w-10 px-2 py-3 whitespace-nowrap align-middle identity-column-actions">
                    <div class="flex items-center space-x-1">
                      {#each props.rowActions as action}
                        <button
                          class="text-{action.color || 'gray'}-600 hover:text-{action.color || 'gray'}-800 dark:text-{action.color || 'gray'}-300 dark:hover:text-{action.color || 'gray'}-200 p-1 rounded-full row-action-button"
                          onclick={() => action.callback(row)}
                          title={action.tooltip || ''}
                        >
                          <svelte:component this={action.icon} class="w-4 h-4" />
                        </button>
                      {/each}
                    </div>
                  </td>
                {/if}
                {#each allColumns as column, colIndex}
                  {#if internalVisibleColumns[column.displayKey]}
                    {@const frozenColumns = allColumns.filter(c => c.frozen && internalVisibleColumns[c.displayKey]).map(c => c.displayKey)}
                    {@const frozenIndex = frozenColumns.indexOf(column.displayKey)}
                    {@const isSticky = column.frozen}
                    {@const isLastSticky = column.frozen && frozenIndex === (frozenColumns.length - 1)}
                    {@const hasRowActions = props.rowActions && props.rowActions.length > 0}
                    {@const leftPosition = props.selectable !== false 
                      ? (hasRowActions ? 80 : 40) + (frozenIndex * 150) 
                      : (hasRowActions ? 40 : 0) + (frozenIndex * 150)}
                    {@const formatted = getFormattedValue(column, row)}
                    <td class="px-6 py-3 whitespace-nowrap
                              {isSticky ? 'identity-column-sticky' : ''}
                              {isLastSticky ? 'identity-column-last-sticky' : ''}"
                        style={`${formatted.cellStyle ?? (!formatted.isBadge && formatted.component ? 'padding: 0;' : '')}${isSticky ? ` left: ${leftPosition}px !important; min-width: 150px;` : ''}`}>
                      {#if !formatted.isBadge && formatted.component}
                        <div class="h-full {!formatted.isBadge && formatted.props?.fitContent ? 'w-auto' : 'w-full'}">
                          <svelte:component this={formatted.component} {...(!formatted.isBadge ? formatted.props : {})} />
                        </div>
                      {:else if formatted.isBadge}
                        <Badge color={formatted.color === "blue" || formatted.color === "green" || formatted.color === "red" || 
                                 formatted.color === "yellow" || formatted.color === "indigo" || formatted.color === "purple" || 
                                 formatted.color === "pink" || formatted.color === "dark" || formatted.color === "primary" || 
                                 formatted.color === "none" ? formatted.color : "blue"}>
                          {formatted.text}
                        </Badge>
                      {:else if column.format == "column-snippet"}
                        <!-- use the custom snippet renderer for this column -->
                        {@render props.component_renderer!(column, row)}
                      {:else}
                        {formatted.text}
                      {/if}
                    </td>
                  {/if}
                {/each}
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
      
      <!-- Lazy loading indicator and loading reference -->
      {#if isLazyLoading && hasMoreRows}
        <div bind:this={tableBottomRef} class="py-4 flex justify-center" data-table-bottom-ref>
          <div class="flex items-center gap-2">
            <Spinner size="5" color="blue" />
            <span>Loading more rows...</span>
          </div>
        </div>
      {:else if filteredData.length > 0}
        <!-- End of table marker - bind this element for intersection observer -->
        <div bind:this={tableBottomRef} class="h-1" data-table-bottom-ref></div>
      {/if}
    </div>
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
  
  /* Custom styling for the header checkbox */
  :global(.header-checkbox) :global(input[type="checkbox"]) {
    /* Removed styling for the unchecked state */
  }
  
  :global(.header-checkbox) :global(input[type="checkbox"]:checked),
  :global(.header-checkbox) :global(input[type="checkbox"]:indeterminate) {
    background-color: var(--primary-dark);
    border-color: var(--primary-dark);
  }
  
  :global(.header-checkbox) :global(input[type="checkbox"]:focus) {
    box-shadow: 0 0 0 0.2rem rgba(var(--primary-dark-rgb), 0.5);
    border-color: var(--primary-dark);
  }

  /* Checkbox vertical alignment */
  :global(table th), :global(table td) {
    vertical-align: middle;
  }
  
  :global(table .checkbox) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Table layout to ensure cells fit content without wrapping */
  :global(.table-auto) {
    table-layout: auto;
    width: max-content;
    min-width: 100%;
  }
  
  :global(.table-auto th),
  :global(.table-auto td) {
    width: max-content;
    white-space: nowrap;
    overflow: visible;
  }
  
  /* Sticky header styles */
  :global(thead.sticky) {
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  :global(thead.sticky th) {
    position: relative;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  /* For dark mode compatibility with the sticky header */
  :global(.dark thead.sticky) {
    background-color: var(--primary-dark);
  }
  
  /* Ensure checkboxes remain clickable when header is sticky */
  :global(thead.sticky .checkbox) {
    position: relative;
    z-index: 11;
  }

  /* FROZEN COLUMNS - SIMPLIFIED UNIFIED IMPLEMENTATION */
  /* Base styles for all frozen columns */
  :global(.identity-column-checkbox),
  :global(.identity-column-actions),
  :global(.identity-column-sticky) {
    position: sticky !important;
    background-color: white; /* Ensure background is solid */
    box-shadow: 4px 0 5px -4px rgba(0, 0, 0, 0.15);
    will-change: transform;
    transform: translateZ(0);
    z-index: 3; /* Base z-index for all sticky columns */
  }

  /* Specific positioning for checkbox column */
  :global(.identity-column-checkbox) {
    left: 0 !important;
    z-index: 5; /* Higher z-index for the checkbox column */
    width: 40px;
    min-width: 40px;
    max-width: 40px;
  }

  /* Specific positioning for actions column */
  :global(.identity-column-actions) {
    left: 40px !important; /* Position after the checkbox column */
    z-index: 4; /* Lower z-index than checkbox but higher than other columns */
    width: 40px;
    min-width: 40px;
    max-width: 40px;
  }

  /* Ensure non-sticky content stays below sticky columns */
  :global(td:not(.identity-column-checkbox):not(.identity-column-actions):not(.identity-column-sticky)) {
    z-index: 1;
    position: relative;
  }

  /* Ensure badges and components inside cells don't override z-index */
  :global(td .badge),
  :global(td [class*="badge"]),
  :global(td div) {
    z-index: 1;
    position: relative;
  }

  /* Visual separator for the last sticky column */
  :global(.identity-column-last-sticky:after) {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 2px; /* Thicker line for the last sticky column */
    pointer-events: none;
    background-color: rgba(0, 0, 0, 0.2); /* Darker color for better visibility */
  }

  /* Visual separator for checkbox column */
  :global(.identity-column-checkbox:after) {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 1px;
    pointer-events: none;
    background-color: rgba(0, 0, 0, 0.1);
  }

  /* Visual separator for actions column */
  :global(.identity-column-actions:after) {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 1px;
    pointer-events: none;
    background-color: rgba(0, 0, 0, 0.1);
  }

  /* Add vertical dividers to all table cells using the same approach as the frozen column dividers */
  :global(td:not(:last-child):not(.identity-column-checkbox):not(.identity-column-actions):not(.identity-column-last-sticky)):after,
  :global(th:not(:last-child):not(.identity-column-checkbox):not(.identity-column-actions):not(.identity-column-last-sticky)):after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 1px;
    pointer-events: none;
    background-color: rgba(0, 0, 0, 0.1);
  }

  /* Ensure all cells have position relative for the :after pseudo-element */
  :global(td), :global(th) {
    position: relative;
  }

  /* Remove the border approach */
  :global(td:not(:last-child)),
  :global(th:not(:last-child)) {
    border-right: none;
  }

  /* Headers special handling */
  :global(thead th) {
    background-color: var(--primary); /* Use primary color for headers */
  }

  /* Headers need higher z-index to stay on top */
  :global(thead .identity-column-checkbox),
  :global(thead .identity-column-actions),
  :global(thead .identity-column-sticky) {
    position: sticky !important;
    top: 0;
    z-index: 20; /* Higher z-index for header cells */
    background-color: var(--primary); /* Keep header color consistent */
  }

  /* Specific z-index values for each type of sticky header to create proper stacking context */
  :global(thead .identity-column-checkbox) {
    z-index: 30; /* Highest z-index for the checkbox header */
  }

  :global(thead .identity-column-actions) {
    z-index: 25; /* Second highest z-index for the actions header */
  }

  :global(thead .identity-column-sticky) {
    z-index: 20; /* Base z-index for other sticky headers */
  }

  /* Add proper background colors to frozen columns in tbody */
  :global(tbody tr:nth-child(odd) .identity-column-checkbox),
  :global(tbody tr:nth-child(odd) .identity-column-actions),
  :global(tbody tr:nth-child(odd) .identity-column-sticky) {
    background-color: var(--primary-tint, #f9fafb);
  }

  :global(tbody tr:nth-child(even) .identity-column-checkbox),
  :global(tbody tr:nth-child(even) .identity-column-actions),
  :global(tbody tr:nth-child(even) .identity-column-sticky) {
    background-color: white;
  }

  /* Ensure frozen columns' background color changes on hover */
  :global(tbody tr:hover .identity-column-checkbox),
  :global(tbody tr:hover .identity-column-actions),
  :global(tbody tr:hover .identity-column-sticky) {
    background-color: var(--primary-light, #f3f4f6);
  }

  /* Ensure proper table scrolling behavior */
  :global(.table-wrapper) {
    position: relative;
    overflow-x: auto;
    overflow-y: auto;
    width: 100%;
    will-change: transform;
    transform: translateZ(0);
    /* Ensure content below doesn't overlap with fixed elements */
    isolation: isolate;
  }

  /* Add fallback CSS variables in case the global ones aren't defined */
  :root {
    --primary: var(--primary, #4B5563);
    --primary-light: var(--primary-light, #E5E7EB);
    --primary-tint: var(--primary-tint, #F9FAFB);
    --primary-dark: var(--primary-dark, #374151);
    --secondary: var(--secondary, #6B7280);
    --accent: var(--accent, #3B82F6);
    --success: var(--success, #10B981);
    --purple: var(--purple, #8B5CF6);
  }

  /* Consolidated table styling */
  :global(.table-compact) {
    border-collapse: collapse;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-radius: 0.375rem;
  }
  
  :global(.table-compact th),
  :global(.table-compact td) {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
  
  :global(.border-b) {
    border-bottom-width: 1px;
    border-color: var(--primary-light, #ddd);
  }

  /* Table theming with global colors */
  :global(.themed-table thead) {
    background-color: var(--primary);
    color: white;
  }

  :global(.themed-table th) {
    font-weight: 600;
  }

  /* Consistent transitions and background colors for all rows and cells */
  :global(tbody tr) {
    transition: background-color 0.2s ease-in-out;
  }
  
  :global(tbody tr td) {
    transition: background-color 0.2s ease-in-out;
    border-color: var(--primary-light);
  }

  /* Define striping at the row level so cells can inherit */
  :global(.themed-table tbody tr:nth-child(odd)) {
    background-color: var(--primary-tint, #f9fafb);
  }
  
  :global(.themed-table tbody tr:nth-child(even)) {
    background-color: white;
  }
  
  :global(.themed-table tbody tr:hover) {
    background-color: var(--primary-light, #f3f4f6);
  }

  /* Badge theming */
  :global(.badge.blue) {
    background-color: var(--accent, #3B82F6);
  }

  :global(.badge.green) {
    background-color: var(--success, #10B981);
  }

  :global(.badge.purple) {
    background-color: var(--purple, #8B5CF6);
  }

  /* Tab theming */
  :global(.tab-active) {
    color: var(--primary, #4B5563);
    border-color: var(--primary, #4B5563);
  }

  :global(.tab-item:hover) {
    color: var(--primary-dark, #374151);
  }

  /* Search and filter controls */
  :global(.search-input) {
    border-color: var(--primary-light, #E5E7EB);
  }

  :global(.dropdown-toggle) {
    background-color: var(--primary, #4B5563);
    color: white;
  }

  /* Adjust the dropdown display for identity columns */
  :global(.identity-column-dropdown) {
    opacity: 0.6;
    pointer-events: none;
  }

  /* Consistent transitions for all rows and cells */
  :global(tbody tr) {
    transition: background-color 0.2s ease-in-out;
  }

  :global(tbody tr td) {
    transition: background-color 0.2s ease-in-out;
  }

  /* Define striping at the row level so cells can inherit */
  :global(tbody tr:nth-child(odd)) {
    background-color: var(--primary-tint, #f9fafb);
  }

  :global(tbody tr:nth-child(even)) {
    background-color: white;
  }

  :global(tbody tr:hover) {
    background-color: var(--primary-light, #f3f4f6);
  }

  /* Row action button styling */
  :global(.row-action-button) {
    background: linear-gradient(to bottom, rgba(249, 250, 251, 0.9), rgba(229, 231, 235, 0.9));
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  :global(.dark .row-action-button) {
    background: linear-gradient(to bottom, rgba(55, 65, 81, 0.9), rgba(31, 41, 55, 0.9));
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  :global(.row-action-button:hover) {
    background: linear-gradient(to bottom, rgba(243, 244, 246, 1), rgba(229, 231, 235, 1));
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  :global(.dark .row-action-button:hover) {
    background: linear-gradient(to bottom, rgba(75, 85, 99, 0.9), rgba(55, 65, 81, 0.9));
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  /* Improve sticky headers to ensure they remain visible during scrolling */
  :global(th.sortable-header) {
    position: relative;
  }

  /* Fix for sticky headers disappearing during scroll */
  :global(thead) {
    position: sticky;
    top: 0;
    z-index: 30;
    background-color: var(--primary);
  }

  :global(thead::after) {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background-color: rgba(0, 0, 0, 0.2);
  }
</style> 
