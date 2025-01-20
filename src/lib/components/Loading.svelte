<script>
	import { Spinner } from 'flowbite-svelte';
</script>

<div class="outerDiv">
    <h1>Loading... Hang Tight!</h1>
	<div class="flex">
		<Spinner size={20} />
	</div>
</div>

<style>
	.outerDiv {
		display: block;
	}

	h1 {
		margin-bottom: 30px;
	}
</style>