<script>
	import { Button } from 'flowbite-svelte';
</script>

<h1 class="header" style="margin-bottom: 30px;margin-bottom: 20px;">Error!</h1>
<p>
	The buttons on our calculator stopped working
	<i class="ri-emotion-unhappy-line"></i><br>
	This is likely because you've tried navigating to a page that doesn't exist!
</p>
<br />
<div class="flex">
	<Button href="/" pill>Navigate Home</Button>
</div>

<style>
	:root {
		text-align: center;
	}
</style>
