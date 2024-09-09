<script lang="ts">
	import { page } from "$app/stores";
	import toast from "svelte-french-toast";
	import { formatTime } from "$lib/formatDate";

	import TestView from "$lib/components/TestView.svelte";
	import Button from "$lib/components/Button.svelte";
	import { handleError } from "$lib/handleError";
	import {
		getThisUser,
		getTestTaker
	} from "$lib/supabase";
	import scheme from "$lib/scheme.json";

	console.log("SUP")
	let loading = true;
	let disallowed = true;

	let user;
	(async () => {
		user = await getThisUser();
		console.log("USER_ID", user.id);
		await getTest();
	})();

	async function deleteThisTestsolve() {
		try {
			if (isAdmin) {
				await deleteTestsolve(Number($page.params.id));
				toast.success("Successfully deleted testsolve!");
				window.location.href = "/admin/testsolves";
			}
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	async function getTest() {
		test_taker = await getTestTaker(
			Number($page.params.id), 
			user
		);

		if (test_taker.length === 0) {
			throw new Error(
				"Testsolve with id " + $page.params.id + " doesn't exist!"
			);
		}
		test_taker = test_taker[0];
	}

	async function permissionCheck() {
		try {
			if ((await getThisUserRole()) === 40) {
				console.log("Here");
				disallowed = false;
				isAdmin = true;
			}
			console.log("THERE");
			console.log("TESTSOLVE2", testsolve);
			console.log("TEST_ID", testsolve.test_id);

			if (await checkIfTestCoordinator(testsolve.test_id, user.id)) {
				disallowed = false;
				isAdmin = true;
			}
			console.log("solverIds2", solverIds);
			if (solverIds.has(user.id)) {
				disallowed = false;
				isAdmin = false;
				if (testsolve.status == "Not Started") {
					await updateTestsolve(testsolve.id, { status: "Testsolving" });
					await getTestsolve();
				}
			}

			console.log("testsolve", testsolve);

			loading = false;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}
</script>

{#if loading}
	<p>Loading...</p>
{:else if disallowed}
	<p>You are not authorized!</p>
{:else}
	<TestView
		{test_taker}
	/>
	<br />
{/if}

<style>
</style>
