<script>
  import { marked } from "marked";
  let { source = $bindable() } = $props();
</script>

<div class="summary">
  <div class="officialMarkdown">{@html marked(source ?? "")}</div>
</div>

<style>
  .summary {
    border: 3px solid var(--primary-light);
    padding: 20px;
    margin: 10px;
    margin-top: 0px;
    border-radius: 15px;
    text-align: left;
  }

  .officialMarkdown {
    box-sizing: border-box;
    display: block;
  }

  /* Add specific markdown styling */
  :global(.officialMarkdown ul) {
    list-style-type: disc;
    font-size: 1rem;
    padding-left: 2em;
    margin: 1em 0;
  }

  :global(.officialMarkdown ol) {
    list-style-type: decimal;
    font-size: 1rem;
    padding-left: 2em;
    margin: 1em 0;
  }

  :global(.officialMarkdown a) {
    color: #0066cc;
    text-decoration: underline;
  }

  :global(.officialMarkdown a:hover) {
    color: #003366;
  }

  :global(.officialMarkdown h1) {
    font-size: 2em;
    margin: 0.67em 0;
  }

  :global(.officialMarkdown h2) {
    font-size: 1.5em;
    margin: 0.83em 0;
  }

  :global(.officialMarkdown h3) {
    font-size: 1.17em;
    margin: 1em 0;
  }

  :global(.officialMarkdown p) {
    margin-bottom: 5px;
  }

  :global(.officialMarkdown blockquote) {
    margin: 1em 40px;
    padding-left: 1em;
    border-left: 3px solid #ccc;
  }

  :global(.officialMarkdown code) {
    font-family: monospace;
    background-color: #f5f5f5;
    padding: 0.2em 0.4em;
    border-radius: 3px;
  }

  :global(.officialMarkdown pre) {
    background-color: #f5f5f5;
    padding: 1em;
    overflow-x: auto;
    margin: 1em 0;
  }

  :global(.officialMarkdown pre code) {
    background-color: transparent;
    padding: 0;
  }
</style>
