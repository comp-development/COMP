<script lang="ts">
    import Markdown from 'svelte-exmarkdown';

    export let source: string = "";
</script>

<Markdown md={source} />