<script lang="ts">
    import CustomTable from './CustomTable.svelte';
    import type { CheatMetrics } from "$lib/supabase";
    import { page } from '$app/stores';

    export let metrics: CheatMetrics[];
    export let event_id: number;
    export let event_name: string;
    import { goto } from '$app/navigation';

    const base = $page.url.pathname;

    const rowActions = [
    {
      icon: '',            // no visible icon
      tooltip: 'View details',
      callback: (row) => {
        console.log(row);
        goto(`${base}/team/${row.team_id}`);
      }
    }
  ];

  
    const columns = [
      { key: 'test_taker_id',   label: 'ID',             visible: false },
      { key: 'fullName',        label: 'Student',        visible: true,  frozen: true },
      { key: 'teamFrontId',     label: 'Team #',         visible: true },
      {
        key: 'p_speed',
        label: 'Speed Score',
        visible: true,
        dataType: 'number',
        format: (v: number) => ({ text: `${(v * 100).toFixed(1)}%`, isBadge: false })
      },
      {
        key: 'p_globalTiming',
        label: 'Global Timing',
        visible: true,
        dataType: 'number',
        format: (v: number) => ({ text: `${(v * 100).toFixed(1)}%`, isBadge: false })
      },
      {
        key: 'teamRapidFlag',
        label: 'Team Rapid?',
        visible: true,
        dataType: 'boolean',
        format: (v: boolean) => ({
          text: v ? 'YES' : 'no',
          isBadge: true,
          color: v ? 'red' : 'none'
        })
      },
      {
        key: 'teamMIAflag',
        label: 'Team MIA?',
        visible: true,
        dataType: 'boolean',
        format: (v: boolean) => ({
          text: v ? 'YES' : 'no',
          isBadge: true,
          color: v ? 'red' : 'none'
        })
      },
      {
        key: 'p_globalMIA',
        label: 'Global MIA',
        visible: true,
        dataType: 'number',
        format: (v: number) => ({ text: `${(v * 100).toFixed(1)}%`, isBadge: false })
      },
      {
        key: 'testDuration',
        label: 'Duration (s)',
        visible: true,
        dataType: 'number'
      },
      {
        key: 'pasteCount',
        label: 'Pastes',
        visible: true,
        dataType: 'number'
      }
    ];
  </script>
  
  <CustomTable
    data={metrics}
    columns={columns}
    entityType="cheatMetrics"
    isLoading={false}
    event_id={event_id}
    event_name={event_name}
    tableId={`cheat_${event_id}`}
    idField="test_taker_id"
    rowActions={rowActions}
    selectable={false}
    debounceSearch={300}
    lazyLoad={true}
    forceLoadVisibility={true}
  />
  