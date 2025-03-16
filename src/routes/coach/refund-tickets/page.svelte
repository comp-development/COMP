<script lang="ts">
    import Loading from "$lib/components/Loading.svelte";
    import CreateOrgForm from "$lib/components/CreateOrgForm.svelte";
  
    let loading = $state(true);
  
    (async () => {
      loading = false;
    })();
  </script>
  
  {#if loading}
    <Loading />
  {:else}
    <br />
    <h1 class="header">Create Organization</h1>
    <CreateOrgForm typeOrgForm="add" />
  {/if}
  