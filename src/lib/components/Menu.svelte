<script>
	import Drawer from "svelte-drawer-component";
	import Banner from "./Banner.svelte";
	import { Link } from "carbon-components-svelte";
	import { page } from "$app/stores";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import { signOut } from "$lib/supabase";

	$: path = $page.route.id;

	let open = false;
	let fullname = "";
	let loading = false;
	let width = 0;

	const handleSignout = async (e) => {
		e.preventDefault();
		try {
			loading = true;
			await signOut();
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		} finally {
			loading = false;
		}
	};
</script>

<svelte:window bind:outerWidth={width} />

<Drawer
	{open}
	size={width > 1350 ? "40%" : width > 770 ? "50%" : "100%"}
	placement="left"
	on:clickAway={() => (open = false)}
>
	<div class="drawer">
		<div class="flex">
			<div class="banner">
				<Banner />
			</div>
		</div>
		<br />
		<div class="menu">
			<Link href="/" class={path == "" ? "active link" : "link"}>
				<p class="linkPara">Home</p>
			</Link>
			<div class="fixedHr" />
			<Link on:click={handleSignout} class="link">
				<p class="linkPara">Sign Out</p>
			</Link>
		</div>
		<div class="bottomBanner">
			<p style="font-weight: 700;">{fullname}</p>
		</div>
	</div>
	<button class="close" on:click={() => (open = false)}>
		<i class="ri-menu-fold-line" />
	</button>
</Drawer>

<button on:click={() => (open = true)} class="unfoldButton">
	<i class="ri-menu-unfold-fill" />
</button>

<style>
	button {
		background-color: var(--primary);
		border: none;
		outline: none;
		color: var(--text-color-light);
		padding: 10px;
		position: fixed;
		top: 20px;
		padding-left: 20px;
		left: 0;
		border-radius: 0 5px 5px 0;
	}

	.close {
		background-color: var(--primary-light);
		z-index: 101;
	}

	.linkPara {
		color: var(--text-color-light);
		text-decoration: none;
		border: none;
		width: 100%;
		height: 5px;
		text-align: right;
	}

	.unfoldButton {
		z-index: 10;
		cursor: pointer;
	}

	.linkPara:hover {
		cursor: pointer;
		color: var(--primary-light);
	}

	.close {
		display: block;
		margin-left: auto;
	}
	.drawer {
		background-color: var(--primary);
		width: 100%;
		height: 100%;
		color: var(--text-color-light);
	}

	.banner {
		border-bottom: 2px solid var(--text-color-light);
		padding-bottom: 5px;
		width: 50%;
		position: relative;
	}

	.banner:before,
	.banner:after {
		position: absolute;
		bottom: -6px;
		left: 0;
		height: 10px;
		width: 10px;
		background: var(--text-color-light);
		content: "";
		border-radius: 5px;
	}

	.banner:after {
		right: 0;
		left: auto;
	}

	.bottomBanner {
		position: fixed;
		bottom: 0;
		background-color: var(--primary-light);
		padding: 20px;
		width: 100%;
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
