<script lang="ts">
    import { page }        from '$app/stores'
    import { onMount }     from 'svelte'
    import CustomTable     from '$lib/components/CustomTable.svelte'
    import {
      fetchTestProblemss,
      fetchStudentProblemTable
    } from '$lib/supabase/cheating'
  
    let test_id:number =  Number($page.params.test_id);
    let event_id:     number =  Number($page.params.event_id);
    let student_event_id: number =  Number($page.params.student_event_id);
  
    let columns: any[] = [];
    let data:    any[] = [];
  
  
    onMount(async () => {
      const { problems, row } = await fetchStudentProblemTable(test_id, student_event_id)
  
      columns = [
        { key: 'front_id',  label: 'Front ID',   visible: true },
        { key: 'fullName',  label: 'Name',       visible: true },
        { key: 'startTime', label: 'Start Time', visible: true },
        // one triple of columns per problem
        ...problems.flatMap(p => [
          { key: `p${p.problem_number}_latex`, label: `#${p.problem_number} Ans`, visible: p.problem_number < 5 ? true : false },
        ]),
        ...problems.flatMap(p => [
          { key: `p${p.problem_number}_min`,   label: `#${p.problem_number} (min)`,   visible: p.problem_number < 5 ? true : false },
        ]),
        ...problems.flatMap(p => [
          { key: `p${p.problem_number}_rt`,    label: `#${p.problem_number} Real Time`, visible: false },
        ])
      ]
  
      data = [row]
    })
  </script>
  
  <CustomTable
    {data}
    {columns}
    entityType="student_answers"
    idField="student_event_id"
  />
  