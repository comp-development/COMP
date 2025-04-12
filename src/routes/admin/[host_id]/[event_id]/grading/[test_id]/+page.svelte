<script lang="ts">
	import { page } from "$app/stores";
	import Grading from "$lib/components/Grading.svelte";
	console.log("bonjour")
</script>

<Grading
	event_id={parseInt($page.params.event_id)}
	testId={parseInt($page.params.test_id)}
/>
