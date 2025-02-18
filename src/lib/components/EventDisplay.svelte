<script lang="ts">
  import MarkdownRender from "$lib/components/MarkdownRender.svelte";
  import { Badge, Button } from "flowbite-svelte";

  let { id = null, event = null, host, editable = false } = $props();
</script>

<div class="grid">
  <div class="flex">
    <div>
      <h1 class="text-4xl font-extrabold text-center">
        {event && event.event_name ? event.event_name : host.host_name}
      </h1>
      {#if event}
        <h2 class="text-2xl text-center flex">
          <span class="mr-2">{event.event_date}</span>
          {#if event.published}
            <Badge large color="green">Public</Badge>
          {:else}
            <Badge large color="red">Not Public</Badge>
          {/if}
        </h2>
      {/if}

      {#if (event && event.logo) || host.logo}
        <div class="flex justify-center">
          <img
            src={event && event.logo ? event.logo : host.logo}
            alt="logo"
            class="w-32 h-32 rounded-full shadow-ld"
          />
        </div>
      {/if}

      {#if (event && event.email) || host.email}
        <div class="text-center">
          <a
            href="mailto:{event && event.email ? event.email : host.email}"
            class="text-lg text-blue-500 hover:underline"
            >{event && event.email ? event.email : host.email}</a
          >
        </div>
      {/if}

      {#if editable}
        <br />
        <Button pill color="primary" href={`./${id}/edit`}
          >Edit Information</Button
        >
      {/if}
    </div>
  </div>

  <div>
    {#if event}
      <p><span style="font-weight: 600;">Max Team Size:</span> {event.max_team_size}</p>
      <p><span style="font-weight: 600;">Cost per Student:</span> {event.ticket_price_cents} cents</p>
      <br />
    {/if}
    {#if (event && event.summary) || host.summary}
      <MarkdownRender
        source={event && event.summary ? event.summary : host.summary}
      />
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
