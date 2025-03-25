<script lang="ts">
  import { Button, Modal, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Label, Input } from "flowbite-svelte";
  import { CartSolid, GiftBoxSolid } from "flowbite-svelte-icons";
  import { user } from "$lib/sessionStore";
  import { getEventAddons } from "$lib/supabase";
  import { supabase } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";
  import type { Tables } from "../../../db/database.types";

  const props = $props<{
    event_id: number;
    host_id: number;
    student_event_id?: number | null;
    team_id?: number | null;
    org_event_id?: number | null;
    buttonLabel?: string;
  }>();

  // Set defaults for optional props
  const student_event_id = props.student_event_id ?? null;
  const team_id = props.team_id ?? null;
  const org_event_id = props.org_event_id ?? null;
  const buttonLabel = props.buttonLabel ?? "Purchase Add-ons";

  // Determine entity type based on which ID is provided
  const getEntityType = (): 'students' | 'teams' | 'orgs' => {
    if (student_event_id) return 'students';
    if (team_id) return 'teams';
    if (org_event_id) return 'orgs';
    // Default to orgs (should never happen due to component requirements)
    return 'orgs';
  };

  const entityType = getEntityType();

  let isOpen = $state(false);
  let addons = $state<Tables<"addons">[]>([]);
  let loading = $state(true);
  let quantities = $state<Record<string, number>>({});
  let hasAddons = $state(false);

  // Check if there are add-ons available on component initialization
  $effect(async () => {
    try {
      loading = true;
      const availableAddons = await getEventAddons(props.event_id, entityType);
      hasAddons = availableAddons.length > 0;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      hasAddons = false;
    } finally {
      loading = false;
    }
  });
  
  async function loadAddons() {
    try {
      loading = true;
      addons = await getEventAddons(props.event_id, entityType);
      
      // Initialize quantities to 0
      quantities = addons.reduce((acc, addon) => {
        acc[addon.addon_id] = 0;
        return acc;
      }, {} as Record<string, number>);
      
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      loading = false;
    }
  }

  function openModal() {
    loadAddons();
    isOpen = true;
  }

  function incrementQuantity(addonId: string) {
    quantities[addonId] = (quantities[addonId] || 0) + 1;
  }

  function decrementQuantity(addonId: string) {
    if (quantities[addonId] > 0) {
      quantities[addonId] = quantities[addonId] - 1;
    }
  }

  function setQuantity(addonId: string, value: string) {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      quantities[addonId] = numValue;
    }
  }

  function getTotalItems() {
    return Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  }

  function getTotalPrice() {
    return addons.reduce((sum, addon) => {
      return sum + (addon.price_cents * (quantities[addon.addon_id] || 0));
    }, 0);
  }

  async function purchaseAddons() {
    try {
      const selectedAddons = Object.entries(quantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([addonId, quantity]) => ({
          addon_id: addonId,
          quantity
        }));
      
      if (selectedAddons.length === 0) {
        return;
      }
      
      const { data, error } = await supabase.auth.getSession();
      if (error != null) {
        handleError(error);
      }
      const token = data.session?.access_token ?? null;
      
      const requestBody = {
        event_id: props.event_id,
        host_id: props.host_id,
        token,
        addons: selectedAddons,
        student_event_id,
        team_id,
        org_event_id
      };
      
      const response = await fetch("/api/purchase-addon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      const text = await response.text();
      if (response.ok) {
        document.location.assign(text);
      } else {
        handleError(new Error(text));
      }
      
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }
</script>

{#if hasAddons}
  <Button color="primary" outline pill on:click={openModal}>
    <GiftBoxSolid class="w-4 h-4 me-2" />
    {buttonLabel}
  </Button>

  <Modal bind:open={isOpen} size="xl" title="Purchase Add-ons">
    {#if loading}
      <div class="flex justify-center p-8">
        <div class="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    {:else if addons.length === 0}
      <p>No add-ons are available for this event.</p>
    {:else}
      <div class="p-4">
        <Table striped={true}>
          <TableHead>
            <TableHeadCell>Add-on</TableHeadCell>
            <TableHeadCell>Price</TableHeadCell>
            <TableHeadCell>Quantity</TableHeadCell>
            <TableHeadCell>Total</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each addons as addon}
              <TableBodyRow>
                <TableBodyCell>{addon.addon_name}</TableBodyCell>
                <TableBodyCell>${(addon.price_cents / 100).toFixed(2)}</TableBodyCell>
                <TableBodyCell>
                  <div class="flex items-center">
                    <button 
                      class="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300" 
                      on:click={() => decrementQuantity(addon.addon_id)}>-</button>
                    <Input
                      type="number"
                      min="0"
                      class="mx-2 w-16 text-center"
                      value={quantities[addon.addon_id] || 0}
                      on:input={(e) => {
                        const target = e.currentTarget as HTMLInputElement;
                        setQuantity(addon.addon_id, target.value);
                      }}
                    />
                    <button 
                      class="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300" 
                      on:click={() => incrementQuantity(addon.addon_id)}>+</button>
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  ${((addon.price_cents * (quantities[addon.addon_id] || 0)) / 100).toFixed(2)}
                </TableBodyCell>
              </TableBodyRow>
            {/each}
            <TableBodyRow>
              <TableBodyCell><strong>Total</strong></TableBodyCell>
              <TableBodyCell></TableBodyCell>
              <TableBodyCell><strong>{getTotalItems()} items</strong></TableBodyCell>
              <TableBodyCell><strong>${(getTotalPrice() / 100).toFixed(2)}</strong></TableBodyCell>
            </TableBodyRow>
          </TableBody>
        </Table>
        
        <div class="flex justify-end mt-4">
          <Button color="primary" disabled={getTotalItems() === 0} on:click={purchaseAddons}>
            <CartSolid class="w-4 h-4 me-2" />
            Checkout
          </Button>
        </div>
      </div>
    {/if}
  </Modal>
{/if} 