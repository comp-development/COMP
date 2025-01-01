<script>
	import { Link } from "carbon-components-svelte";
	import { page } from "$app/stores";
	import { handleError } from "$lib/handleError";
	import { isAdmin, signOut } from "$lib/supabase";

	const path = $page.route.id;

	let width = 0;
	let user_type = "";
	if (path?.startsWith("/admin")) {
		user_type = "Admin"
	} else if (path?.startsWith("/student")) {
		user_type = "Student"
	}

	const handleSignout = async (e) => {
		e.preventDefault();
		try {
			await signOut();
		} catch (error) {
			handleError(error);
		}
	};

</script>

<svelte:window/>

<div class="menu">
	<br /><br />
	<div class="flex">
		<img src="/COMP_White.png" alt={"COMP_logo"} width="150" />
	</div>
	<br />
	<p class="emphasize">{user_type}</p>
	<br />
	<div class="linkExterior">
		<a href="/{user_type.toLowerCase()}" class={path == "" ? "active link" : "link"}>Home</a>
	</div>
	<br />
	{#if user_type == "Admin"}
		
		<div class="linkExterior">
			<a
				href="/admin/users"
				class={path == "/admin/users" ? "active link" : "link"}
			>
				Users
			</a>
		</div>
		<br />
			<!--
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
		-->
	{/if}
	<div class="linkExterior">
		<a
			href="./"
			class={path == "/student" ? "active link" : "link"}
		>
			Back
		</a>
	</div>
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
