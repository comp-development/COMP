<script>
	import "carbon-components-svelte/css/white.css";
	import { Loading } from "carbon-components-svelte";
</script>

<div class="outerDiv">
    <h1>Loading... Hang Tight</h1>
	<div class="flex">
		<Loading withOverlay={false} />
	</div>
</div>

<style>
	.outerDiv {
		display: block;
	}
</style>