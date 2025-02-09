<script lang="ts">
	import { handleError } from "$lib/handleError";
	import { getallUsers } from "$lib/supabase";
	import Loading from "$lib/components/Loading.svelte";
	import TableName from "$lib/components/TableName.svelte";

	let loading = $state(true);
	let roles = $state([]);

	async function roleManager() {
		try {
			let users = await getallUsers();
			users.sort((a, b) => {
				return a.person.first_name
					.toLowerCase()
					.localeCompare(b.person.first_name.toLowerCase());
			});			
			roles = users;
			loading = false;
		} catch (error) {
			handleError(error);
		}
	}

	roleManager();

	function handleEdit(e, item) {
		const id = item.admin_id || item.student_id || item.coach_id;
		window.location.href = `/admin/users/${id}`;
	}
</script>

{#if loading}
	<Loading />
{:else}
	<h1>Admin: Users</h1>
	<div style="padding: 30px; padding-top: 0;">
		<TableName items={roles} actionType="edit" action={handleEdit} columns = {[
            {
                label: "First Name",
                value: (item) => item.person.first_name,
                sortable: true,
            },
            {
                label: "Last Name",
                value: (item) => item.person.last_name,
                sortable: true,
            },
			{
				label: "Role",
				value: (item) => item.role,
				sortable: true,
			},
        ]} />
	</div>
{/if}

