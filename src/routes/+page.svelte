<script lang="ts">
	import Button from "$lib/components/Button.svelte";
	import { handleError } from "$lib/handleError";
	import { editUser, getThisUser, getUser } from "$lib/supabase";
	import { TextInput } from "carbon-components-svelte";
    import toast from "svelte-french-toast";

	let user;
	let user_id;
	let loading: boolean;

	async function onLoad() {
		loading = true;
		let thisUser = await getThisUser();
		user_id = thisUser?.id;
		user = await getUser(user_id);
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

	<div class="flex">
		<div class="row">
			<TextInput
				class="inputField"
				labelText="First Name"
				placeholder="Type here..."
				bind:value={user.first_name}
			/>
			<TextInput
				class="inputField"
				labelText="Last Name"
				placeholder="Type here..."
				bind:value={user.last_name}
			/>
		</div>
	</div>

	{#if user.isAdmin}
		<div class="flex">
			<div class="row">
				<TextInput
					class="inputField"
					labelText="Grade"
					placeholder="Type here..."
					bind:value={user.grade}
				/>
				<TextInput
					class="inputField"
					labelText="ContestDojo ID"
					placeholder="Type here..."
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
					bind:value={user.email}
				/>
				<TextInput
					class="inputField"
					labelText="Division"
					placeholder="Type here..."
					bind:value={user.division}
				/>
			</div>
		</div>
	{/if}

	<br />
	<div class="flex">
		<Button title="Submit" action={onSubmit} />
	</div>
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
