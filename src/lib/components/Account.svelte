<script lang="ts">
	import { handleError } from "$lib/handleError";
	import { createAccount, signIntoAccount, addStudent, addCoach } from "$lib/supabase";
	import toast from "$lib/toast.svelte";
	import CustomForm from "$lib/components/CustomForm.svelte";
	import { Tabs, TabItem } from "flowbite-svelte";

	interface Props {
		logIn: boolean;
	}

	let { logIn }: Props = $props();
	let newResponses = $state({});
	let validationErrors = $state({});
	let selectedOption = $state("student");

	const handleLogin = async () => {
		try {
			if (
				!newResponses.email ||
				!newResponses.password ||
				newResponses.email == "" ||
				newResponses.password == ""
			) {
				throw new Error("Not all of the fields are complete");
			}
			await signIntoAccount(
				newResponses.email.trim(),
				newResponses.password.trim(),
			);
		} catch (error) {
			handleError(error);
		}
	};

	const handleSignUp = async () => {
		try {
			if (newResponses.password === newResponses.retypePassword) {
				try {
                    const user = await createAccount(newResponses.email, newResponses.password);

                    if (selectedOption === 'student') {
                        await addStudent(user.id, newResponses);
                    } else {
                        await addCoach(user.id, newResponses);
                    }

                    toast.success("Successfully signed up, check your email to confirm.");
                } catch (error) {
                    throw error;
				}
			} else {
				throw new Error("Passwords do not match");
			}
		} catch (error) {
			handleError(error);
		}
	};

	const loginFields = [
		{
			name: "email",
			label: "Email",
			required: true,
			custom_field_type: "email",
			placeholder: "Email",
		},
		{
			name: "password",
			label: "Password",
			required: true,
			custom_field_type: "password",
			placeholder: "Password",
		},
	];

	const commonSignupFields = [
		{
			name: "first_name",
			label: "First Name",
			required: true,
			editable: true,
			hidden: false,
			custom_field_type: "text",
			placeholder: "First Name",

		},
		{
			name: "last_name",
			label: "Last Name",
			required: true,
			editable: true,
			hidden: false,
			custom_field_type: "text",
			placeholder: "Last Name",
		},
		{
			name: "email",
			label: "Email",
			required: true,
			custom_field_type: "email",
			placeholder: "Email",
		},
		{
			name: "password",
			label: "Password",
			required: true,
			custom_field_type: "password",
			placeholder: "Password",
		},
		{
			name: "retypePassword",
			label: "Retype Password",
			required: true,
			custom_field_type: "password",
			placeholder: "Retype Password",
		},
	];

	const studentSignupFields = [
		...commonSignupFields.slice(0, 2), // First Name and Last Name
		{
			name: "grade",
			label: "Grade",
			required: true,
			editable: true,
			hidden: false,
			custom_field_type: "dropdown",
			choices: [
				"4th",
				"5th",
				"6th",
				"7th",
				"8th",
				"9th",
				"10th",
				"11th",
				"12th",
			],
			placeholder: "Select Grade",
		},
		...commonSignupFields.slice(2), // Email, Password, and RetypePassword
	];

	const coachSignupFields = commonSignupFields;
</script>

<div>
	<h1 id="headerText">
		{#if logIn}
			Log In
		{:else}
			Sign Up
		{/if}
	</h1>

	{#if logIn}
		<div class="no-padding">
			<CustomForm
				fields={loginFields}
				bind:newResponses
				bind:validationErrors
				handleSubmit={handleLogin}
			/>
		</div>
	{:else}
		<br />
		<div class="tabs">
			<Tabs tabStyle="pill">
				<TabItem
					on:click={() => (selectedOption = "student")}
					open={selectedOption === "student"}
					title="Student"
				>
					<div class="no-padding">
						<CustomForm
							fields={studentSignupFields}
							bind:newResponses
							bind:validationErrors
							handleSubmit={handleSignUp}
						/>
					</div>
				</TabItem>
				<TabItem
					on:click={() => (selectedOption = "coach")}
					open={selectedOption === "coach"}
					title="Coach"
				>
					<div class="no-padding">
						<CustomForm
							fields={coachSignupFields}
							bind:newResponses
							bind:validationErrors
							handleSubmit={handleSignUp}
						/>
					</div>
				</TabItem>
			</Tabs>
		</div>
	{/if}
</div>

<style>
	#headerText {
		font-size: 50px;
	}

	:global(.no-padding .registrationForm),
	:global(.no-padding .registrationForm form) {
		padding: 0px;
	}

	:global(.tabs [role="tabpanel"]) {
		padding: 0px;
		background: transparent;
	}
</style>
