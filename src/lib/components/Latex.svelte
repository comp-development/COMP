<script lang="ts">
	import { displayLatex } from "$lib/latexStuff";
	import { unifiedLatexToHast } from "@unified-latex/unified-latex-to-hast";
	import { processLatexViaUnified } from "@unified-latex/unified-latex";
	import rehypeStringify from "rehype-stringify";

	interface Props {
		style?: string;
		value: any;
	}

	let { style = "", value }: Props = $props();

	// fetch images
	let rendered = $state();

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
