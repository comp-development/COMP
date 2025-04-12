<script>
    import { page } from "$app/stores";
	import FileUpload from "$lib/components/FileUpload.svelte";
    const host_id = parseInt($page.params.host_id);
</script>

<FileUpload host_id={host_id}/>

<style>
	/* Your CSS styles here */
</style>
