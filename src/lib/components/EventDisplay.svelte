<script lang="ts">
  import MarkdownRender from "$lib/components/MarkdownRender.svelte";
  import { Button } from "flowbite-svelte";

  let {
    id = null,
    name,
    date = null,
    logo = null,
    email = null,
    markdown = null,
    editable = false,
  } = $props();
</script>

<div class="grid">
  <div class="flex">
    <div>
      <h1 class="text-4xl font-extrabold text-center">{name}</h1>
      {#if date}
        <h2 class="text-2xl text-center">{date}</h2>
      {/if}

      {#if logo}
        <div class="flex justify-center">
          <img
            src={logo}
            alt="{name} logo"
            class="w-32 h-32 rounded-full shadow-ld"
          />
        </div>
      {/if}

      {#if email}
        <div class="text-center">
          <a href="mailto:{email}" class="text-lg text-blue-500 hover:underline"
            >{email}</a
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

  {#if markdown}
    <div class="flex">
      <MarkdownRender source={markdown} />
    </div>
  {/if}
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
