<script lang="ts">
  import "carbon-components-svelte/css/white.css";
</script>

<div class="header">
  <img src="/favicon.png" alt={"COMP_logo"} width="50" height="50" />
  <h4 style="">COMP</h4>
</div>

<style>
  .header {
    padding: 5px;
    /* color: var(--text-color-light); */
    display: flex;
    align-items: center;
    background-color: var(--primary);
  }

  .header h4 {
    font-weight: 600;
    /* font-variant: small-caps; */
    color: white;
  }
</style>
