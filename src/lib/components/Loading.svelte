<script>
	import { Spinner } from 'flowbite-svelte';
</script>

<div class="outerDiv">
    <h2>Loading... Hang Tight!</h2>
	<div class="flex">
		<Spinner size={20} />
	</div>
</div>

<style>
	.outerDiv {
		display: block;
	}

	h2 {
		margin-bottom: 30px;
	}
</style>