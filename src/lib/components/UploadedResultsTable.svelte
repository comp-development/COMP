<!-->
This table is for displaying links to Score Reports and Certificates on the students page and possibly the coaches page.  

</!-->

<script lang="ts">
  import type { UnifiedColumn } from "./CustomTable.svelte";

  import CustomTable from "./CustomTable.svelte";
  import {onMount} from "svelte";
  import {getUploadedResults} from "$lib/supabase/events";
  import type { AsyncReturnType } from "$lib/supabaseClient";

  let columns: any[] = $state([]);

  let {student_event_ids, user_type}: {student_event_ids : number[], user_type : "student" | "coach" | "admin"} = $props();
  let loading = $state(false);
  let table_data: AsyncReturnType<typeof loadResultsData> | [] = $state([]);
  let custom_table_props = $state({ nameVisible: false, minimal: true, selectable: false });
  async function loadResultsData(
    student_event_ids: number[]
  ){
    console.log("Student Event Id", student_event_ids);
    console.log("Type of student_event_ids", typeof student_event_ids);

    
    const uploaded_results= await getUploadedResults(student_event_ids);
    console.log("Uploaded Results", uploaded_results);
    
    const flattened_uploaded_results = uploaded_results?.map((result) => {  //Flatten Result of sql query into array of Rows for table
     return {
       student_name: result.student_events.students.first_name + " " + result.student_events.students.last_name,
       team_name: result.student_events.teams.team_name,
       report_type: result.report_type,
       report_link: toGoogleDriveDownloadLink(result.report_link),
       visible: result.visible,
       disqualified: result.disqualified,
     }
    }).filter((result) => result.visible);  //Get rid of results that are not "Visible" 
    return flattened_uploaded_results 
    
  }

  function toGoogleDriveDownloadLink(
      googleDriveLink: string
      ){
    //Basically turns a google drive view file link to an automatic download link
    let pattern = /\/file\/d\/(.+)\//;
    let googleDriveIdMatches = googleDriveLink.match(pattern);
    console.log("googleDriveIdMatches", googleDriveIdMatches);
    if (googleDriveIdMatches === null) return googleDriveLink;
    let googleDriveId = googleDriveIdMatches[1]
      return `https://drive.google.com/uc?export=download&id=${googleDriveId}`

  }


  

  onMount(async () => {
    custom_table_props = { nameVisible: true, minimal: false, selectable: false };
    table_data = await loadResultsData(student_event_ids); 
    switch (user_type) {
      case "student":
        custom_table_props = { nameVisible: false, minimal: true, selectable: false };
        break;
      case "coach":
        custom_table_props = { nameVisible: true, minimal: true, selectable: false };
        break;
      case "admin":
        custom_table_props = { nameVisible: true, minimal: false, selectable: true };
        break;
    }
    columns = [
      { key: 'student_name', label: 'Name', visible: custom_table_props.nameVisible},
      { key: 'team_name', label: 'Team', visible: custom_table_props.nameVisible},
      { key: 'report_type', label: 'Item', visible: true },
      { key: 'report_link', label: 'Download Link', visible: true, format : "column-snippet"},  
    ];

    console.log("Table Data", table_data);
    console.log("custom_table_props", custom_table_props);
  });
</script>

{#snippet hyperlink(col: UnifiedColumn, row : any)}
{#if col["key"] == "report_link"}
  {#if row["disqualified"]}
     Disqualified Result
   {:else}
     <a href={row[col["key"]]} style="display:block;">{row[col["key"]]}</a>
   {/if}
{:else}
  {row[col["key"]]}
{/if}
{/snippet}

<CustomTable 
  data={table_data}
  columns={columns}
  entityType="user"
  idField="id"
  tableId="users_table"
  isLoading = {loading}
  selectable = {custom_table_props.selectable} 
  minimal = {custom_table_props.minimal}
  component_renderer = {hyperlink}
  forceLoadVisibility = {true}
/>
  


<style>

</style>

