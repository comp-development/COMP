<script>
	import {
		DataTable,
		DataTableSkeleton,
		Link,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Pagination,
		MultiSelect,
		Tag
	} from "carbon-components-svelte";
	
	
	

	import Switcher from "carbon-icons-svelte/lib/Switcher.svelte";
	import { createEventDispatcher } from "svelte";
	import { Filter } from "carbon-icons-svelte";
	import toast from "svelte-french-toast";
	
	import { LogarithmicScale } from "chart.js";
    import { json } from "@sveltejs/kit";
    import { getCustomFields } from "$lib/supabase";
   

	export let students = [];
	export let custom_fields = null;
	export let studentTableInfo = [];
	export let selectable = false;
	export let stickyHeader = false;
	export let selectedItems = [];
	export let nonselectableItems = [];
	export let sortKey = "created_at";
	export let sortDirection = "descending";
	export let editable = true;
	export let disableAll = false; // disables everything from being selectable
	export let customHeaders = [];
	export let draggable = false;
	export let pageEnabled = true;
	export let minWidth = 500;

	export let showList = [
		"division",
		"student_id",
		"first_name",
		"last",
		"grade",
		"email",
		"team_id",
		"front_id",
		"event_id"
	];

	const dispatch = createEventDispatcher();

	let width = 0;
	$: maxCols = Math.floor((width - 100) / minWidth);
	$: colWidth = (width - 100) / Math.min(maxCols, showList.length);

	let mobileFriendly = {
		
	};

	let pageSize = 25;
	let page = 1;

	let editHeader = { key: "edit", value: "", width: "50px" };

	let headers = [
		{
			key: "division",
			value: "division",
			short: "division",
			icon: "ri-user-fill",
			width: "10%"
		},
		
		
		
	];

	
	let output = [];
	$: {

		for (const field of custom_fields) {
			console.log("field", field, field.key);
			output.push({
				key: field.key,
				value: field.key,
				icon: "ri-key-2-fill",
				width: "90px",
			})
			
		}
		console.log("output", output)
	}

	$: console.log("hoorayy",custom_fields);
	$: headersF = headers.filter((row) => showList.includes(row.key));
	$: curHeaders = [
		
		...(editable ? [editHeader] : []),
		...[
			
			
			{
				key: "student_id",
				value: "student_id",
				icon: "ri-key-2-fill",
				
				width: "90px",
			},
			{
				key: "first_name",
				value: "first_name",
				icon: "ri-key-2-fill",
				
				width: "90px",
			},
			{
				key: "last_name",
				value: "last",
				icon: "ri-key-2-fill",
				
				width: "90px",
			},
			{
				key: "grade",
				value: "grade",
				icon: "ri-key-2-fill",
				
				width: "90px",
			},
			{
				key: "email",
				value: "email",
				icon: "ri-key-2-fill",
				
				width: "90px",
			},
			{
				key: "team_id",
				value: "team_id",
				icon: "ri-key-2-fill",
				
				width: "90px",
			},
			{
				key: "front_id",
				value: "front_id",
				icon: "ri-key-2-fill",
				
				width: "90px",
			},
			
		],
		...output,
		...headersF.slice(0, maxCols),
		...customHeaders,
	];

	let tableContainerDiv = null;

	// hacky workaround to not being able to get entire rows
	function getRowElement(id) {
		return tableContainerDiv?.querySelector(`[data-row="${id}"]`);
	}

	let listeners = {};
	$: {
	console.log("students original");
	console.log(students);
	
	console.log("custom custom");
	console.log(custom_fields);

	students = students.map((s, i) => {
		const s_data = s.students;
		console.log(s_data)
		s.students = null;
		//for every custom field, add custom field on s
		for (let i = 0; i<custom_fields.length; i++) {
			s[custom_fields[i].key] = s.custom_fields[custom_fields[i].custom_field_id];
		}
		
		
		console.log(JSON.stringify(s.custom_fields));
		return {
			id: i + 1,
			...s,
			...s_data,
		}
	});
	for (let i = 0; i<students.length; i++) {
		if (students[i].grade != null) {
			console.log("found it");
		}
	}
	

	console.log("after add ID");
	console.log(students);
	students = students;
	}

	
	$: if (draggable && tableContainerDiv && !draggingRow) {
		try {
			
			for (let i = 0; i < students.length; i++) {
				const row = students[i];
				let elem = getRowElement(row.id);
				if (row.id in listeners) {
					elem?.removeEventListener("dragenter", listeners[row.id]);
				}
				listeners[row.id] = (e) => handleDragEnter(e, row);
				elem?.addEventListener("dragenter", listeners[row.id]);
			}
			for (let i = 0; i < studentTableInfo.length; i++) {
				const row = studentTableInfo[i];
				let elem = getRowElement(row.id);
				if (row.id in listeners) {
					elem?.removeEventListener("dragenter", listeners[row.id]);
				}
				listeners[row.id] = (e) => handleDragEnter(e, row);
				elem?.addEventListener("dragenter", listeners[row.id]);
			}
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	let draggingRow = false;
	let draggedRow = null;
	let lastDraggedInd = null;

	function startDrag(e, row) {
		try {
			if (!draggable) return;
			draggingRow = true;
			draggedRow = row;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	function handleDragEnter(e, row) {
		try {
			if (!draggable) return;
			if (!draggingRow) return;
			if (row === draggedRow) return;

			e.preventDefault();
			const ind = students.indexOf(row);
			lastDraggedInd = ind;
			students.splice(students.indexOf(draggedRow), 1);
			students.splice(ind, 0, draggedRow);
			students = students;

			// const ind = studentTableInfo.indexOf(row);
			// lastDraggedInd = ind;
			// studentTableInfo.splice(studentTableInfo.indexOf(draggedRow), 1);
			// studentTableInfo.splice(ind, 0, draggedRow);
			// studentTableInfo = studentTableInfo;


		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	function endDrag(e) {
		try {
			if (!draggable) return;
			if (lastDraggedInd !== null) {
				dispatch("reorder", {
					id: draggedRow.id,
					to: lastDraggedInd,
				});
			}
			draggingRow = false;
			draggedRow = null;
			lastDraggedInd = null;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}
	//export let students = [];
    //export let studentTableInfo = [];

    // Columns to display
    // export let showList = [
    //     "division",
    //     "student_id",
    //     "first",
    //     "last",
    //     "grade",
    //     "email",
    //     "team_id",
    //     "front_id",
    //     "event_id"
    // ];

    // Merge rows from students and studentTableInfo
    //$: mergedStudents = mergeData(students, studentTableInfo);

    function mergeData(students, studentTableInfo) {
        const infoMap = new Map(
            studentTableInfo.map(info => [info.student_id, info]) // Map by student_id
        );

        return students.map(student => {
            // Match additional info by student_id
            const additionalInfo = infoMap.get(student.student_id) || {};

            // Merge student and additional info fields
            return {
                ...showList.reduce((acc, key) => {
                    acc[key] = student[key] || additionalInfo[key] || '-';
                    return acc;
                }, {})
            };
        });
    }

    // Generate headers based on showList
    $: mergedHeaders = showList.map(key => ({
        key,
        value: key.replace('_', ' ').toUpperCase(),
        width: '120px',
    }));

</script>

<svelte:window />
<div bind:clientWidth={width} class="align-items: right; display: flex;">
	<MultiSelect
		bind:selectedIds={showList}
		direction="top"
		size="sm"
		label="Filter visible columns"
		items={[
			{
				id: "division",
				text: "division",
			},
			
			
			
		]}
	/>
</div>



<div
	class="flex-dir-col"
	on:dragover={(e) => e.preventDefault()}
	bind:this={tableContainerDiv}
>
	<DataTable
		size="compact"
		expandable
		sortable
		batchExpansion
		
		
		{selectable}
		{stickyHeader}
		bind:selectedRowIds={selectedItems}
		nonSelectableRowIds={disableAll
			? students.map((pb) => pb.id)
			: nonselectableItems}
		class="datatable"
		headers={curHeaders} 
		rows={students}
		
		pageSize={pageEnabled ? pageSize : undefined}
		page={pageEnabled ? page : undefined}
	>
		<Toolbar size="sm">
			<ToolbarContent>
				<ToolbarSearch persistent shouldFilterRows />
			</ToolbarContent>
		</Toolbar>
		<svelte:fragment slot="cell-header" let:header>
			{#if colWidth > 120}
				<i class={header.icon} /> {header.value}
			{:else}
				<div style="display: flex; align-items: flex-center;">
					<i
						class={header.icon}
						style="display: flex; align-items: flex-center;"
					/>
					{header.short ? header.short : header.value}
				</div>
			{/if}
		</svelte:fragment>
		<svelte:fragment slot="cell" let:row let:header let:cell>
			<div>
				{#if cell.key === "edit"}
					<div class="pencil">
						<Link class="link" href={"/problems/" + row.id}
							><i class="ri-pencil-fill" style="font-size: 20px;" /></Link
						>
					</div>
				{:else if cell.key === "drag"}
					<div
						draggable={true}
						on:dragstart={(e) => startDrag(e, row)}
						on:dragend={(e) => endDrag(e)}
						style="visibility: {disableAll ? 'hidden' : 'visible'}"
						class="drag-div"
					>
						<div style="margin-left: 10px;"><Switcher /></div>
					</div>
				{:else if cell.key === "problem_number"}
					<div>
						{cell.value + 1}
					</div>
				{:else if cell.key === "topics_short"}
					<div style="overflow: hidden;">
						{#if cell.value == null || cell.value == ""}
							<Tag type="gray">None</Tag>
						{:else}
							{#each cell.value.split(", ") as topic}
								<Tag type="gray">{topic}</Tag>
							{/each}
						{/if}
					</div>
				{:else if cell.key === "division"}
					<div style="overflow: hidden;">
						{cell.value}
						<!-- {cell.value == null || cell.value == ""
							? "None"
							: width > 700
							? cell.value
							
							//: cell.value.split(" ")[0].charAt(0) +
							  //cell.value.split(" ")[1].charAt(0)
						} -->
					</div>
				{:else if cell.key === "created_at"}
					<div style="overflow: hidden;">
						
					</div>
				{:else if cell.key === "edited_at"}
					<div style="overflow: hidden;">
						
					</div>
				{:else if cell.key === "unresolved_count"}
					<div style="overflow: hidden;">
						{cell.value ?? 0}
					</div>
				{:else if cell.key === "average_difficulty" || cell.key === "average_quality"}
					<div
						style="overflow: hidden; display: flex; align-items: flex-start;"
					>
						
					</div>
				{:else if cell.key === "status"}
					<div
						style="overflow: hidden; display: flex; align-items: flex-start;"
					>
						{#if cell.value == "Draft"}
							<Tag type="gray">Draft</Tag>
						{:else if cell.value == "Idea"}
							<Tag type="blue">Idea</Tag>
						{:else if cell.value == "Endorsed"}
							<Tag type="cyan">Endorsed</Tag>
						{:else if cell.value == "On Test"}
							<Tag type="green">On Test</Tag>
						{:else if cell.value == "Published"}
							<Tag type="purple">Published</Tag>
						{:else if cell.value == "Archived"}
							<Tag type="high-contrast">Archived</Tag>
						{/if}
					</div>
				{:else if cell.key === "feedback_status"}
					<div
						style="overflow: hidden; display: flex; align-items: flex-start;"
					>
						{#if cell.value == "Needs Review"}
							<Tag type="magenta">Needs Review</Tag>
						{:else if cell.value == "Awaiting Feedback"}
							<Tag type="blue">Awaiting Feedback</Tag>
						{:else if cell.value == "Awaiting Endorsement"}
							<Tag type="teal">Awaiting Endorsement</Tag>
						{:else if cell.value == "Awaiting Testsolve"}
							<Tag type="cyan">Awaiting Testsolve</Tag>
						{:else if cell.value == "Complete"}
							<Tag type="green">Complete</Tag>
						{:else if cell.value == "Archived"}
							<Tag type="high-contrast">Archived</Tag>
						{/if}
					</div>
				{:else if cell.key === "problem_tests"}
					<div
						style="overflow: hidden; display: flex; align-items: flex-start;"
					>
						{#if row.problem_tests && row.problem_tests.length > 0}
							{#each row.problem_tests.split(", ") as test}
								<Tag type="warm-gray">{test}</Tag>
							{/each}
						{:else}
							-
						{/if}
					</div>
				{:else}
					<div style="overflow: hidden;">
						{cell.value == null || cell.value == "" ? "-" : cell.value}
					</div>
				{/if}
			</div>
		</svelte:fragment>
		<svelte:fragment slot="expanded-row" let:row>
			<Problem problem={row} />
		</svelte:fragment>
	</DataTable>
	{#if pageEnabled}
		<Pagination
			class="datatable"
			bind:pageSize
			bind:page
			totalItems={students.length}
			pageSizeInputDisabled
		/>
	{/if}
</div>

<style>
	.drag-div {
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: grab;
	}

	.rating {
		align-items: left;
	}

	:global(.bx--data-table--sticky-header) {
		max-height: 800px;
	}

	:global(.bx--table-header-label) {
		white-space: nowrap;
	}

	:global(.bx--data-table-container),
	:global(.bx--pagination) {
		width: 100% !important;
	}

	:global(.bx--table-expand__button) {
		width: 30px;
		height: 50px;
	}

	:global(.bx--list-box__field:focus) {
		outline-color: var(--primary);
	}
</style>
