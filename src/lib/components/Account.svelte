<script lang="ts">
	import { handleError } from "$lib/handleError";
	import { createAccount, signIntoAccount } from "$lib/supabase";
	import { Input, Button, ButtonGroup, InputAddon } from 'flowbite-svelte';
  	import { EnvelopeSolid, EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
	import toast from "$lib/toast.svelte";

	interface Props {
		logIn: boolean;
	}

	let show = $state(false);
	let show1 = $state(false);
	let { logIn }: Props = $props();
	let loading = false;
	let email: string = $state();
	let password: string = $state();
	let retypePassword: string = $state();

	const handleLogin = async () => {
		try {
			if (!email || !password || email == "" || password == "") {
				throw new Error("Not all of the fields are complete");
			}
			loading = true;
			await signIntoAccount(email.trim(), password.trim());
		} catch (error) {
			handleError(error);
		} finally {
			loading = false;
		}
	};

	const handleSignUp = async () => {
		try {
			if (password == retypePassword) {
				try {
					loading = true;
					await createAccount(email, password);
					toast.success("Successfully signed up, check your email to confirm.");
				} catch (error) {
					throw error;
				} finally {
					loading = false;
				}
			} else {
				throw new Error("Passwords do not match");
			}
		} catch (error) {
			handleError(error);
		}
	};
</script>

<div>
	<h1 id="headerText">
		{#if logIn}
			Log In
		{:else}
			Sign Up
		{/if}
	</h1>
	<ButtonGroup class="w-full">
		<InputAddon>
			<EnvelopeSolid class="w-4 h-4" />
		</InputAddon>
		<Input bind:value={email} type="email" placeholder="Email" />
	</ButtonGroup>
	<br /><br />
	<div>
		<ButtonGroup class="w-full">
		  <InputAddon>
			<button onclick={() => (show = !show)}>
			  {#if show}
				<EyeOutline class="w-4 h-4" />
			  {:else}
				<EyeSlashOutline class="w-4 h-4" />
			  {/if}
			</button>
		  </InputAddon>
		  <Input id="show-password1" bind:value={password} type={show ? 'text' : 'password'} placeholder="Password" />
		</ButtonGroup>
	</div>
	<br />
	{#if !logIn && password != ""}
		<div>
			<ButtonGroup class="w-full">
			  <InputAddon>
				<button onclick={() => (show1 = !show1)}>
				  {#if show1}
					<EyeOutline class="w-6 h-6" />
				  {:else}
					<EyeSlashOutline class="w-6 h-6" />
				  {/if}
				</button>
			  </InputAddon>
			  <Input id="show-password1" bind:value={retypePassword} type={show ? 'text' : 'password'} placeholder="Retype Password" />
			</ButtonGroup>
		</div>
		<br />
	{/if}
	<div class="profileButtons">
		{#if logIn}
			<Button onclick={handleLogin} pill>Submit</Button>
		{:else}
			<Button onclick={handleSignUp} pill>Submit</Button>
		{/if}
	</div>
</div>

<style>
	#headerText {
		font-size: 50px;
		margin-bottom: 30px;
	}
</style>
