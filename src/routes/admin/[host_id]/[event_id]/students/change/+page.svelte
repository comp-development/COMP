<script lang="ts">
	import { run } from 'svelte/legacy';

	import { getStudentUsers, getAdminUsers, transferUser } from "$lib/supabase";
	import {
		Select,
		SelectItem,
	} from "carbon-components-svelte";
	import Button from "$lib/components/Button.svelte";
	import Loading from "$lib/components/Loading.svelte";
	import { handleError } from "$lib/handleError";
	import toast from "$lib/toast.svelte";

	let loading = $state(true);
	let users = $state([]);
	let curUser = $state("");
    let toAdmin: string = $state("true");

	async function getData() {
		try {
            if (toAdmin == "true") {
			    users = await getStudentUsers();
				curUser = users[0] ? users[0].student_id : "";
            } else {
                users = await getAdminUsers();
				curUser = users[0] ? users[0].admin_id : "";
            }

			loading = false;
		} catch (error) {
			handleError(error);
		}
	}

    async function onSubmitTransferUser() {
		try {
			await transferUser(curUser, toAdmin == "true");
			toast.success("User successfully transferred.");
		} catch (error) {
			handleError(error);
		}
    }

	run(() => {
		toAdmin, getData();
	});
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
				<SelectItem value={toAdmin == "true" ? user.student_id : user.admin_id} text={user.first_name + " " + user.last_name} />
			{/each}
		</Select>
		<br />

		<Button title="Transfer User" action={onSubmitTransferUser} />
	</div>
{/if}
