<script lang="ts">
  import {
    Button,
    Input,
    Helper,
    Select,
    Label,
    Datepicker,
    Textarea,
    Radio,
    Checkbox,
    Modal,
    Spinner,
  } from "flowbite-svelte";
  
  import { createEventDispatcher, onMount } from "svelte";

  // Props
  const props = $props<{
    open: boolean;
    columns: any[];
    rowData: any;
    title?: string;
  }>();

  // For handling form state
  let formValues = $state<Record<string, any>>({});
  let formErrors = $state<Record<string, string | null>>({});
  let isSubmitting = $state(false);
  
  // Dispatch events
  const dispatch = createEventDispatcher<{
    close: void;
    save: { data: Record<string, any> };
  }>();

  // Initialize form values from rowData
  $effect(() => {
    if (props.rowData && props.open) {
      formValues = { ...props.rowData };
    }
  });

  // Handle form submission
  function handleSubmit() {
    if (validateForm()) {
      isSubmitting = true;
      
      // Dispatch save event with updated values
      dispatch('save', { data: formValues });
      
      // Reset state
      isSubmitting = false;
    }
  }

  // Close the modal
  function handleClose() {
    dispatch('close');
  }

  // Validate the form before submission
  function validateForm(): boolean {
    let isValid = true;
    
    // Clear previous errors
    formErrors = {};
    
    // Validate only editable fields
    props.columns.forEach(column => {
      if (column.editable) {
        const value = formValues[column.key];
        
        // Check required fields
        if (column.required && (value === undefined || value === null || value === '')) {
          formErrors[column.key] = `${column.label} is required`;
          isValid = false;
        }
        
        // Additional validation logic could be added here based on dataType
        if (column.dataType === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            formErrors[column.key] = 'Please enter a valid email address';
            isValid = false;
          }
        }
        
        if (column.dataType === 'number' && value !== undefined && value !== null) {
          if (isNaN(Number(value))) {
            formErrors[column.key] = 'Please enter a valid number';
            isValid = false;
          }
        }
      }
    });
    
    return isValid;
  }

  // Determine input type based on column data type
  function getInputType(column: any): string {
    switch (column.dataType) {
      case 'number': return 'number';
      case 'email': return 'email';
      case 'date': return 'date';
      case 'boolean': return 'checkbox';
      default: return 'text';
    }
  }
</script>

<Modal 
  title={props.title || "Edit Item"} 
  bind:open={props.open} 
  size="lg" 
  autoclose={false}
>
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      {#each props.columns as column}
        {#if column.visible !== false}
          <div class="space-y-2">
            <Label for={column.key}>{column.label}</Label>
            
            {#if column.dataType === 'boolean'}
              <div class="flex items-center h-10">
                <Checkbox
                  id={column.key}
                  bind:checked={formValues[column.key]}
                  disabled={!column.editable}
                />
              </div>
            {:else if column.format === "textarea"}
              <Textarea
                id={column.key}
                rows="3"
                bind:value={formValues[column.key]}
                disabled={!column.editable}
                placeholder={`Enter ${column.label}`}
              />
            {:else}
              <Input
                id={column.key}
                type={getInputType(column)}
                bind:value={formValues[column.key]}
                disabled={!column.editable}
                placeholder={`Enter ${column.label}`}
              />
            {/if}
            
            {#if formErrors[column.key]}
              <Helper color="red">{formErrors[column.key]}</Helper>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
    
    <div class="flex justify-end space-x-2 pt-4 border-t border-gray-200">
      <Button color="alternative" on:click={handleClose}>Cancel</Button>
      <Button type="submit" disabled={isSubmitting}>
        {#if isSubmitting}
          <Spinner size="sm" class="mr-2" />
          Saving...
        {:else}
          Save Changes
        {/if}
      </Button>
    </div>
  </form>
</Modal> 