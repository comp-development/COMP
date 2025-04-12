<script>
    import { page } from "$app/stores";
	import FileUpload from "$lib/components/FileUpload.svelte";
    const host_id = parseInt($page.params.host_id);
    const event_id = parseInt($page.params.event_id);
</script>

<FileUpload host_id={host_id} event_id={event_id}/>

<style>
	/* Your CSS styles here */
</style>
