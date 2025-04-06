<script lang="ts">
  import MarkdownRender from "$lib/components/MarkdownRender.svelte";
  import { Badge, Button, Input, Textarea, Checkbox } from "flowbite-svelte";
  import { updateHost, updateEvent } from "$lib/supabase";
  import { onMount } from "svelte";
  import toast from "$lib/toast.svelte";
  import { handleError } from "$lib/handleError";
    import InfoToolTip from "$lib/components/InfoToolTip.svelte";

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
    if (
      editingField === "max_team_size" ||
      editingField === "ticket_price_cents"
    ) {
      if (
        newResponses[editingField] == null ||
        newResponses[editingField] < 0
      ) {
        toast.error(
          `${editingField.replace("_", " ")} cannot be null or negative`,
        );
        newResponses[editingField] = 0;
        return;
      }
    }
    hasEdits = true;
  }
</script>

<div class="grid">
  <div class="flex">
    <div>
      {#if event}
        <h1
          class="text-4xl font-extrabold text-center m-0 p-0 {editable ? 'editableField' : ''}"
          style="min-height: 45px;"
          onclick={() => editable && (editingField = "event_name")}
        >
          {#if editingField === "event_name"}
            <Input
              type="text"
              bind:value={newResponses.event_name}
              on:input={handleEdit}
              onmouseleave={() => (editingField = null)}
            />
          {:else}
            {newResponses.event_name || "None"}
          {/if}
        </h1>
        <h2 class="text-2xl text-center flex {editable ? 'editableField' : ''}" style="min-height: 50px;">
          <span
            class="mr-3"
            onclick={() => editable && (editingField = "event_date")}
          >
            {#if editingField === "event_date"}
              <Input
                type="date"
                bind:value={newResponses.event_date}
                on:input={handleEdit}
                onmouseleave={() => (editingField = null)}
              />
            {:else}
              {newResponses.event_date || "None"}
            {/if}
          </span>
          {#if editable}
            <span
              class="mr-2 flex {editable ? 'editableField' : ''}"
              onclick={() => editable && (editingField = "published")}
            >
              {#if editingField === "published"}
                <Checkbox
                  bind:checked={newResponses.published}
                  on:change={handleEdit}
                  onmouseleave={() => (editingField = null)}
                >
                  Public
                </Checkbox>
              {:else if newResponses.published}
                <Badge large color="green">Public</Badge>
              {:else}
                <Badge large color="red">Not Public</Badge>
              {/if}
            </span>
          {/if}
          <span
            class="mr-2 flex {editable ? 'editableField' : ''}"
            onclick={() => editable && (editingField = "reg_frozen")}
          >
            {#if editingField === "reg_frozen"}
              <Checkbox
                bind:checked={newResponses.reg_frozen}
                on:change={handleEdit}
                onmouseleave={() => (editingField = null)}
              >
                Registration Frozen
              </Checkbox>
            {:else if newResponses.reg_frozen}
              <Badge large color="red">Registration Closed</Badge>
            {:else}
              <Badge large color="green">Registration Open</Badge>
            {/if}
          </span>
        </h2>
      {:else}
        <h1
          class="text-4xl font-extrabold text-center"
          onclick={() => editable && (editingField = "host_name")}
        >
          {#if editingField === "host_name"}
            <Input
              type="text"
              bind:value={newResponses.host_name}
              on:input={handleEdit}
              onmouseleave={() => (editingField = null)}
            />
          {:else}
            {newResponses.host_name || "None"}
          {/if}
        </h1>
      {/if}

      <br />

      {#if (event && event.logo) || host.logo}
        <div
          class="flex justify-center"
          onclick={() => editable && (editingField = "logo")}
        >
          {#if editingField === "logo"}
            <Input
              type="text"
              bind:value={newResponses.logo}
              on:input={handleEdit}
              onmouseleave={() => (editingField = null)}
            />
          {:else if event ? newResponses.logo || host.logo : newResponses.logo}
            <img
              src={event ? newResponses.logo || host.logo : newResponses.logo}
              alt="logo"
              class="w-32 h-32 rounded-full shadow-ld {editable ? 'editableField' : ''}"
            />
          {:else}
            <p>No logo</p>
          {/if}
        </div>
      {/if}

      <br /><br />

      {#if (event && event.email) || host.email}
        <div
          class="text-center {editable ? 'editableField' : ''}"
          style="min-height: 45px;"
          onclick={() => editable && (editingField = "email")}
        >
          {#if editingField === "email"}
            <Input
              type="email"
              bind:value={newResponses.email}
              on:input={handleEdit}
              onmouseleave={() => (editingField = null)}
            />
          {:else}
            <a
              href="mailto:{event
                ? newResponses.email || host.email
                : newResponses.email}"
              class="text-lg text-blue-500 hover:underline"
            >
              {event
                ? newResponses.email || host.email || "None"
                : newResponses.email || "None"}
            </a>
          {/if}
        </div>
      {/if}

      {#if hasEdits}
        <div class="flex justify-end mt-4">
          <Button pill color="primary" onclick={handleSave}>Save Edits</Button>
        </div>
      {/if}
    </div>
  </div>

  <div class="otherContainer">
    {#if editable}
      <div class="flex" style="justify-content: end;">
        <InfoToolTip text="To edit, click on the text that you want to change and update the input field." />
      </div>
    {/if}
    
    {#if (event && event.summary) || host.summary || editable}
      <div
        class="{editable ? 'editableField' : ''}"
        onclick={() => editable && (editingField = "summary")}
      >
        {#if editingField === "summary"}
          <Textarea
            bind:value={newResponses.summary}
            on:input={handleEdit}
            onmouseleave={() => (editingField = null)}
            rows={5}
          />
        {:else}
          <MarkdownRender
            source={newResponses.summary || host.summary}
          />
        {/if}
      </div>
    {/if}

    {#if event}
      <div class="flex" style="min-height: 45px;">
        <div class="flex" style="justify-content: left;">
          <div class="navigationalWidth">
            <p
              class="flex {editable ? 'editableField' : ''}"
              onclick={() => editable && (editingField = "max_team_size")}
            >
              <span
                style="font-weight: 600; min-width: fit-content; margin-right: 5px;"
                >Max Team Size:</span
              >
              {#if editingField === "max_team_size"}
                <Input
                  type="number"
                  bind:value={newResponses.max_team_size}
                  on:input={handleEdit}
                  onmouseleave={() => (editingField = null)}
                />
              {:else}
                {newResponses.max_team_size || 0}
              {/if}
            </p>
          </div>
          {#if !event.eventbrite_event_id}
            <div class="navigationalWidth">
              <p
                class="flex {editable ? 'editableField' : ''}"
                onclick={() => editable && (editingField = "ticket_price_cents")}
              >
                <span
                  style="font-weight: 600; min-width: fit-content; margin-right: 5px;"
                  >Cost per Student:</span
                >
                {#if editingField === "ticket_price_cents"}
                  <Input
                    type="number"
                    bind:value={newResponses.ticket_price_cents}
                    on:input={handleEdit}
                    onmouseleave={() => (editingField = null)}
                  />
                {:else}
                  {(newResponses.ticket_price_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00'}
                {/if}
              </p>
            </div>
          {/if}
        </div>
      </div>
      <br />
    {/if}
  </div>
</div>

<style>
  .grid {
    grid-template-columns: 35% minmax(0, 1fr);
    column-gap: 40px;
    width: 100%;
    padding: 40px;
    padding-top: 20px;
  }

  .otherContainer {
    max-width: 100%;
  }

  .navigationalWidth {
    width: 350px;
  }

  @media only screen and (max-width: 900px) {
    .grid {
      grid-template-columns: 97vw;
      padding: 10px;
    }

    .grid div {
      max-width: 100%;
    }

    .navigationalWidth {
      width: fit-content;
      padding-right: 10px;
    }
  }

  :global(.editableField) {
    cursor: url(/edit.svg) 0 16, auto !important;
  }
</style>
