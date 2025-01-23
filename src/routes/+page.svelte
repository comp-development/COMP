<script lang="ts">

	import Button from "$lib/components/Button.svelte";
	import { handleError } from "$lib/handleError";
	import { editUser, getThisUser, getUser, isAdmin } from "$lib/supabase";
	import { TextInput } from "carbon-components-svelte";
	import toast from "$lib/toast.svelte";

	let user = $state();
	let user_id;
	let loading: boolean = $state();

	async function onLoad() {
		loading = true;
		let thisUser = await getThisUser();
		user_id = thisUser?.id;
		const user_type = await isAdmin(user_id);
		console.log("user_type", user_type)
		if (user_type) {
			window.location.href='./admin'
		} else {
			window.location.href='./student'
		}
		loading = false;
	}

	async function onSubmit() {
		try {
			const userAdmin = user.isAdmin;
			delete user.isAdmin;
			delete user[userAdmin ? "admin_id" : "student_id"];

			console.log(user_id);
			await editUser(user_id, userAdmin, user);
			user.isAdmin = userAdmin;
			user[userAdmin ? "admin_id" : "student_id"] = user_id;

			toast.success("Successfully updated");
		} catch (error) {
			handleError(error);
		}
	}

	onLoad();
</script>

<br />
{#if loading}
	<p>Loading...</p>
{:else}
	<h1>Welcome, {user.first_name}</h1>
	<!--
	<div class="flex">
		<div class="row">
			<TextInput
				class="inputField"
				labelText="First Name"
				placeholder="Type here..."
				disabled
				bind:value={user.first_name}
			/>
			<TextInput
				class="inputField"
				labelText="Last Name"
				placeholder="Type here..."
				disabled
				bind:value={user.last_name}
			/>
		</div>
	</div>

	{#if !user.isAdmin}
		<div class="flex">
			<div class="row">
				<TextInput
					class="inputField"
					labelText="Grade"
					placeholder="Type here..."
					disabled
					bind:value={user.grade}
				/>
				<TextInput
					class="inputField"
					labelText="ContestDojo ID"
					placeholder="Type here..."
					disabled
					bind:value={user.contest_dojo_id}
				/>
			</div>
		</div>
		<div class="flex">
			<div class="row">
				<TextInput
					class="inputField"
					labelText="Email"
					placeholder="Type here..."
					disabled
					bind:value={user.email}
				/>
				<TextInput
					class="inputField"
					labelText="Division"
					placeholder="Type here..."
					disabled
					bind:value={user.division}
				/>
			</div>
		</div>
	{/if}

	<br />
	<div class="flex">
		<Button title="Submit" action={onSubmit} />
	</div>-->
{/if}

<style>
	h1 {
		text-align: center;
	}

	.row {
		width: 50%;
		padding: 20px;
		min-width: 700px;
	}
</style>
