<!-->
This table is for displaying links to Score Reports and Certificates on the students page and possibly the coaches page.  

</!-->

<script lang="ts">
  import type { UnifiedColumn } from "./CustomTable.svelte";

  import CustomTable from "./CustomTable.svelte";
  import {onMount} from "svelte";
  import {getUploadedResults} from "$lib/supabase/events";


  let {student_event_ids} = $props();
  let loading = $state(false);
  let is_coach = $state(false) //Placeholder for now
  let results_data = $state()

  function loadResultsData(
    student_event_ids: number[]
  ){
    console.log("Student Event Id", student_event_ids);
    console.log("Type of student_event_ids", typeof student_event_ids);
    const uploaded_results = student_event_ids.map((id: number ) => getUploadedResults(id));
    console.log(uploaded_results);
    
    

  }


  

  onMount(async () => {
    loadResultsData(student_event_ids);

    
  });
  







</script>


{#snippet hyperlink(col: UnifiedColumn, row : any)}
{#if col["key"] == "link"}
  <a href={row[col["key"]]} style="display:block;">{row[col["key"]]}</a>
{:else}
  {row[col["key"]]}
{/if}
{/snippet}


<CustomTable 
  data={[
  {student_name : "Francis Chua", team_name: "SMTA", report_type: "Score Report", link : "https://google.com"},
  {student_name : "Arpit Ransaria", team_name: "SMTA", report_type: "Score Report", link : "https://google.com"},
  ]}
  columns={[

    { key: 'student_name', label: 'Name', visible: is_coach },
    { key: 'team_name', label: 'Team', visible: is_coach },
    { key: 'report_type', label: 'Item', visible: true },
    { key: 'link', label: 'Download Link', visible: true, format : "column-snippet"},  // This column will be frozen
  ]}
  entityType="user"
  idField="id"
  tableId="users_table"
  isLoading = {loading}
  selectable = {false} 
  minimal = {true}
  component_renderer = {hyperlink}

  
/>
  


<style>

</style>
