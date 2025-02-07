<script lang="ts">
	import { handleError } from "$lib/handleError";
	import { createAccount, signIntoAccount } from "$lib/supabase";
	import { Input, Button, ButtonGroup, InputAddon, Tabs, TabItem, Label } from "flowbite-svelte";
	import {
		EnvelopeSolid,
		EyeOutline,
		EyeSlashOutline,
	} from "flowbite-svelte-icons";
	import toast from "$lib/toast.svelte";

	interface Props {
		logIn: boolean;
	}

	let show = $state(false);
	let show1 = $state(false);
	let selectedOption = $state("student");
	let { logIn }: Props = $props();
	let loading = false;
	let email: string = $state();
	let first_name: string = $state();
	let last_name: string = $state();
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
	
	{#if logIn}
		<ButtonGroup class="w-full">
			<Input bind:value={email} type="email" placeholder="Email" />
			<InputAddon>
				<EnvelopeSolid class="w-4 h-4" />
			</InputAddon>
		</ButtonGroup>
		<br /><br />
		<div>
			<ButtonGroup class="w-full">
				<Input
					id="show-password1"
					bind:value={password}
					type={show ? "text" : "password"}
					placeholder="Password"
					on:keydown={(e) => {
						if (e.key === "Enter") logIn ? handleLogin() : handleSignUp();
					}}
				/>
				<InputAddon>
					<button onclick={() => (show = !show)}>
						{#if show}
							<EyeOutline class="w-4 h-4" />
						{:else}
							<EyeSlashOutline class="w-4 h-4" />
						{/if}
					</button>
				</InputAddon>
			</ButtonGroup>
		</div>
	{:else}
		<Tabs tabStyle="pill">
			<TabItem
				on:click={() => (selectedOption = "student")}
				open={selectedOption === "student"}
				title="Student"
			>
				<form onsubmit={handleSignUp}>
					<Label
						class="block mb-2"
					>
						Email Address&nbsp<span class="text-red-600">*</span>
					</Label>
					<ButtonGroup class="w-full">
						<Input
							id="email"
							type="email"
							placeholder={"youremail@domain.com"}
							bind:value={email}
							required={true}
						/>
						<InputAddon>
							<EnvelopeSolid class="w-4 h-4" />
						</InputAddon>
					</ButtonGroup>
					<Label
						class="block mb-2"
					>
						Password&nbsp<span class="text-red-600">*</span>
					</Label>
					<ButtonGroup class="w-full">
						<Input
							id="show-password1"
							bind:value={password}
							type={show ? "text" : "password"}
							placeholder="Password"
							required={true}
							on:keydown={(e) => {
								if (e.key === "Enter") logIn ? handleLogin() : handleSignUp();
							}}
						/>
						
						<InputAddon>
							<button onclick={() => (show = !show)}>
								{#if show}
									<EyeOutline class="w-4 h-4" />
								{:else}
									<EyeSlashOutline class="w-4 h-4" />
								{/if}
							</button>
						</InputAddon>
					</ButtonGroup>
					<Label
						class="block mb-2"
					>
						Retype Password&nbsp<span class="text-red-600">*</span>
					</Label>
					<ButtonGroup class="w-full">
						<Input
							id="show-password2"
							bind:value={retypePassword}
							type={show1 ? "text" : "password"}
							placeholder="Retype Password"
							required={true}
							on:keydown={(e) => {
								if (e.key === "Enter") logIn ? handleLogin() : handleSignUp();
							}}
						/>
						<InputAddon>
							<button onclick={() => (show1 = !show1)}>
								{#if show1}
									<EyeOutline class="w-4 h-4" />
								{:else}
									<EyeSlashOutline class="w-4 h-4" />
								{/if}
							</button>
						</InputAddon>
					</ButtonGroup>
					<Label
						class="block mb-2"
					>
						First Name&nbsp<span class="text-red-600">*</span>
					</Label>
					<Input bind:value={first_name} type="text" placeholder="John" required={true} />
					<Label
						class="block mb-2"
					>
						Last Name&nbsp<span class="text-red-600">*</span>
					</Label>
					<Input bind:value={last_name} type="text" placeholder="Doe" required={true} />
					<br>
					<Button type="submit" pill>Submit</Button>
				</form>
			</TabItem>
			<TabItem
				on:click={() => (selectedOption = "coach")}
				open={selectedOption === "coach"}
				title="Coach"
			>
				<form onsubmit={handleSignUp}>
					<Label
						class="block mb-2"
					>
						Email Address&nbsp<span class="text-red-600">*</span>
					</Label>
					<ButtonGroup class="w-full">
						<Input
							id="email"
							type="email"
							placeholder={"youremail@domain.com"}
							bind:value={email}
							required={true}
						/>
						<InputAddon>
							<EnvelopeSolid class="w-4 h-4" />
						</InputAddon>
					</ButtonGroup>
					<Label
						class="block mb-2"
					>
						Password&nbsp<span class="text-red-600">*</span>
					</Label>
					<ButtonGroup class="w-full">
						<Input
							id="show-password1"
							bind:value={password}
							type={show ? "text" : "password"}
							placeholder="Password"
							required={true}
							on:keydown={(e) => {
								if (e.key === "Enter") logIn ? handleLogin() : handleSignUp();
							}}
						/>
						
						<InputAddon>
							<button onclick={() => (show = !show)}>
								{#if show}
									<EyeOutline class="w-4 h-4" />
								{:else}
									<EyeSlashOutline class="w-4 h-4" />
								{/if}
							</button>
						</InputAddon>
					</ButtonGroup>
					<Label
						class="block mb-2"
					>
						Retype Password&nbsp<span class="text-red-600">*</span>
					</Label>
					<ButtonGroup class="w-full">
						<Input
							id="show-password2"
							bind:value={retypePassword}
							type={show1 ? "text" : "password"}
							placeholder="Retype Password"
							required={true}
							on:keydown={(e) => {
								if (e.key === "Enter") logIn ? handleLogin() : handleSignUp();
							}}
						/>
						<InputAddon>
							<button onclick={() => (show1 = !show1)}>
								{#if show1}
									<EyeOutline class="w-4 h-4" />
								{:else}
									<EyeSlashOutline class="w-4 h-4" />
								{/if}
							</button>
						</InputAddon>
					</ButtonGroup>
					<Label
						class="block mb-2"
					>
						First Name&nbsp<span class="text-red-600">*</span>
					</Label>
					<Input bind:value={first_name} type="text" placeholder="John" required={true} />
					<Label
						class="block mb-2"
					>
						Last Name&nbsp<span class="text-red-600">*</span>
					</Label>
					<Input bind:value={last_name} type="text" placeholder="Doe" required={true} />
					<br>
					<Button type="submit" pill>Submit</Button>
				</form>
			</TabItem>
		</Tabs>
		
	{/if}
	<br>
	<div class="profileButtons">
		{#if logIn}
			<Button type="submit" onclick={handleLogin} pill>Submit</Button>
		{/if}
	</div>
</div>

<style>
	#headerText {
		font-size: 50px;
		margin-bottom: 30px;
	}
	form {
        border: 3px solid var(--primary-tint);
        padding: 20px;
        max-width: 800px;
        margin: 0 auto;
        border-radius: 20px;
    }
</style>
