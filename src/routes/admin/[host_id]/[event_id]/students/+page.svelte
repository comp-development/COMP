<script lang="ts">
	import {
		DataTable,
		Link,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Pagination,
	} from "carbon-components-svelte";
	import { handleError } from "$lib/handleError";
	import { getAdminUsers, getStudentUsers } from "$lib/supabase";
    import Button from "$lib/components/Button.svelte";

	let pageSize = 25;
	let page = 1;
	let loading = true;
	let roles = [];

	async function roleManager() {
		try {
			let roles2 = [];

			let users = await getAdminUsers();
			for (let user of users) {
				roles2.push({
					id: user.admin_id,
					first_name: user.first_name,
					last_name: user.last_name,
					role: "Admin"
				});
			}

			users = await getStudentUsers();
			for (let user of users) {
				roles2.push({
					id: user.student_id,
					first_name: user.first_name,
					last_name: user.last_name,
					role: "Student"
				});
			}

			roles2.sort((a, b) => {
				return a.first_name.toLowerCase().localeCompare(b.first_name.toUpperCase());
			});
			roles = roles2;
			loading = false;
		} catch (error) {
			handleError(error);
		}
	}

	roleManager();
</script>

<br />
<h1>Admin: Users</h1>

{#if loading}
	<p>Loading...</p>
{:else}
	<br />
	<Button title="Change User Role" href="/admin/users/change" />
	<br />
	<br />
	<div style="padding: 10px;">
		<DataTable
			sortable
			size="compact"
			headers={[
				{ key: "edit", value: "", width: "20px"},
				{ key: "first_name", value: "First Name" },
				{ key: "last_name", value: "Last Name" },
				{ key: "role", value: "Role" },
				{ key: "id", value: "ID" },
			]}
			rows={roles}
			{pageSize}
			{page}
		>
			<Toolbar size="sm">
				<ToolbarContent>
					<ToolbarSearch persistent shouldFilterRows />
				</ToolbarContent>
			</Toolbar>

			<svelte:fragment slot="cell" let:row let:cell let:rowIndex>
				<div>
					{#if cell.key === "edit"}
						<div class="pencil">
							<Link class="link" href={"/admin/users/" + row.id}
								><i class="ri-pencil-fill" /></Link
							>
						</div>
					{:else}
						<div style="overflow: hidden;">
							{cell.value == null || cell.value == "" ? "None" : cell.value}
						</div>
					{/if}
				</div>
			</svelte:fragment>
		</DataTable>

		<Pagination
			bind:pageSize
			bind:page
			totalItems={roles.length}
			pageSizeInputDisabled
		/>
	</div>
{/if}