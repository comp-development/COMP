<script>
	import { editUser, getUser, transferUser } from "$lib/supabase";
	import { page } from "$app/stores";
	import Loading from "$lib/components/Loading.svelte";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import Button from "$lib/components/Button.svelte";
	import { TextInput } from "carbon-components-svelte";

	let userId = $page.params.id;
	let user = {};
	let loading = true;

	async function fetchUser() {
		try {
			user = await getUser(userId);
			loading = false;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	async function onSubmitTransferUser() {
		try {
			await transferUser(userId, !user.isAdmin);
			toast.success("User successfully transferred.");
		} catch (error) {
			handleError(error);
		}
	}

	async function onUpdateUser() {
		try {
			await editUser(userId, user.isAdmin, user);
			toast.success("User successfully transferred.");
		} catch (error) {
			handleError(error);
		}
	}

	fetchUser();
</script>

{#if loading}
	<Loading />
{:else if !user.student_id && !user.admin_id}
	<p>User does not exist</p>
{:else}
	<div style="padding: 10px;">
		<h1>{user.first_name} {user.last_name}</h1>
		<p>ID: {user.isAdmin ? user.admin_id : user.student_id}</p>
		<br />
		<Button
			title="Change User Role To {user.isAdmin ? 'Student' : 'Admin'}"
			action={onSubmitTransferUser}
		/>
		<br /><br />

		<div class="row">
			{#each Object.entries(user) as [key, value]}
				{#if key != "isAdmin" && key != "student_id"}
					<div>
						{#if !user.isAdmin}
							<TextInput
								class="inputField"
								labelText={key}
								placeholder="Type here..."
								bind:value={user[key]}
							/>
							<br />
						{:else}
							<p><strong>{key}:</strong> {value}</p>
						{/if}
					</div>
				{/if}
			{/each}
		</div>

		{#if !user.isAdmin}
			<Button title="Update User Information" action={onUpdateUser} />
			<br /><br />
		{/if}
	</div>
{/if}
