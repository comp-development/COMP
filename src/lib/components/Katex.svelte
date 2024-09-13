<script>
    import { math } from 'mathlifier';
    import AsciiMathParser from 'asciimath2tex';
    import { onMount } from 'svelte';

    const parser = new AsciiMathParser();
    export let value = '';
    export let size = '1.2em'

    let tex = '';
    let container;

    $: {
        tex = renderMath(parser.parse(value));
        if (container) {
            container.innerHTML = tex;
        }
    }

    function renderMath(texString) {
        const parsed = math(texString);
        return parsed.includes("ParseError") ? value : parsed;
    }

    onMount(() => {
        container.innerHTML = tex;
    });
</script>

<div bind:this={container} style="font-size: {size};"></div>