<script>
	import { Link } from "carbon-components-svelte";
	import { page } from "$app/stores";
	import { handleError } from "$lib/handleError";
	import { isAdmin, signOut } from "$lib/supabase";

	$: path = $page.route.id;

	let width = 0;
	let isUserAdmin = false;

	const handleSignout = async (e) => {
		e.preventDefault();
		try {
			await signOut();
		} catch (error) {
			handleError(error);
		}
	};

	async function onLoad() {
		isUserAdmin = await isAdmin();
	}

	onLoad();
</script>

<svelte:window bind:outerWidth={width} />

<div class="menu">
	<br /><br />
	<div class="flex">
		<img src="/favicon.png" alt={"MMT_logo"} width="50" height="50" />
	</div>
	<br />
	<p class="emphasize">{isUserAdmin ? "Admin" : "Student"}</p>
	<br />
	<div class="linkExterior">
		<a href="/" class={path == "" ? "active link" : "link"}>Home</a>
	</div>
	<br />
	{#if isUserAdmin}
		<div class="linkExterior">
			<a
				href="/admin/users"
				class={path == "/admin/users" ? "active link" : "link"}
			>
				Users
			</a>
		</div>
		<br />
		<div class="linkExterior">
			<a
				href="/admin/events"
				class={path == "/admin/events" ? "active link" : "link"}
			>
				Events
			</a>
		</div>
		<br />
		<div class="linkExterior">
			<a
				href="/admin/import-problems"
				class={path == "/admin/import-problems"
					? "active link"
					: "link"}
			>
				Import
			</a>
		</div>
	{:else}
		<div class="linkExterior">
			<a
				href="/students"
				class={path == "/students" ? "active link" : "link"}
			>
				Events
			</a>
		</div>
	{/if}
	<br />
	<div class="fixedHr" />
	<div class="flex">
		<Link on:click={handleSignout} class="link">
			<p style="color: white">Sign Out</p>
		</Link>
	</div>
</div>

<style>
	.menu {
		background-color: var(--primary);
		min-height: 100vh;
	}

	.linkExterior {
		background-color: var(--primary-light);
		width: 90%;
		padding: 10px;
		margin: 0px 5px;
		text-align: center;
		color: black;
		border-radius: 25px;
	}

	.linkExterior a {
		text-decoration: none;
	}

	.linkExterior:hover {
		cursor: pointer;
		background-color: var(--primary-tint);
	}

	.active {
		font-weight: bold;
	}

	.emphasize {
		font-weight: bold;
		text-align: center;
		font-size: 24px;
		color: white;
	}

	.fixedHr {
		width: 50%;
		border: 1px solid white;
		background-color: white;
		margin-left: auto;
		margin-right: auto;
		margin-top: 10px;
		margin-bottom: 5px;
	}
</style>
