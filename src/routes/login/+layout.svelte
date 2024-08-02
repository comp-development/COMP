<script>
	import Account from '$lib/components/Account.svelte';
    import Banner from '$lib/components/Banner.svelte';
</script>

<div class="app">
    <Banner/>
	<main>
        <div class="flex">
            <div style="background-color: #6fc963; border-radius: 10px; width: fit-content; padding: 20px;position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 10px;">
                <Account logIn=true/>
                <br>
            <br>

            <div class="flex">
                <div class="bottomSection svelte-qnamzc">
                    <a size="lg" class="link svelte-qnamzc" href="/signup">
                        Sign Up
                    </a>
                </div>
            </div>
            </div>
            
        </div>
		<slot />
	</main>

</div>