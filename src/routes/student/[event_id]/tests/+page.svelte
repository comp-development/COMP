<script lang="ts">
	import { page } from '$app/stores';
	import Button from "$lib/components/Button.svelte";
	import { formatDate } from "$lib/formatDate";
	import Loading from "$lib/components/Loading.svelte";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import {
		getThisUser,
        getEventTests
	} from "$lib/supabase";

	let loading = true;

	let availableTests = [];
	let tests = [];
	let user = null;

	(async () => {
		user = await getThisUser();
		console.log("USER", user)
		await getTests();
	})();

	async function getTests() {
		try {
			loading = true;
			tests = await getEventTests($page.params.event_id)
			loading = false;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}
</script>

<br />
<h1>Tests</h1>
<br />
<div>
	{#if loading}
		<Loading />
	{:else if tests.length === 0}
		<p>No available tests!</p>
	{:else}
		<div class="buttonContainer">
			{#each tests as test}
				<div>
					<div
						class="problemContainer"
					>
						<h4>
							{test.test_name}
						</h4>
						<div style="margin-top: 10px">
							{#if test.opening_time}
								<Button
									href="./tests/{test.test_id}"
									title={"Start"}
								/>
							{:else}
								<Button
									href="./tests/{test.test_id}"
									title={"Not Open"}
									disabled
								/>
							{/if}
							
						</div>
					</div>
					
				</div>
			{/each}
			<Button
				href="."
				title={"Back"}
			/>
		</div>
		<br />
	{/if}
</div>

<style>
	.problemContainer {
		background-color: white;
		border: 3px solid var(--primary-tint);
		padding: 10px;
		margin: 10px;
		border-radius: 20px;
		text-align: center;
		font-weight: bold;
		text-decoration: none;
		display: block;
		color: var(--text-color-dark);
		transition: all 0.3s ease; /* Add transition for smooth hover effect */
	}

	.problemContainer:hover {
		transform: scale(1.05); /* Scale up on hover */
		border-width: 5px; /* Increase border width on hover */
	}

	.buttonContainer {
		flex-direction: column; /* Align children vertically */
		align-items: center; /* Center children horizontally */
		justify-content: center; /* Center children vertically */
		margin: 0 auto; /* Center the container horizontally on the page */
		width: 70%;
	}
</style>
