<script>
	import Account from '$lib/components/Account.svelte';
</script>

<div class="app">
    <Account logIn = true/>

	<main>
		<slot />
	</main>

</div>
