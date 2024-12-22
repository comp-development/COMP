<script lang="js">
	import { supabase } from "$lib/supabaseClient";
	import { get } from "svelte/store";
	import UserTable from "$lib/components/UserTable.svelte";
	import Button from "$lib/components/Button.svelte";
	import { Checkbox, TextArea } from "carbon-components-svelte";
	import { onMount } from "svelte";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	
	import { List, Schematics } from "carbon-icons-svelte";
    import { getStudents } from "$lib/supabase/students";

	

	

	
	let students = [];


	let time_filtered_students = [];
	let studentCounts = [];
	let width = 0;
	let loaded = false;
	let user;
    let userRole;

	let openModal = false;
	let values = ["Students", "Answers", "Solutions", "Comments"];
	let group = values.slice(0, 1);

	let scheme = {};


	(async () => {
		try {
        
			students = await getStudents({ });
            sortStudents();
			
			console.log(time_filtered_students.length);

			const topicsCount = students.reduce((count, { topics }) => {
				let individualTopics;
				if (topics) {
					individualTopics = topics.split(", ").map((topic) => topic.trim());
				} else {
					individualTopics = ["Uncategorized"];
				}

				individualTopics.forEach((topic) => {
					count[topic] = (count[topic] || 0) + 1;
				});

				return count;
			}, {});
			console.log(topicsCount);
            // find the console log error, errpr pccired after this
            //comment out lines after this
			
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
