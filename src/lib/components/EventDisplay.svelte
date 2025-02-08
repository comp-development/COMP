<script lang="ts">
    import MarkdownRender from "$lib/components/MarkdownRender.svelte";

    let {
        name,
        date = null,
        logo = null,
        email = null,
        markdown = null,
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
                    <a
                        href="mailto:{email}"
                        class="text-lg text-blue-500 hover:underline">{email}</a
                    >
                </div>
            {/if}
        </div>
    </div>

    <div>
        <div class="summary">
            {#if markdown}
                <MarkdownRender source={markdown} />
            {:else}
                <p>No information yet.</p>
            {/if}
        </div>
    </div>
</div>

<style>
    .summary {
        border: 3px solid var(--primary-tint);
        padding: 20px;
        margin: 10px;
        margin-top: 0px;
        border-radius: 15px;
        text-align: left;
    }

    .grid {
        grid-template-columns: 35% auto;
        column-gap: 40px;
        width: 100%;
        padding: 40px;
        padding-top: 20px;
    }
</style>
