<script lang="ts">
  import Loading from "$lib/components/Loading.svelte";

  async function onLoad() {
    window.location.href = "./student";
  }

  onLoad();
</script>

<br />
<Loading />
