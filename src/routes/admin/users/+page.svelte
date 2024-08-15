<script lang="ts">
	import {
		DataTable,
		Link,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Pagination,
	} from "carbon-components-svelte";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import { getAdminUsers } from "$lib/supabase";

	let pageSize = 25;
	let page = 1;
	let loading = true;
	let roles = [];

	async function roleManager() {
		try {
			let users = await getAdminUsers();
			let roles2 = [];
			for (let user of users) {
				roles2.push({
					id: user.admin_id,
					first_name: user.first_name,
					last_name: user.last_name,
				});
			}
			roles2.sort((a, b) => {
				return a.name.toLowerCase().localeCompare(b.name.toUpperCase());
			});
			roles = roles2;
			loading = false;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	roleManager();
</script>

<br />
<h1>Admin: Users</h1>

{#if loading}
	<p>Loading...</p>
{:else}
	<div style="padding: 10px;">
		<DataTable
			sortable
			size="compact"
			headers={[
				{ key: "edit", value: "", width: "50px" },
				{ key: "name", value: "Name" },
				{ key: "initials", value: "Initials", width: "100px" },
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