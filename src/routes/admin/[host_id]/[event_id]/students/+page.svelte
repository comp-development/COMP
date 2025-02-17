<script lang="js">
	
	import UserTable from "$lib/components/UserTable.svelte";
	import Button from "$lib/components/Button.svelte";
	import { page } from "$app/stores";
    import { getStudents } from "$lib/supabase/students";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";	
    import { getStudentEvents, getCustomFields } from "$lib/supabase";

	let pageSize = $state(25);
	let page = $state(1);
	let loading = $state(true);
	let roles = $state([]);
	
    
	let time_filtered_students = [];
	
	let width = 0;
	let loaded = false;
	
    let userRole;
	let custom_fields = [];
	let students = [];
	let studentTableInfo = [];
	let event_id = $page.params.event_id;


	(async () => {
		try {
			students = await getStudentEvents(event_id);
			studentTableInfo = await getStudents({});
			custom_fields = await getCustomFields(event_id);
			console.log("new custom!",custom_fields);			
			console.log("student event and student");
			console.log(students);
			console.log(studentTableInfo);
			console.log(time_filtered_students.length);

			
			
			loaded = true;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	})();


    function sortStudents() {
        console.log("SORTING")
		const statusOrder = ['Archived', 'Published', 'Draft', 'Idea', 'Endorsed', 'On Test'];
		const stageOrder = ['Needs Review', 'Awaiting Feedback', 'Awaiting Endorsement', 'Awaiting Testsolve', 'Complete'];
		students = students.sort((a, b) => {
			const statusComparison = statusOrder.indexOf(b.status) - statusOrder.indexOf(a.status);
            console.log(statusComparison)
			if (statusComparison !== 0) {
				return statusComparison; // Sort by status first
			}
			// If statuses are equal, sort by stage in descending order
			return stageOrder.indexOf(b.feedback_status) - stageOrder.indexOf(a.feedback_status);
		});
	}

	async function getBucketPaths(path) {
		try {
			const data = await getImages(path);
			let ans = [];
			for (let i = 0; i < data.length; i++) {
				if (data[i].id != null) {
					if (path === "") {
						ans.push(data[i].name);
					} else {
						ans.push(path + "/" + data[i].name);
					}
				} else {
					let x;
					if (path === "") {
						x = await getBucketPaths(data[i].name);
					} else {
						x = await getBucketPaths(path + "/" + data[i].name);
					}
					for (let j = 0; j < x.length; j++) {
						ans.push(x[j]);
					}
				}
			}
			return ans;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

</script>

<svelte:window bind:outerWidth={width} />

<br />
<h1>Your Dashboard</h1>
{#if !loaded}
	<p>Loading students...</p>
{/if}

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

			{#snippet cell({ row, cell, rowIndex })}
					
					<div>
						{#if cell.key === "edit"}
							<div class="pencil">
								<Link class="link" href={"/admin/users/" + row.id}
									><i class="ri-pencil-fill"></i></Link
								>
							</div>
						{:else}
							<div style="overflow: hidden;">
								{cell.value == null || cell.value == "" ? "None" : cell.value}
							</div>
						{/if}
					</div>
				
					{/snippet}
		</DataTable>

		<Pagination
			bind:pageSize
			bind:page
			totalItems={roles.length}
			pageSizeInputDisabled
		/>
<div style="margin-top: 10px;">
	<Button title="Create a new student" href="/students/new" />
</div>
{#if userRole >= 30}
    <div style="margin-top: 10px;">
        <Button title="Student Inventory" href="/students" />
    </div>
{/if}
<br />
<div class="flex">
	<div class="stats">
	</div>
</div>
<br>
<br />
<div style="width:80%; margin: auto;margin-bottom: 20px;">
	<UserTable 
        students={students} 
		custom_fields={custom_fields}
		
        
        />
</div>

<style>
	.stats {
		background-color: white;
		border: 1px solid var(--primary);
		width: 80%;
		margin: 10px;
		text-align: left;
		padding: 10px;
	}
</style>
