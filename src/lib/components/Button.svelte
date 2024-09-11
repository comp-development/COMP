<script lang="ts">
	import { Button } from "carbon-components-svelte";
	export let title;
	export let disabled = false;
	export let action = null;
	export let classs = "button";
	export let icon = null;
	export let href: string | null = null;
	export let fontSize = "1em";
	export let buttonColor = null;
	export let bwidth = "30em";
	console.log("DISABLED",disabled)
</script>

{#if href}
	<Button
		kind="primary"
		class={classs}
		disabled={disabled}
		size="small"
		{href}
		type="submit"
		style="width: {bwidth}; border-radius: 2.5em; margin: 0; padding: 0;"
	>
		<div style="margin-left: auto; margin-right: auto;">
			<p style="font-size: {fontSize};font-weight: 500;padding: 0;">
				{#if icon}
					<i class={icon} />&nbsp
				{/if}

				{title}
			</p>
		</div>
	</Button>
{:else}
	<Button
		kind="primary"
		class={classs}
		disabled={disabled}
		size="small"
		on:click={action}
		type="submit"
		style="width: {bwidth}; border-radius: 2.5em; margin: 0; padding: 0;"
	>
		<div style="margin-left: auto; margin-right: auto;">
			<p style="font-size: {fontSize};font-weight: 500;padding: 0;">
				{#if icon}
					<i class={icon} />&nbsp
				{/if}

				{title}
			</p>
		</div>
	</Button>
{/if}