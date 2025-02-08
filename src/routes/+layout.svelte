<script lang="ts">
	import "../app.css";
	import "carbon-components-svelte/css/white.css";
	import Toaster from "$lib/components/Toaster.svelte";
	import { supabase } from "$lib/supabaseClient";
	import Account from "$lib/components/Account.svelte";
	import Banner from "$lib/components/Banner.svelte";
	import NavBar from "$lib/components/NavBar.svelte";
	import Loading from "$lib/components/Loading.svelte";
	import { user } from "$lib/sessionStore";
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { defaultSettings, fetchSettings } from "$lib/supabase/settings";
	interface Props {
		children?: import("svelte").Snippet;
	}

	let { children }: Props = $props();
	let scheme: any = defaultSettings; // Initialize scheme variable

	let loaded = $state(false);

	let hasAccount = $state(true);
	if ($page.route.id?.includes("/signup")) {
		hasAccount = false;
	}

	supabase.auth.onAuthStateChange((_, session) => {
		user.set(session?.user);
	});

	onMount(async () => {
		// Fetch style settings from the database
		// Set CSS variables dynamically
		Object.entries(scheme.styles || {})
			.concat(Object.entries(scheme.constants || {}))
			.forEach(([key, value]) => {
				document.documentElement.style.setProperty(
					`--${key}`,
					value as string,
				);
			});
		user.set((await supabase.auth.getUser()).data.user);

		loaded = true;
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="https://mustangmath.com/logo.png" />
	<link
		rel="og:image"
		type="image/png"
		href="https://mustangmath.com/logo.png"
	/>
	<title>Contest Organization & Management Platform (COMP)</title>
	<meta
		name="description"
		content="COMP is an all-in-one solution for running contests."
	/>
</svelte:head>

<main>
	<div class="absolute flex items-center mt-3 w-full">
		<Toaster></Toaster>
	</div>
	{#if !loaded}
		<div class="loadingPage flex">
			<Loading />
		</div>
	{:else if !$user && $page.route.id && !$page.route.id.includes("/scores") && $page.route.id != "/password-reset"}
		<div class="center-vertical">
			{#if hasAccount}
				<div style="background-color: var(--primary-tint); border-radius: 10px; width: fit-content; padding: 20px;">
					<Account logIn={true} />
					<br />
					<div class="flex">
						<div class="bottomSection" style="color: white;">
							<button
								size="lg"
								class="link"
								id="switchScreen"
								on:click={() => {
									hasAccount = false;
								}}><u>Sign-Up</u></button>
							<button size="lg" class="link" id="forgotPassword">
								<a href="/password-reset" style="color: black;"><u>Forgot Password</u></a>
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div style="background-color: var(--primary-tint); border-radius: 10px; width: fit-content; padding: 20px;">
					<Account logIn={false} />
					<br />
					<div class="flex">
						<div class="bottomSection" style="color: white;">
							<button
								size="lg"
								class="link"
								id="switchScreen"
								on:click={() => {
									hasAccount = true;
								}}><u>Log-In</u></button>
							<button size="lg" class="link" id="forgotPassword">
								<a href="/password-reset" style="color: black;"><u>Forgot Password</u></a>
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{:else if $user && !$user.email_confirmed_at && !$page.route.id != "/scores" && $page.route.id != "/password-reset"}
		<div class="flex-dir-col">
			<div class="verify-email">
				<h2>Verify Your Email</h2>
				<br />
				<p>
					Check your email for a verification link. You won't be able
					to access the platform until your email is verified.
				</p>
			</div>
		</div>
	{:else}
		<NavBar />
		<br />
		<div>
			{@render children?.()}
		</div>
	{/if}
</main>

<style>
	:global(:root) {
		--font-family: "Ubuntu";
		--large-gap: 30px;
		--medium-gap: 20px;
		--small-gap: 10px;
		--primary: gray;
	}

	:global(h1) {
		font-weight: 700;
		font-size: 40px;
		color: var(--secondary-dark);
	}

	:global(h2) {
		font-weight: 600;
		font-size: 25px;
	}

	:global(h3) {
		font-weight: 600;
		font-size: 20px;
	}

	:global(h4) {
		font-weight: 600;
		font-size: 16px;
	}

	:global(::placeholder),
	:global(body),
	:global(input) {
		font-family: var(--font-family);
	}

	:global(::-moz-selection) {
		background-color: var(--primary-tint);
		color: black;
	}

	:global(::selection) {
		background-color: var(--primary-tint);
		color: black;
	}

	:global(pre) {
		white-space: pre-wrap;
		white-space: -moz-pre-wrap;
		white-space: -pre-wrap;
		white-space: -o-pre-wrap;
		word-wrap: break-word;
	}

	:global(.buttonContainer) {
		display: grid;
		grid-template-columns: 32% 32% 32%;
		row-gap: 20px;
		column-gap: 20px;
		margin: 0 auto;
		width: 70%;
	}

	:global(.problemContainer) {
		background-color: white;
		border: 3px solid var(--primary-tint);
		padding: 20px;
		height: 100%;
		border-radius: 20px;
		font-weight: bold;
		text-decoration: none;
		color: var(--text-color-dark);
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		text-align: left;
	}

	:global(.problemContainer h4) {
		font-weight: bold;
		margin-right: 5px;
	}

	:global(.modalExterior div) {
		width: 100%;
		z-index: 9999;
	}

	:global(.modalExterior) {
		position: relative;
		z-index: 9999;
	}

	/* Different grid types */
	:global(.row) {
		display: grid;
		grid-template-columns: 50% auto;
		column-gap: 10px;
		row-gap: 10px;
	}

	:global(.grid) {
		display: grid;
		grid-template-columns: 25% 25% 25% 25%;
	}

	:global(.grid-thirds) {
		display: grid;
		grid-template-columns: 33% 33% 33%;
	}

	@media (max-width: 800px) {
		:global(.row),
		:global(.grid),
		:global(.grid-thirds) {
			grid-template-columns: auto;
		}
	}

	/*Generally applicable styling*/
	:global(.flex) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.flex-dir-col) {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
	}

	/* Carbon Components */
	:global(.bx--number input[type="number"]) {
		border: none !important;
		border-bottom: 1px solid gray !important;
		outline: none !important;
	}

	:global(.bx--text-area) {
		min-height: 100px;
	}

	:global(.bx--text-area:focus, .bx--text-area:active) {
		outline-color: var(--primary) !important;
	}

	:global(.bx--progress-bar__label, .bx--progress-bar__helper-text) {
		color: var(--primary) !important;
		font-weight: bold !important;
	}

	:global(.bx--progress-bar__bar) {
		background: var(--primary) !important;
		border-radius: 4px !important;
	}

	:global(.bx--progress-bar__track) {
		background: var(--primary-tint);
		height: 16px !important;
		border-radius: 2px !important;
	}

	:global(.bx--number__control-btn:focus) {
		border: none !important;
		outline: none !important;
	}

	:global(.bx--number input[type="number"]) {
		font-family: "IBM Plex Sans", "Helvetica Neue", Arial, sans-serif;
		font-weight: 400;
		font-size: 14px;
	}
	:global(::placeholder),
	:global(.bx--text-area::placeholder) {
		font-family: var(--font-family);
		font-size: 13px;
		font-weight: 300;
	}
	:global(.profileButtons .button),
	:global(.profileButtons .button:focus),
	:global(.bx--btn--primary) {
		border-color: transparent !important;
		background-color: var(--primary) !important;
		transition: all 0.3s ease-out;
	}
	:global(.discordbutton) {
		background-color: #5865f2 !important;
		color: white !important;
	}
	:global(.disabled) {
		pointer-events: none;
		cursor: not-allowed;
		-webkit-box-shadow: none;
		box-shadow: none;
	}
	:global(.buttonPrimaryLight) {
		border-color: var(--secondary-tint) !important;
		background-color: var(--primary-light) !important;
	}
	:global(.profileButtons .button p) {
		color: white !important;
	}
	:global(.profileButtons .button:hover) {
		background-color: var(--secondary-tint) !important;
		border: 2px solid var(--primary) !important;
	}
	:global(.buttonPrimaryLight:hover) {
		background-color: var(--secondary-tint) !important;
		border: 2px solid var(--primary-light) !important;
	}
	:global(.profileButtons .button:hover p) {
		color: var(--primary) !important;
	}

	:global(.buttonPrimaryLight:hover p) {
		color: var(--primary-light) !important;
	}
	:global(.profileButtons .button:focus),
	:global(.profileButtons .bx--text-input:focus),
	:global(.profileButtons .bx--text-input:active) {
		border: 2px solid var(--primary) !important;
		box-shadow: 2px solid var(--primary) !important;
		outline-color: var(--primary) !important;
	}
	:global(.link) {
		text-decoration: none !important;
		color: var(--primary-light) !important;
	}
	:global(.link:visited) {
		text-decoration: none !important;
		color: var(--text-color-dark) !important;
	}
	:global(.menu .link) {
		width: 50% !important;
		padding: 5px !important;
		color: var(--text-color-white) !important;
		text-decoration: none !important;
		outline: none !important;
	}
	:global(.menu .active) {
		text-decoration: underline !important;
		color: var(--text-color-white) !important;
	}
	:global(.bx--select-input:focus) {
		border-color: var(--primary) !important;
		outline-color: var(--primary) !important;
	}
	:global(.datatable) {
		width: 80% !important;
	}
	:global(.link),
	:global(.bx--data-table tr:hover .bx--link) {
		color: var(--text-color-dark) !important;
	}
	:global(.bx--link:hover) {
		color: var(--primary) !important;
		cursor: pointer !important;
	}
	:global(.bx--table-expand__button:focus) {
		box-shadow: none !important;
	}
	:global(.bx--loading__stroke) {
		stroke: var(--primary) !important;
	}
	:global(.input) {
		border-width: 2px !important;
	}
	:global(.button),
	:global(.button:focus) {
		border-color: var(--primary-light) !important;
		background-color: transparent !important;
	}
	:global(.button p) {
		color: var(--primary-light) !important;
	}
	:global(.button:hover) {
		background-color: var(--primary-light) !important;
	}
	:global(.button:hover p) {
		color: var(--text-color-white) !important;
	}
	:global(.button p) {
		margin-left: auto;
		margin-right: auto;
		font-size: 1.5em;
		font-weight: 500;
		padding: 0;
	}
	:global(.bx--select-input:focus),
	:global(.bx--select-input:active),
	:global(.input:focus),
	:global(.textArea:focus),
	:global(.bx--text-input:focus),
	:global(.bx--text-input:active),
	:global(.bx--number input[type="number"]:focus),
	:global(.bx--text-area:focus) {
		border-color: var(--primary) !important;
		outline-color: var(--primary) !important;
	}

	:global(.bx--table-sort:focus) {
		border: none !important;
		outline: none !important;
	}

	:global(.bx--link) {
		color: var(--primary) !important;
		outline: none !important;
		border: none !important;
	}

	:global(.bx--link:focus) {
		outline: none !important;
		border: none !important;
	}

	:global(.bx--table-sort:focus) {
		outline: none;
	}

	:global(.bx--search-input:focus:not([disabled])) {
		outline: none !important;
	}
	:global(.bx--checkbox-label:focus) {
		outline: none !important;
		border: none !important;
	}
	:global(.bx--table-sort:focus) {
		outline: none;
	}

	:global(.bx--select-input:focus) {
		border-color: var(--primary) !important;
		outline-color: var(--primary) !important;
	}

	:global(.bx--link:visited) {
		color: var(--primary) !important;
	}
	:global(.bx--table-sort) {
		outline-color: var(--primary) !important;
	}
	:global(.bx--toolbar-content .bx--search .bx--search-input:focus) {
		outline-color: var(--primary);
	}

	:global(.pencil .link) {
		border: none;
		outline: none;
	}
	:global(.bx--text-area:focus, .bx--text-area:active) {
		outline-color: var(--primary) !important;
	}
	:global(.bx--loading__stroke) {
		stroke: var(--primary) !important;
	}
	:global(.bx--inline-notification__close-button) {
		outline: none;
		border: none;
	}
	:global(.tournamentForm) {
		min-width: 400px;
	}

	main {
		padding: 10px;
		min-height: 100vh;
		margin: 0;
		padding: 0;
		background-color: var(--background);
	}

	.menu-split {
		display: grid;
		grid-template-columns: 10% 90%;
	}

	.loadingPage {
		width: 100vw;
		height: 80vh;
	}

	button {
		border: none;
		background-color: transparent;
		outline: none;
		color: none;
		color: var(--text-color-dark);
		text-decoration: underline;
		font-size: 15px;
	}

	button:hover {
		color: var(--primary);
		cursor: pointer;
	}

	:global(.tooltip-container) {
		position: relative; /* Positioning context for the tooltip */
		display: inline-block; /* Allow the tooltip to be positioned relative to the button */
	}

	:global(.tooltip) {
		visibility: hidden; /* Hidden by default */
		width: 120px; /* Set width */
		background-color: black; /* Background color */
		color: #fff; /* Text color */
		text-align: center; /* Center text */
		border-radius: 5px; /* Rounded corners */
		padding: 5px; /* Padding */
		position: absolute; /* Positioning */
		z-index: 1; /* Ensure it appears above other elements */
		bottom: 125%; /* Position above the button */
		left: 50%; /* Center horizontally */
		transform: translateX(-50%); /* Center adjustment */
		opacity: 0; /* Hidden by default */
		transition: opacity 0.3s; /* Fade effect */
	}

	:global(.tooltip-container:hover .tooltip) {
		visibility: visible; /* Show tooltip on hover */
		opacity: 1; /* Fade in */
	}

	#switchScreen {
		float: left;
	}
	#forgotPassword {
		float: right;
	}

	.bottomSection {
		width: 30em;
	}

	@media only screen and (max-width: 700px) {
		.bottomSection {
			width: 80vw;
		}
	}

	.center-vertical {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}
</style>
