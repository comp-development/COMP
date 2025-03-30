<script lang="ts">
  import {
    Button,
    Card,
    Input,
    Label,
    Textarea,
    Checkbox,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Modal,
  } from "flowbite-svelte";
  import {
    PenSolid,
    TrashBinSolid,
    PlusOutline,
    FilterDollarSolid,
    EyeSolid,
    LockOpenSolid,
  } from "flowbite-svelte-icons";
  import DeleteConfirmationModal from "$lib/components/DeleteConfirmationModal.svelte";
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";
  
  type Addon = {
    addon_id?: string;
    key: string;
    label: string;
    price_cents: number;
    description?: string;
    enabled: boolean;
    visible: boolean;
    addon_table?: string;
    event_id?: number;
  };
  
  let {
    addons = $bindable<Addon[]>([]),
    onUpdate = $bindable((updatedAddons: Addon[]) => {}),
    onDelete = $bindable((addonId: string) => {}),
    entityType = $bindable("students"),
  } = $props();

  let showAddonModal = $state(false);
  let showDeleteModal = $state(false);
  let currentAddon = $state<Addon | null>(null);
  let editMode = $state(false);
  let addonToDelete = $state<Addon | null>(null);
  let validationErrors = $state<Record<string, string>>({});

  const defaultAddon: Addon = {
    key: "",
    label: "",
    price_cents: 0,
    description: "",
    enabled: true,
    visible: true,
  };

  function editAddon(addon: Addon) {
    currentAddon = { ...addon };
    editMode = true;
    showAddonModal = true;
  }

  function addNewAddon() {
    currentAddon = { ...defaultAddon };
    editMode = false;
    showAddonModal = true;
  }

  function confirmDeleteAddon(addon: Addon) {
    addonToDelete = addon;
    showDeleteModal = true;
  }

  async function handleDeleteAddon() {
    try {
      if (addonToDelete && addonToDelete.addon_id) {
        await onDelete(addonToDelete.addon_id);
        showDeleteModal = false;
        addonToDelete = null;
      }
    } catch (error) {
      handleError(error as Error);
    }
  }

  function validateAddon(addon: Addon) {
    const errors: Record<string, string> = {};
    
    if (!addon.key || addon.key.trim() === "") {
      errors.key = "Key is required";
    }
    
    if (!addon.label || addon.label.trim() === "") {
      errors.label = "Label is required";
    }
    
    if (isNaN(addon.price_cents) || addon.price_cents < 0) {
      errors.price_cents = "Price must be a non-negative number";
    }

    // Check for duplicate keys
    if (editMode) {
      const duplicateKey = addons.some(a => 
        a.key === addon.key && a.addon_id !== addon.addon_id
      );
      if (duplicateKey) {
        errors.key = "Key must be unique";
      }
    } else {
      const duplicateKey = addons.some(a => a.key === addon.key);
      if (duplicateKey) {
        errors.key = "Key must be unique";
      }
    }
    
    return errors;
  }

  async function saveAddon() {
    try {
      if (!currentAddon) return;
      
      const errors = validateAddon(currentAddon);
      
      if (Object.keys(errors).length > 0) {
        validationErrors = errors;
        return;
      }
      
      validationErrors = {};
      
      let updatedAddons: Addon[];
      if (currentAddon && editMode && currentAddon.addon_id) {
        // Create a local copy to prevent "possibly null" errors
        const addonToUpdate = {...currentAddon};
        const addonId = currentAddon.addon_id;
        
        updatedAddons = addons.map(addon => 
          addon.addon_id === addonId ? addonToUpdate : addon
        );
      } else {
        updatedAddons = [...addons, {...currentAddon}];
      }
      
      await onUpdate(updatedAddons);
      showAddonModal = false;
    } catch (error) {
      handleError(error as Error);
    }
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }
  
  function handleInputChange(e: Event, field: keyof Addon) {
    if (!currentAddon) return;
    const target = e.target as HTMLInputElement;
    
    if (field === 'price_cents') {
      currentAddon[field] = Number(target.value);
    } else if (field === 'key' || field === 'label' || field === 'description') {
      currentAddon[field] = target.value;
    }
  }
  
  function handleCheckboxChange(e: Event, field: 'visible' | 'enabled') {
    if (!currentAddon) return;
    const target = e.target as HTMLInputElement;
    currentAddon[field] = target.checked;
  }
</script>

<div class="addon-manager">
  <div class="mb-4">
    <h2 class="text-xl font-semibold mb-3">{entityType.charAt(0).toUpperCase() + entityType.slice(1)} Addons</h2>
    <div class="flex justify-end">
      <Button color="blue" size="sm" on:click={addNewAddon}>
        <PlusOutline class="mr-2 h-4 w-4" />
        Add Addon
      </Button>
    </div>
  </div>

  {#if addons.length === 0}
    <Card>
      <p class="text-center py-4">No addons found. Click "Add Addon" to create one.</p>
    </Card>
  {:else}
    <Table>
      <TableHead>
        <TableHeadCell>Key</TableHeadCell>
        <TableHeadCell>Label</TableHeadCell>
        <TableHeadCell>Price</TableHeadCell>
        <TableHeadCell>Visible</TableHeadCell>
        <TableHeadCell>Enabled</TableHeadCell>
        <TableHeadCell>Actions</TableHeadCell>
      </TableHead>
      <TableBody>
        {#each addons as addon}
          <TableBodyRow>
            <TableBodyCell>{addon.key}</TableBodyCell>
            <TableBodyCell>
              <div>
                <div class="font-medium">{addon.label}</div>
                {#if addon.description}
                  <div class="text-sm text-gray-500">{addon.description}</div>
                {/if}
              </div>
            </TableBodyCell>
            <TableBodyCell>{formatPrice(addon.price_cents)}</TableBodyCell>
            <TableBodyCell>
              <div class="flex justify-center">
                {#if addon.visible}
                  <EyeSolid class="text-green-500 h-5 w-5" />
                {/if}
              </div>
            </TableBodyCell>
            <TableBodyCell>
              <div class="flex justify-center">
                {#if addon.enabled}
                  <span class="text-green-500">✓</span>
                {:else}
                  <LockOpenSolid class="text-red-500 h-5 w-5" />
                {/if}
              </div>
            </TableBodyCell>
            <TableBodyCell>
              <div class="flex space-x-2">
                <Button size="xs" color="blue" on:click={() => editAddon(addon)}>
                  <PenSolid class="h-3 w-3" />
                </Button>
                <!-- <Button size="xs" color="red" on:click={() => confirmDeleteAddon(addon)}>
                  <TrashBinSolid class="h-3 w-3" />
                </Button> -->
              </div>
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  {/if}
</div>

<!-- Addon Modal -->
<Modal bind:open={showAddonModal} size="md" title={editMode ? "Edit Addon" : "Add New Addon"}>
  <form on:submit|preventDefault={saveAddon} class="space-y-4">
    <div>
      <Label for="key" class="mb-2">Key <span class="text-red-500">*</span></Label>
      <Input 
        id="key" 
        placeholder="addon_key"
        value={currentAddon?.key || ''} 
        on:input={(e) => handleInputChange(e, 'key')}
        color={validationErrors.key ? "red" : "base"} 
      />
      {#if validationErrors.key}
        <p class="text-red-500 text-sm mt-1">{validationErrors.key}</p>
      {/if}
    </div>
    
    <div>
      <Label for="label" class="mb-2">Label <span class="text-red-500">*</span></Label>
      <Input 
        id="label" 
        placeholder="Display Label"
        value={currentAddon?.label || ''}
        on:input={(e) => handleInputChange(e, 'label')}
        color={validationErrors.label ? "red" : "base"} 
      />
      {#if validationErrors.label}
        <p class="text-red-500 text-sm mt-1">{validationErrors.label}</p>
      {/if}
    </div>
    
    <div>
      <Label for="price_cents" class="mb-2">Price (in cents) <span class="text-red-500">*</span></Label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FilterDollarSolid class="w-4 h-4 text-gray-500" />
        </div>
        <Input 
          id="price_cents" 
          type="number" 
          placeholder="Price in cents (e.g. 1000 for $10.00)"
          class="pl-10"
          value={currentAddon?.price_cents || 0}
          on:input={(e) => handleInputChange(e, 'price_cents')}
          color={validationErrors.price_cents ? "red" : "base"} 
        />
      </div>
      {#if validationErrors.price_cents}
        <p class="text-red-500 text-sm mt-1">{validationErrors.price_cents}</p>
      {:else}
        <p class="text-sm text-gray-500 mt-1">This will appear as {formatPrice(currentAddon?.price_cents || 0)}</p>
      {/if}
    </div>
    
    <div>
      <Label for="description" class="mb-2">Description</Label>
      <Textarea 
        id="description" 
        placeholder="Optional description"
        value={currentAddon?.description || ''}
        on:input={(e) => handleInputChange(e, 'description')}
        rows={3}
      />
    </div>
    
    <div class="flex space-x-4">
      <div>
        <Checkbox
          checked={currentAddon?.visible || false}
          on:change={(e) => handleCheckboxChange(e, 'visible')}
          id="visible"
        >
          Visible to users
        </Checkbox>
      </div>
      <div>
        <Checkbox
          checked={currentAddon?.enabled || false}
          on:change={(e) => handleCheckboxChange(e, 'enabled')} 
          id="enabled"
        >
          Enabled
        </Checkbox>
      </div>
    </div>
    
    <div class="flex justify-end space-x-2">
      <Button color="alternative" on:click={() => (showAddonModal = false)}>Cancel</Button>
      <Button type="submit" color="blue">Save</Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirmation Modal -->
<DeleteConfirmationModal
  isShown={showDeleteModal}
  title="Delete Addon"
  message="Are you sure you want to delete this addon? This action cannot be undone."
  onCancel={() => (showDeleteModal = false)}
  onConfirm={handleDeleteAddon}
/>

<style>
  .addon-manager {
    width: 100%;
  }
</style> 