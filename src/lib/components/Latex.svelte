<script lang="ts">
	import { displayLatex } from "$lib/latexStuff";
	import { unifiedLatexToHast } from "@unified-latex/unified-latex-to-hast";
	import { processLatexViaUnified } from "@unified-latex/unified-latex";
	import rehypeStringify from "rehype-stringify";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";

	export let style = "";
	export let value;

	// fetch images
	let rendered;

	async function loadLatex() {
		try {
			rendered = await displayLatex(value);

			let unifiedStr = processLatexViaUnified()
				.use(unifiedLatexToHast)
				.use(rehypeStringify)
				.processSync(value).value;
		} catch (error) {
			handleError(error);
		}
	}

	loadLatex();
</script>

{#if rendered}
	<span {style}>{@html rendered.out}</span>
{:else}
	<span {style}>Loading...</span>
{/if}
