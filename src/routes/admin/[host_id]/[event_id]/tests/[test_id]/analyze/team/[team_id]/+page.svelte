<script lang="ts">
    import { page }        from '$app/stores'
    import { onMount }     from 'svelte'
    import CustomTable     from '$lib/components/CustomTable.svelte'
    import {
      fetchTestProblems,
      fetchTeamProblemTable
    } from '$lib/supabase/cheating'
  
    let test_id:  number
    let event_id: number
    let team_id:  number
  
    let columns: any[] = []
    let data:    any[] = []
  
    $: {
      const p = $page.params
      test_id  = +p.test_id
      event_id = +p.event_id
      team_id  = +p.team_id
    }
    
    // TODO: combine this with studnet columnnn
    onMount(async () => {
      const { problems, rows } = await fetchTeamProblemTable(test_id, team_id, event_id)
  
      columns = [
        { key: 'front_id',  label: 'Front ID',   visible: true },
        { key: 'fullName',  label: 'Name',       visible: true },
        { key: 'startTime', label: 'Start Time', visible: true },
        ...problems.flatMap(p => [
          { key: `p${p.problem_number}_latex`, label: `#${p.problem_number} Ans`, visible: p.problem_number < 5 ? true : false },
          { key: `p${p.problem_number}_min`,   label: `#${p.problem_number} (min)`,   visible: p.problem_number < 5 ? true : false },
          { key: `p${p.problem_number}_rt`,    label: `#${p.problem_number} Real Time`, visible: false },
        ]),

      ]
  
      data = rows
    })
  </script>
  
  <CustomTable
    data={data}
    columns={columns}
    entityType="team_answers"
    idField="student_event_id"
  />
  