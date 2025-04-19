<script lang="ts">
    import CustomTable from './CustomTable.svelte';
    import type { CheatMetrics } from "$lib/supabase";
    import { page } from '$app/stores';

    export let metrics: CheatMetrics[];
    export let event_id: number;
    export let event_name: string;
    import { goto } from '$app/navigation';
    import { EyeOutline } from "flowbite-svelte-icons";

    const base = $page.url.pathname;

    const rowActions = [
    {
      icon: EyeOutline,            // no visible icon
      tooltip: 'View details',
      callback: (row) => {
        goto(`${base}/team/${row.team_id}`);
      }
    }
  ];

  
    const columns = [
      { key: 'test_taker_id',   label: 'ID',             visible: false, dataType: 'number' },
      { key: 'fullName',        label: 'Student',        visible: true, dataType: 'string' },
      { key: 'teamFrontId',     label: 'Team #',         visible: true, dataType: 'string' },
      {
        key: 'p_speed',
        label: 'Speed Score',
        visible: true,
        dataType: 'number',
        format: (v: number) => ({ text: `${(v * 100).toFixed(1)}%`, isBadge: false })
      },
      {
        key: 'teamRapidFlag',
        label: 'Team Rapid',
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
        label: 'Team MIA',
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
        dataType: 'boolean',
        format: (v: boolean) => ({
          text: v ? 'YES' : 'no',
          isBadge: true,
          color: v ? 'red' : 'none'
        })
      },
    //   {
    //     key: 'testDuration',
    //     label: 'Duration (s)',
    //     visible: false,
    //     dataType: 'number'
    //   },
      {
        key: 'cheating_probability',
        label: 'Cheating Probability',
        visible: true,
        dataType: 'number',
        format: (v: number) => ({ text: `${(v * 100).toFixed(1)}%`, isBadge: false })
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
    debounceSearch={300}
    lazyLoad={true}
    forceLoadVisibility={true}
  />
  