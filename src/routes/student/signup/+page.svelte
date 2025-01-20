<script lang="ts">
	import { getStudent, editUser } from "$lib/supabase";
	import { Form, TextInput } from "carbon-components-svelte";
	import { user } from "$lib/sessionStore";
	import { get } from "svelte/store";
	import toast from "svelte-french-toast";
	import Button from "$lib/components/Button.svelte";
	import { handleError } from "$lib/handleError";

	let first_name = $state("");
	let last_name = $state("");
	let grade = $state("");
	let loading = $state(true);

	user.subscribe(async (user) => {
		try {
			await getStudent(user!.id);
			// If student already exists, then no need to signup.
			window.location.replace("/student");
		} catch (e) {
			let error = e as any;
			console.error(e);
			if (
				!(error.code === "PGRST116") &&
				!error.message.includes("Cannot read properties of null")
			) {
				throw error;
			}
		}
		loading = false;
	});

	async function registerStudent(e: Event) {
		e.preventDefault();
		try {
			// TODO: should check that is not admin/organizer/coach?
			get(user);

			if (first_name.length > 100 || last_name.length > 100) {
				throw new Error(
					"Name is too long (if this is an actual issue, please notify us)",
				);
			} else if (first_name.length == 0 || last_name.length == 0) {
				throw new Error("You must enter a first and last name");
			} else if (grade.length == 0) {
				throw new Error("You must enter your grade");
			} else {
				const updates = {
					student_id: get(user)!.id,
					first_name,
					last_name,
					grade,
					email: get(user)!.email,
				};

				await editUser(get(user)!.id, false, updates);
				toast.success("Successfully added student profile.");
				setTimeout(() => {
					window.location.replace("/student");
				}, 1000);
			}
		} catch (e) {
			const error: any = e;
			handleError(error);
		}
	}
</script>

{#if loading}
	<p>Loading...</p>
{:else}
	<h1>Welcome to COMP</h1>
	<br />
	<br />

	<div class="flex profileButtons">
		<div>
			<Form on:submit={registerStudent}>
				<div class="row">
					<TextInput
						placeholder="First Name"
						class="inputField"
						bind:value={first_name}
					/>
					<TextInput
						placeholder="Last Name"
						class="inputField"
						bind:value={last_name}
					/>
				</div>
				<br />
				<TextInput placeholder="Grade" class="inputField" bind:value={grade} />
				<br />
				<Button title="Submit" fontSize="1.5em" />
				<br />
				<br />
			</Form>
			<br />
		</div>
	</div>
	<br />
{/if}

<style>
</style>
