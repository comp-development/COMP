<script lang="ts">
  import MarkdownRender from "$lib/components/MarkdownRender.svelte";
  import { Badge, Button, Input, Textarea, Checkbox } from "flowbite-svelte";
  import { updateHost, updateEvent } from "$lib/supabase";
  import { onMount } from "svelte";
  import toast from "$lib/toast.svelte";
  import { handleError } from "$lib/handleError";

  let { id = null, event = null, host, editable = false } = $props();
  let newResponses = $state({});
  let validationErrors = $state({});
  let isEditing = $state(false);
  let editingField = $state(null);
  let hasEdits = $state(false);

  onMount(() => {
    if (event) {
      newResponses = { ...event };
      delete newResponses["host"];
    } else {
      newResponses = { ...host };
    }
  });

  async function handleSave() {
    try {
      if (event) {
        await updateEvent(event.event_id, newResponses);
        toast.success("Event information updated successfully");
      } else {
        await updateHost(host.host_id, newResponses);
        toast.success("Host information updated successfully");
      }
      isEditing = false;
      editingField = null;
      hasEdits = false;
    } catch (error) {
      handleError(error);
    }
  }

  function handleEdit() {
    hasEdits = true;
  }
</script>

<div class="grid">
  <div class="flex">
    <div>
      {#if event}
        <h1 class="text-4xl font-extrabold text-center" onmouseenter={() => editable && (editingField = 'event_name')} onmouseleave={() => editingField = null}>
          {#if editingField === 'event_name'}
            <Input
              type="text"
              bind:value={newResponses.event_name}
              on:input={handleEdit}
              on:blur={() => editingField = null}
            />
          {:else}
            {newResponses.event_name}
          {/if}
        </h1>
        <h2 class="text-2xl text-center flex">
          <span class="mr-2" onmouseenter={() => editable && (editingField = 'event_date')} onmouseleave={() => editingField = null}>
            {#if editingField === 'event_date'}
              <Input
                type="date"
                bind:value={newResponses.event_date}
                on:input={handleEdit}
                on:blur={() => editingField = null}
              />
            {:else}
              {newResponses.event_date}
            {/if}
          </span>
          <span class="mr-2" onmouseenter={() => editable && (editingField = 'published')} onmouseleave={() => editingField = null}>
            {#if editingField === 'published'}
              <Checkbox
                bind:checked={newResponses.published}
                on:change={handleEdit}
                on:blur={() => editingField = null}
              >
                Public
              </Checkbox>
            {:else}
              {#if newResponses.published}
                <Badge large color="green">Public</Badge>
              {:else}
                <Badge large color="red">Not Public</Badge>
              {/if}
            {/if}
          </span>
        </h2>
      {:else}
        <h1 class="text-4xl font-extrabold text-center" onmouseenter={() => editable && (editingField = 'host_name')} onmouseleave={() => editingField = null}>
          {#if editingField === 'host_name'}
            <Input
              type="text"
              bind:value={newResponses.host_name}
              on:input={handleEdit}
              on:blur={() => editingField = null}
            />
          {:else}
            {newResponses.host_name}
          {/if}
        </h1>
      {/if}

      <br /><br />

      {#if (event && event.logo) || host.logo}
        <div class="flex justify-center" onclick={() => editable && (editingField = 'logo')}>
          {#if editingField === 'logo'}
            <Input
              type="text"
              bind:value={newResponses.logo}
              on:input={handleEdit}
              on:blur={() => editingField = null}
            />
          {:else}
            <img src={newResponses.logo} alt="logo" class="w-32 h-32 rounded-full shadow-ld" />
          {/if}
        </div>
      {/if}

      <br /><br />

      {#if (event && event.email) || host.email}
        <div class="text-center" onmouseenter={() => editable && (editingField = 'email')} onmouseleave={() => editingField = null}>
          {#if editingField === 'email'}
            <Input
              type="email"
              bind:value={newResponses.email}
              on:input={handleEdit}
              on:blur={() => editingField = null}
            />
          {:else}
            <a href="mailto:{newResponses.email}" class="text-lg text-blue-500 hover:underline">
              {newResponses.email}
            </a>
          {/if}
        </div>
      {/if}

      {#if hasEdits}
        <div class="flex justify-end mt-4">
          <Button pill color="primary" on:click={handleSave}>Save Edits</Button>
        </div>
      {/if}
    </div>
  </div>

  <div>
    {#if event}
      <p onmouseenter={() => editable && (editingField = 'max_team_size')} onmouseleave={() => editingField = null}>
        <span style="font-weight: 600;">Max Team Size:</span>
        {#if editingField === 'max_team_size'}
          <Input
            type="number"
            bind:value={newResponses.max_team_size}
            on:input={handleEdit}
            on:blur={() => editingField = null}
          />
        {:else}
          {newResponses.max_team_size}
        {/if}
      </p>
      <p onmouseenter={() => editable && (editingField = 'ticket_price_cents')} onmouseleave={() => editingField = null}>
        <span style="font-weight: 600;">Cost per Student:</span>
        {#if editingField === 'ticket_price_cents'}
          <Input
            type="number"
            bind:value={newResponses.ticket_price_cents}
            on:input={handleEdit}
            on:blur={() => editingField = null}
          />
        {:else}
          {newResponses.ticket_price_cents} cents
        {/if}
      </p>
      <br />
    {/if}
    {#if (event && event.summary) || host.summary}
      <div onmouseenter={() => editable && (editingField = 'summary')} onmouseleave={() => editingField = null}>
        {#if editingField === 'summary'}
          <Textarea
            bind:value={newResponses.summary}
            on:input={handleEdit}
            on:blur={() => editingField = null}
            rows={5}
          />
        {:else}
          <MarkdownRender source={newResponses.summary != null ? newResponses.summary : ""} />
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .grid {
    grid-template-columns: 35% auto;
    column-gap: 40px;
    width: 100%;
    padding: 40px;
    padding-top: 20px;
  }
</style>
