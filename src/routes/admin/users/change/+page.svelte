<script lang="ts">
	import { getStudentUsers, getAdminUsers, transferUser } from "$lib/supabase";
	import {
		Select,
		SelectItem,
	} from "carbon-components-svelte";
	import Button from "$lib/components/Button.svelte";
	import Loading from "$lib/components/Loading.svelte";
	import { handleError } from "$lib/handleError";

	let loading = true;
	let users = [];
	let curUser = "";
    let toAdmin: string = "true";

	async function getData() {
		try {
            if (toAdmin == "true") {
			    users = await getStudentUsers();
            } else {
                users = await getAdminUsers();
            }

			loading = false;
		} catch (error) {
			handleError(error);
		}
	}

    async function onSubmitTransferUser() {
		await transferUser(curUser, toAdmin == "true");
    }

	$: toAdmin, getData();
    getData();
</script>

<br />

<h1>Change User Role</h1>
{#if loading}
	<Loading />
{:else}
	<div style="padding: 20px;">
        <Select labelText="Convert User To" bind:selected={toAdmin}>
			<SelectItem value="true" text="Admin" />
            <SelectItem value="false" text="Student" />
		</Select>
		<br />

		<Select labelText="User" bind:selected={curUser}>
			{#each users as user, i}
				<SelectItem value={toAdmin ? user.student_id : user.admin_id} text={user.first_name + " " + user.last_name} />
			{/each}
		</Select>
		<br />

		<Button title="Transfer User" action={onSubmitTransferUser} />
	</div>
{/if}