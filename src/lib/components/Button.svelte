<script lang="ts">
  import { Button } from "carbon-components-svelte";
  interface Props {
    title: any;
    disabled?: boolean;
    action?: any;
    classs?: string;
    icon?: any;
    href?: string | null;
    fontSize?: string;
    buttonColor?: any;
    bwidth?: string;
  }

  let {
    title,
    disabled = false,
    action = null,
    classs = "button",
    icon = null,
    href = null,
    fontSize = "1em",
    buttonColor = null,
    bwidth = "30em",
  }: Props = $props();
</script>

{#if href}
  <Button
    kind="primary"
    class={classs}
    {disabled}
    size="small"
    {href}
    type="submit"
    style="width: {bwidth}; border-radius: 2.5em; margin: 0; padding: 0;"
  >
    <div style="margin-left: auto; margin-right: auto;">
      <p style="font-size: {fontSize};font-weight: 500;padding: 0;">
        {#if icon}
          <i class={icon}></i>&nbsp
        {/if}

        {title}
      </p>
    </div>
  </Button>
{:else}
  <Button
    kind="primary"
    class={classs}
    {disabled}
    size="small"
    onclick={action}
    type="submit"
    style="width: {bwidth}; border-radius: 2.5em; margin: 0; padding: 0;"
  >
    <div style="margin-left: auto; margin-right: auto;">
      <p style="font-size: {fontSize};font-weight: 500;padding: 0;">
        {#if icon}
          <i class={icon}></i>&nbsp
        {/if}

        {title}
      </p>
    </div>
  </Button>
{/if}
