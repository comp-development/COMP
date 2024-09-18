<script lang="ts">
	import { page } from "$app/stores";
	import toast from "svelte-french-toast";
	import { ExpandableTile } from "carbon-components-svelte";
	import { formatTime, addTime, subtractTime } from "$lib/dateUtils";

	import TestView from "$lib/components/TestView.svelte";
	import MathJax from "$lib/components/MathJax.svelte";
	import Button from "$lib/components/Button.svelte";
	import { handleError } from "$lib/handleError";
	import {
		getThisUser,
		getTestTaker,
		getTest,
		getTeamId,
		getTestAnswers,
		updateTest
	} from "$lib/supabase";

	console.log("SUP");
	let loading = true;

    let titleEditable = false;
	let lengthEditable = false;
	let bufferEditable = false;

	let test_id = Number($page.params.test_id);
	let is_team = $page.params.test_id.charAt(0) == "t" ? true : false;

	let user;
	let test;
	let test_taker;
	(async () => {
		user = await getThisUser();
		test = await getTest(test_id);
		console.log("USER_ID", user.id);
		loading = false;
	})();

	async function updateTitle(event) {
		titleEditable = false;
		console.log("TARGET",event.target.innerText)
		
		test.test_name = event.target.innerText;
		await updateTest(test.test_id, test)
	}

	async function updateLength(event)  {
		lengthEditable = false;
		test.length = parseInt(event.target.innerText);
		await updateTest(test.test_id, test)
	}

	async function updateBuffer(event)  {
		bufferEditable = false;
		test.buffer_time = parseInt(event.target.innerText);
		await updateTest(test.test_id, test)
	}
</script>

{#if loading}
	<p>Loading...</p>
{:else}
	<br />
	<h1
		contenteditable={titleEditable}
		class:editable={titleEditable}
		on:click={() => {
			titleEditable = true
		}}
		on:blur={async (e) => {
			await updateTitle(e)
		}}
		on:keypress={async (e) => {
			e.key == "Enter" && await updateTitle(e)
		}}
	>
	{test.test_name}</h1>
	<div>
		Test Length (seconds):<br>
		<p
			contenteditable={lengthEditable}
			class:editable={lengthEditable}
			on:click={() => {
				lengthEditable = true
			}}
			on:blur={async (e) => {
				await updateLength(e)
			}}
			on:keypress={async (e) => {
				e.key == "Enter" && await updateLength(e)
			}}
		>
			{test.length}
		</p>
	</div>
	<div>
		Test Buffer (seconds):<br>
		<p
			contenteditable={bufferEditable}
			class:editable={bufferEditable}
			on:click={() => {
				bufferEditable = true
			}}
			on:blur={async (e) => {
				await updateBuffer(e)
			}}
			on:keypress={async (e) => {
				e.key == "Enter" && await updateBuffer(e)
			}}
		>
			{test.buffer_time}
		</p>
	</div>
	<div style="padding: 20px;">
		<ExpandableTile light expanded tileExpandedLabel="View less" tileCollapsedLabel="View more">
			<div slot="above"><p style="font-weight: bold">Test Instructions</p></div>
			<div slot="below"><MathJax math={test.instructions} /></div>
		</ExpandableTile>
		<br />
	</div>
	<br />
{/if}

<style>
	h1 {
		text-align: center;
        cursor: pointer;
	}

    h1.editable {
        border: 1px dashed #000000;
        outline: none;
    }
</style>
