<script lang="ts">
  import EntityTabs from "./EntityTabs.svelte";
  import { UserSolid, UsersGroupSolid, BuildingSolid, TicketSolid } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  
  let activeTabId = "students";
  
  // Icons for each entity type
  const studentIcon = UserSolid;
  const teamIcon = UsersGroupSolid; 
  const orgIcon = BuildingSolid;
  const ticketIcon = TicketSolid;
</script>

<div class="p-4 max-w-5xl mx-auto">
  <h1 class="text-2xl font-bold mb-6">Entity Tabs Example</h1>
  
  <div class="mb-10">
    <h2 class="text-xl font-semibold mb-3">Traditional Style (Default)</h2>
    <EntityTabs
      bind:activeTabId
      tabs={[
        {
          id: 'students',
          title: 'Students',
          entityType: 'student',
          icon: studentIcon
        },
        {
          id: 'teams',
          title: 'Teams',
          entityType: 'team',
          icon: teamIcon
        },
        {
          id: 'organizations',
          title: 'Organizations',
          entityType: 'org',
          icon: orgIcon
        },
        {
          id: 'tickets',
          title: 'Tickets',
          entityType: 'ticket',
          icon: ticketIcon
        }
      ]}
      style="traditional"
      contentBackground={false}
    >
      {#if activeTabId === 'students'}
        <div class="p-4">
          <h3 class="text-lg font-medium text-blue-600">Student Content</h3>
          <p>This is the content for the Students tab with the traditional style.</p>
          <p class="mt-2">Notice how the selected tab connects directly with the content panel.</p>
        </div>
      {:else if activeTabId === 'teams'}
        <div class="p-4">
          <h3 class="text-lg font-medium text-green-600">Team Content</h3>
          <p>This is the content for the Teams tab.</p>
        </div>
      {:else if activeTabId === 'organizations'}
        <div class="p-4">
          <h3 class="text-lg font-medium text-purple-600">Organization Content</h3>
          <p>This is the content for the Organizations tab.</p>
        </div>
      {:else if activeTabId === 'tickets'}
        <div class="p-4">
          <h3 class="text-lg font-medium text-amber-600">Tickets Content</h3>
          <p>This is the content for the Tickets tab.</p>
        </div>
      {/if}
    </EntityTabs>
  </div>
  
  <div class="mb-10">
    <h2 class="text-xl font-semibold mb-3">Pill Style</h2>
    <EntityTabs
      tabs={[
        {
          id: 'students-pill',
          title: 'Students',
          entityType: 'student',
          icon: studentIcon
        },
        {
          id: 'teams-pill',
          title: 'Teams',
          entityType: 'team',
          icon: teamIcon
        },
        {
          id: 'organizations-pill',
          title: 'Organizations',
          entityType: 'org',
          icon: orgIcon
        }
      ]}
      style="pill"
      contentBackground={false}
    >
      <div class="p-4 border rounded">
        <p>Content for pill style tabs.</p>
      </div>
    </EntityTabs>
  </div>
  
  <div class="mb-10">
    <h2 class="text-xl font-semibold mb-3">Traditional Style with Content Background</h2>
    <EntityTabs
      tabs={[
        {
          id: 'students-full',
          title: 'Students',
          entityType: 'student'
        },
        {
          id: 'teams-full',
          title: 'Teams',
          entityType: 'team'
        },
        {
          id: 'organizations-full',
          title: 'Organizations',
          entityType: 'org'
        }
      ]}
      style="traditional"
      contentBackground={true}
    >
      <div class="p-4">
        <p>Content with traditional tabs that connect directly to the content.</p>
      </div>
    </EntityTabs>
  </div>
</div> 