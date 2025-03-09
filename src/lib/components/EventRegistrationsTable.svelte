<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Tabs,
    TabItem,
    Badge,
    Button,
    Search,
    Checkbox,
    Dropdown,
    DropdownItem
  } from "flowbite-svelte";
  import { 
    getEventStudents, 
    getEventTeams, 
    getEventCustomFields,
    getCustomFieldResponsesBatch,
    getEventTicketCount
  } from "$lib/supabase/events";
  import { getOrganizationDetails } from "$lib/supabase/orgs";
  import { onMount } from "svelte";
  import type { Tables } from "../../../db/database.types";

  // Define types for our extended data structures
  // Old types for reference
  /*
  type StudentWithDetails = {
    student_event_id: number;
    student_id: string;
    event_id: number;
    team_id: number | null;
    org_id: number | null;
    front_id: string | null;
    created_at: string;
    person: {
      student_id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      grade: string | null;
      contestdojo_id: string | null;
      last_log_in: string | null;
    };
    fullName: string;
    registeredAt: string;
  };

  type TeamWithDetails = {
    team_id: number;
    event_id: number;
    team_name: string;
    join_code: string;
    org_id: number | null;
    front_id: string | null;
    created_at: string;
    createdAt: string;
    studentCount: number;
  };

  type OrgWithDetails = {
    org_id: number;
    name: string | null;
    address: any;
    created_at?: string;
    coaches?: { person: { first_name: string; last_name: string; email: string } }[];
    teams?: any[];
    event?: { 
      join_code?: string; 
      created_at?: string;
      org_event_id?: number;
    } | null;
    studentCount: number;
    teamCount: number;
    registeredAt: string;
  };
  */

  // New types for restructured data
  type StudentRowData = {
    student_id: string;
    student_event_id: number;
    event_id: number;
    team_id: number | null;
    org_id: number | null;
    front_id: string | null;
    email: string;
    first_name: string | null;
    last_name: string | null;
    grade: string | null;
    fullName: string;
    team_name: string | null;
    org_name: string | null;
    registeredAt: string;
    [key: string]: any; // For custom fields: custom_field.field_key
  };

  type TeamRowData = {
    team_id: number;
    event_id: number;
    team_name: string;
    join_code: string;
    org_id: number | null;
    front_id: string | null;
    org_name: string | null;
    studentCount: number;
    createdAt: string;
    [key: string]: any; // For custom fields: custom_field.field_key
  };

  type OrgRowData = {
    org_id: number;
    name: string | null;
    address: any;
    join_code: string | null;
    coaches: string;
    studentCount: number;
    teamCount: number;
    registeredAt: string;
    event?: {
      join_code?: string;
      created_at?: string;
      org_event_id?: number;
    } | null;
    [key: string]: any; // For custom fields: custom_field.field_key
  };

  type CustomField = {
    custom_field_id: number;
    label: string;
    key: string;
    custom_field_type: string;
    [key: string]: any;
  };

  type OrgDataFromAPI = {
    org_id: number;
    name: string | null;
    address: any;
    created_at: string;
    event?: {
      join_code?: string;
      created_at?: string;
      org_event_id?: number;
    } | null;
    coaches?: Array<{
      person: {
        first_name: string;
        last_name: string;
        email: string;
      }
    }>;
  };

  // Props
  let { event_id, host_id } = $props();

  // State variables - changed from arrays to ID-keyed objects
  let students = $state<Record<string, StudentRowData>>({});
  let teams = $state<Record<number, TeamRowData>>({});
  let orgs = $state<Record<number, OrgRowData>>({});
  let studentCustomFields = $state<CustomField[]>([]);
  let teamCustomFields = $state<CustomField[]>([]);
  let orgCustomFields = $state<CustomField[]>([]);
  let customFieldValues = $state<Record<string, string>>({});
  let loading = $state(true);
  let activeTab = $state(0);
  let totalPurchasedTickets = $state(0);
  
  // Search and filter state
  let studentSearchTerm = $state('');
  let teamSearchTerm = $state('');
  let orgSearchTerm = $state('');
  let visibleStudentColumns = $state<Record<string, boolean>>({
    student_id: true,
    front_id: true,
    fullName: true,
    email: true,
    team_id: true,
    team_name: true,
    org_id: true,
    org_name: true,
    registeredAt: true
  });
  let visibleTeamColumns = $state<Record<string, boolean>>({
    team_id: true,
    front_id: true,
    team_name: true,
    join_code: true,
    org_id: true,
    org_name: true,
    studentCount: true,
    createdAt: true
  });
  let visibleOrgColumns = $state<Record<string, boolean>>({
    org_id: true,
    name: true,
    join_code: true,
    coaches: true,
    address: true,
    studentCount: true,
    teamCount: true,
    registeredAt: true
  });

  // Fetch data on mount
  onMount(async () => {
    try {
      loading = true;
      
      // Fetch data in parallel
      const [
        studentsData, 
        teamsData, 
        studentCustomFieldsData, 
        teamCustomFieldsData, 
        orgCustomFieldsData,
        ticketCount
      ] = await Promise.all([
        getEventStudents(event_id),
        getEventTeams(event_id),
        getEventCustomFields(event_id, "students"),
        getEventCustomFields(event_id, "teams"),
        getEventCustomFields(event_id, "orgs"),
        getEventTicketCount(event_id)
      ]);
      
      // Store ticket count
      totalPurchasedTickets = ticketCount;
      
      // Process students data
      students = {};
      studentsData.forEach(student => {
        // Create the student entry with all required properties
        students[student.student_id] = {
          student_id: student.student_id,
          student_event_id: student.student_event_id,
          event_id: student.event_id,
          team_id: student.team_id,
          org_id: student.org_id,
          front_id: student.front_id,
          email: student.person.email,
          first_name: student.person.first_name,
          last_name: student.person.last_name,
          grade: student.person.grade,
          fullName: `${student.person.first_name || ''} ${student.person.last_name || ''}`.trim(),
          team_name: null, // Will be populated after teams are processed
          org_name: null, // Will be populated after orgs are processed
          registeredAt: new Date().toLocaleString(), // Default value
        };
      });
      
      // Fetch custom field values
      studentsData.forEach(student => {
        if (student.created_at) {
          students[student.student_id].registeredAt = new Date(student.created_at).toLocaleString();
        }
      });
      
      // Process teams data
      teams = {};
      teamsData.forEach(team => {
        teams[team.team_id] = {
          team_id: team.team_id,
          event_id: team.event_id,
          team_name: team.team_name,
          join_code: team.join_code,
          org_id: team.org_id,
          front_id: team.front_id,
          org_name: null, // Will be populated after orgs are processed
          studentCount: 0, // Will be updated below
          createdAt: new Date().toLocaleString(), // Default value
        };
      });
      
      // Add created_at if available
      teamsData.forEach(team => {
        if ('created_at' in team) {
          teams[team.team_id].createdAt = new Date(team.created_at as string).toLocaleString();
        }
      });
      
      // Count students per team and update team_name in students
      Object.keys(teams).forEach(teamId => {
        const numTeamId = parseInt(teamId);
        const team = teams[numTeamId];
        team.studentCount = Object.values(students).filter(s => s.team_id === numTeamId).length;
        
        // Update team name in students
        Object.values(students)
          .filter(s => s.team_id === numTeamId)
          .forEach(s => {
            s.team_name = team.team_name;
          });
      });
      
      // Store custom fields
      studentCustomFields = studentCustomFieldsData;
      teamCustomFields = teamCustomFieldsData;
      orgCustomFields = orgCustomFieldsData;
      
      // Initialize custom field column visibility
      studentCustomFields.forEach(field => {
        visibleStudentColumns[`custom_field.${field.key}`] = true;
      });
      
      teamCustomFields.forEach(field => {
        visibleTeamColumns[`custom_field.${field.key}`] = true;
      });
      
      orgCustomFields.forEach(field => {
        visibleOrgColumns[`custom_field.${field.key}`] = true;
      });
      
      // Load column visibility from localStorage if available
      try {
        const savedStudentColumns = localStorage.getItem(`event_${event_id}_student_columns`);
        if (savedStudentColumns) {
          visibleStudentColumns = JSON.parse(savedStudentColumns);
        }
        
        const savedTeamColumns = localStorage.getItem(`event_${event_id}_team_columns`);
        if (savedTeamColumns) {
          visibleTeamColumns = JSON.parse(savedTeamColumns);
        }
        
        const savedOrgColumns = localStorage.getItem(`event_${event_id}_org_columns`);
        if (savedOrgColumns) {
          visibleOrgColumns = JSON.parse(savedOrgColumns);
        }
      } catch (e) {
        console.error("Error loading column visibility from localStorage:", e);
      }
      
      // First fetch organizations, then fetch custom field values
      await fetchOrganizations();
      await fetchCustomFieldValues();
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      loading = false;
    }
  });

  // Fetch organizations data
  async function fetchOrganizations() {
    try {
      // Get unique org IDs from students and teams
      const orgIds = Array.from(new Set([
        ...Object.values(students).map(s => s.org_id).filter(id => id !== null),
        ...Object.values(teams).map(t => t.org_id).filter(id => id !== null)
      ])) as number[];
      
      if (orgIds.length === 0) {
        orgs = {};
        return;
      }
      
      // Fetch org details in parallel
      orgs = {};
      await Promise.all(
        orgIds.map(async (orgId) => {
          try {
            const orgData = await getOrganizationDetails(orgId, event_id) as OrgDataFromAPI;
            // Create organization entry with all required properties
            orgs[orgId] = {
              org_id: orgId,
              name: orgData.name,
              address: orgData.address,
              join_code: orgData.event?.join_code || null,
              coaches: orgData.coaches ? 
                orgData.coaches.map(c => `${c.person.first_name} ${c.person.last_name} (${c.person.email})`).join(', ') : 
                '',
              studentCount: Object.values(students).filter(s => s.org_id !== null && s.org_id === orgId).length,
              teamCount: Object.values(teams).filter(t => t.org_id !== null && t.org_id === orgId).length,
              registeredAt: orgData.event?.created_at ? 
                new Date(orgData.event.created_at).toLocaleString() : 
                new Date().toLocaleString(),
              // Store original event data for custom field processing
              event: orgData.event,
            };
            
            // Update org name in students and teams
            Object.values(students)
              .filter(s => s.org_id !== null && s.org_id === orgId)
              .forEach(s => {
                s.org_name = orgData.name;
              });
              
            Object.values(teams)
              .filter(t => t.org_id !== null && t.org_id === orgId)
              .forEach(t => {
                t.org_name = orgData.name;
              });
          } catch (error) {
            console.error(`Error fetching org ${orgId}:`, error);
          }
        })
      );
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  }

  // Fetch custom field values for all entities in batch
  async function fetchCustomFieldValues() {
    try {
      // Prepare entity IDs for batch fetching
      const studentIds = Object.values(students).map(s => s.student_event_id);
      const teamIds = Object.keys(teams).map(Number);
      
      // For organizations, we need to use org_event_id, not org_id
      const orgEventIds = Object.values(orgs)
        .filter(o => o.event && o.event.org_event_id !== undefined)
        .map(o => o.event.org_event_id);
      
      // Fetch custom field values in parallel for all entity types
      const [studentValues, teamValues, orgValues] = await Promise.all([
        getCustomFieldResponsesBatch(studentCustomFields, studentIds, "students"),
        getCustomFieldResponsesBatch(teamCustomFields, teamIds, "teams"),
        getCustomFieldResponsesBatch(orgCustomFields, orgEventIds, "orgs")
      ]);
      
      // Store raw values for debugging/reference
      customFieldValues = {
        ...studentValues,
        ...teamValues,
        ...orgValues
      };
      
      // Add custom field values to each entity with the requested format
      studentCustomFields.forEach(field => {
        Object.values(students).forEach(student => {
          const key = `student_${student.student_event_id}_${field.custom_field_id}`;
          const value = studentValues[key] || '';
          student[`custom_field.${field.key}`] = value;
        });
      });
      
      teamCustomFields.forEach(field => {
        Object.values(teams).forEach(team => {
          const key = `team_${team.team_id}_${field.custom_field_id}`;
          const value = teamValues[key] || '';
          team[`custom_field.${field.key}`] = value;
        });
      });
      
      orgCustomFields.forEach(field => {
        Object.values(orgs).forEach(org => {
          if (org.event?.org_event_id) {
            const key = `org_${org.event.org_event_id}_${field.custom_field_id}`;
            const value = orgValues[key] || '';
            org[`custom_field.${field.key}`] = value;
          }
        });
      });
      
    } catch (error) {
      console.error("Error fetching custom field values:", error);
    }
  }

  // Helper function to get custom field value
  function getCustomFieldValue(entityId: number, fieldId: number, entityType: string): string {
    let key;
    
    if (entityType === 'org') {
      // For organizations, find the org_event_id using the org_id
      const org = orgs[entityId];
      if (org?.event?.org_event_id) {
        key = `${entityType}_${org.event.org_event_id}_${fieldId}`;
      } else {
        return '-'; // No org_event_id found
      }
    } else {
      key = `${entityType}_${entityId}_${fieldId}`;
    }
    
    const value = customFieldValues[key] || '-';
    return value;
  }
  
  // Filter functions
  function filterStudents(students: Record<string, StudentRowData>, searchTerm: string): Record<string, StudentRowData> {
    if (!searchTerm) return students;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return Object.fromEntries(
      Object.entries(students).filter(([id, student]) => 
        student.student_id.toLowerCase().includes(lowerSearchTerm) ||
        (student.front_id && student.front_id.toLowerCase().includes(lowerSearchTerm)) ||
        student.fullName.toLowerCase().includes(lowerSearchTerm) ||
        student.email.toLowerCase().includes(lowerSearchTerm) ||
        (student.team_name && student.team_name.toLowerCase().includes(lowerSearchTerm)) ||
        (student.org_name && student.org_name.toLowerCase().includes(lowerSearchTerm))
      )
    );
  }
  
  function filterTeams(teams: Record<number, TeamRowData>, searchTerm: string): Record<number, TeamRowData> {
    if (!searchTerm) return teams;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return Object.fromEntries(
      Object.entries(teams).filter(([id, team]) => 
        team.team_id.toString().includes(searchTerm) ||
        (team.front_id && team.front_id.toLowerCase().includes(lowerSearchTerm)) ||
        team.team_name.toLowerCase().includes(lowerSearchTerm) ||
        team.join_code.toLowerCase().includes(lowerSearchTerm) ||
        (team.org_name && team.org_name.toLowerCase().includes(lowerSearchTerm))
      )
    );
  }
  
  function filterOrgs(orgs: Record<number, OrgRowData>, searchTerm: string): Record<number, OrgRowData> {
    if (!searchTerm) return orgs;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return Object.fromEntries(
      Object.entries(orgs).filter(([id, org]) => 
        org.org_id.toString().includes(searchTerm) ||
        (org.name && org.name.toLowerCase().includes(lowerSearchTerm)) ||
        (org.join_code && org.join_code.toLowerCase().includes(lowerSearchTerm))
      )
    );
  }
  
  // Save column visibility to localStorage
  function saveColumnVisibility() {
    try {
      localStorage.setItem(`event_${event_id}_student_columns`, JSON.stringify(visibleStudentColumns));
      localStorage.setItem(`event_${event_id}_team_columns`, JSON.stringify(visibleTeamColumns));
      localStorage.setItem(`event_${event_id}_org_columns`, JSON.stringify(visibleOrgColumns));
    } catch (e) {
      console.error("Error saving column visibility to localStorage:", e);
    }
  }
  
  // Toggle column visibility
  function toggleColumn(columnKey: string, tableType: 'student' | 'team' | 'org') {
    if (tableType === 'student') {
      visibleStudentColumns[columnKey] = !visibleStudentColumns[columnKey];
    } else if (tableType === 'team') {
      visibleTeamColumns[columnKey] = !visibleTeamColumns[columnKey];
    } else if (tableType === 'org') {
      visibleOrgColumns[columnKey] = !visibleOrgColumns[columnKey];
    }
    saveColumnVisibility();
  }
</script>

<div class="w-full">
  <div class="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
    <div class="flex flex-col md:flex-row justify-between items-center">
      <div class="flex items-center mb-2 md:mb-0">
        <h3 class="text-lg font-medium text-gray-900 mr-2">Event Registration Summary</h3>
      </div>
      <div class="flex gap-4">
        <div class="flex flex-col items-center text-center px-4 py-2 bg-blue-100 rounded-lg">
          <span class="text-sm text-gray-600">Students</span>
          <span class="text-xl font-semibold text-blue-600">{Object.keys(students).length}</span>
        </div>
        <div class="flex flex-col items-center text-center px-4 py-2 bg-green-100 rounded-lg">
          <span class="text-sm text-gray-600">Teams</span>
          <span class="text-xl font-semibold text-green-600">{Object.keys(teams).length}</span>
        </div>
        <div class="flex flex-col items-center text-center px-4 py-2 bg-purple-100 rounded-lg">
          <span class="text-sm text-gray-600">Organizations</span>
          <span class="text-xl font-semibold text-purple-600">{Object.keys(orgs).length}</span>
        </div>
        <div class="flex flex-col items-center text-center px-4 py-2 bg-amber-100 rounded-lg">
          <span class="text-sm text-gray-600">Tickets Purchased</span>
          <span class="text-xl font-semibold text-amber-600">{totalPurchasedTickets}</span>
        </div>
      </div>
    </div>
  </div>

  <Tabs style="underline" class="themed-tabs" on:change={(e) => activeTab = e.detail}>
    <TabItem open={activeTab === 0} title="Students" class="tab-item" activeClasses="tab-active">
      {#if loading}
        <p>Loading student data...</p>
      {:else}
        <div class="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <Search size="md" placeholder="Search students..." class="search-input" bind:value={studentSearchTerm} />
          
          <div class="relative">
            <Button color="light" class="btn-primary">Show/Hide Columns</Button>
            <Dropdown class="w-48">
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleStudentColumns.student_id} on:change={() => toggleColumn('student_id', 'student')}>
                  Student ID
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleStudentColumns.front_id} on:change={() => toggleColumn('front_id', 'student')}>
                  Front ID
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleStudentColumns.fullName} on:change={() => toggleColumn('fullName', 'student')}>
                  Full Name
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleStudentColumns.email} on:change={() => toggleColumn('email', 'student')}>
                  Email
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleStudentColumns.team_id} on:change={() => toggleColumn('team_id', 'student')}>
                  Team
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleStudentColumns.org_id} on:change={() => toggleColumn('org_id', 'student')}>
                  Organization
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleStudentColumns.registeredAt} on:change={() => toggleColumn('registeredAt', 'student')}>
                  Registered At
                </Checkbox>
              </DropdownItem>
              {#each studentCustomFields as field}
                <DropdownItem class="flex items-center gap-2">
                  <Checkbox checked={visibleStudentColumns[`custom_field.${field.key}`]} on:change={() => toggleColumn(`custom_field.${field.key}`, 'student')}>
                    {field.key} ({field.label})
                  </Checkbox>
                </DropdownItem>
              {/each}
            </Dropdown>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <Table striped={false} hoverable={true} class="table-compact themed-table">
            <TableHead class="border-b">
              {#if visibleStudentColumns.student_id}<TableHeadCell>Student ID</TableHeadCell>{/if}
              {#if visibleStudentColumns.front_id}<TableHeadCell>Front ID</TableHeadCell>{/if}
              {#if visibleStudentColumns.fullName}<TableHeadCell>Full Name</TableHeadCell>{/if}
              {#if visibleStudentColumns.email}<TableHeadCell>Email</TableHeadCell>{/if}
              {#if visibleStudentColumns.team_id}<TableHeadCell>Team</TableHeadCell>{/if}
              {#if visibleStudentColumns.org_id}<TableHeadCell>Organization</TableHeadCell>{/if}
              {#if visibleStudentColumns.registeredAt}<TableHeadCell>Registered At</TableHeadCell>{/if}
              {#each studentCustomFields as field}
                {#if visibleStudentColumns[`custom_field.${field.key}`]}
                  <TableHeadCell>{field.key}</TableHeadCell>
                {/if}
              {/each}
            </TableHead>
            <TableBody>
              {#each Object.entries(filterStudents(students, studentSearchTerm)) as [student_id, student]}
                <TableBodyRow>
                  {#if visibleStudentColumns.student_id}<TableBodyCell>{student.student_id}</TableBodyCell>{/if}
                  {#if visibleStudentColumns.front_id}<TableBodyCell>{student.front_id || '-'}</TableBodyCell>{/if}
                  {#if visibleStudentColumns.fullName}<TableBodyCell>{student.fullName}</TableBodyCell>{/if}
                  {#if visibleStudentColumns.email}
                    <TableBodyCell>
                      <Badge color="blue">{student.email}</Badge>
                    </TableBodyCell>
                  {/if}
                  {#if visibleStudentColumns.team_id}
                    <TableBodyCell>
                      {#if student.team_id}
                        <Badge color="green">
                          {student.team_name || `Team #${student.team_id}`}
                        </Badge>
                      {:else}
                        -
                      {/if}
                    </TableBodyCell>
                  {/if}
                  {#if visibleStudentColumns.org_id}
                    <TableBodyCell>
                      {#if student.org_id}
                        <Badge color="purple">
                          {student.org_name || `Org #${student.org_id}`}
                        </Badge>
                      {:else}
                        -
                      {/if}
                    </TableBodyCell>
                  {/if}
                  {#if visibleStudentColumns.registeredAt}<TableBodyCell>{student.registeredAt}</TableBodyCell>{/if}
                  {#each studentCustomFields as field}
                    {#if visibleStudentColumns[`custom_field.${field.key}`]}
                      <TableBodyCell>
                        {student[`custom_field.${field.key}`] || '-'}
                      </TableBodyCell>
                    {/if}
                  {/each}
                </TableBodyRow>
              {/each}
            </TableBody>
          </Table>
        </div>
      {/if}
    </TabItem>
    
    <TabItem open={activeTab === 1} title="Teams" class="tab-item" activeClasses="tab-active">
      {#if loading}
        <p>Loading team data...</p>
      {:else}
        <div class="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <Search size="md" placeholder="Search teams..." class="search-input" bind:value={teamSearchTerm} />
          
          <div class="relative">
            <Button color="light" class="btn-primary">Show/Hide Columns</Button>
            <Dropdown class="w-48">
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleTeamColumns.team_id} on:change={() => toggleColumn('team_id', 'team')}>
                  Team ID
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleTeamColumns.front_id} on:change={() => toggleColumn('front_id', 'team')}>
                  Front ID
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleTeamColumns.team_name} on:change={() => toggleColumn('team_name', 'team')}>
                  Name
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleTeamColumns.join_code} on:change={() => toggleColumn('join_code', 'team')}>
                  Join Code
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleTeamColumns.org_id} on:change={() => toggleColumn('org_id', 'team')}>
                  Organization
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleTeamColumns.studentCount} on:change={() => toggleColumn('studentCount', 'team')}>
                  Students
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleTeamColumns.createdAt} on:change={() => toggleColumn('createdAt', 'team')}>
                  Created At
                </Checkbox>
              </DropdownItem>
              {#each teamCustomFields as field}
                <DropdownItem class="flex items-center gap-2">
                  <Checkbox checked={visibleTeamColumns[`custom_field.${field.key}`]} on:change={() => toggleColumn(`custom_field.${field.key}`, 'team')}>
                    {field.key} ({field.label})
                  </Checkbox>
                </DropdownItem>
              {/each}
            </Dropdown>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <Table striped={false} hoverable={true} class="table-compact themed-table">
            <TableHead class="border-b">
              {#if visibleTeamColumns.team_id}<TableHeadCell>Team ID</TableHeadCell>{/if}
              {#if visibleTeamColumns.front_id}<TableHeadCell>Front ID</TableHeadCell>{/if}
              {#if visibleTeamColumns.team_name}<TableHeadCell>Name</TableHeadCell>{/if}
              {#if visibleTeamColumns.join_code}<TableHeadCell>Join Code</TableHeadCell>{/if}
              {#if visibleTeamColumns.org_id}<TableHeadCell>Organization</TableHeadCell>{/if}
              {#if visibleTeamColumns.studentCount}<TableHeadCell>Students</TableHeadCell>{/if}
              {#if visibleTeamColumns.createdAt}<TableHeadCell>Created At</TableHeadCell>{/if}
              {#each teamCustomFields as field}
                {#if visibleTeamColumns[`custom_field.${field.key}`]}
                  <TableHeadCell>{field.key}</TableHeadCell>
                {/if}
              {/each}
            </TableHead>
            <TableBody>
              {#each Object.entries(filterTeams(teams, teamSearchTerm)) as [team_id, team]}
                <TableBodyRow>
                  {#if visibleTeamColumns.team_id}<TableBodyCell>{team.team_id}</TableBodyCell>{/if}
                  {#if visibleTeamColumns.front_id}<TableBodyCell>{team.front_id || '-'}</TableBodyCell>{/if}
                  {#if visibleTeamColumns.team_name}<TableBodyCell>{team.team_name}</TableBodyCell>{/if}
                  {#if visibleTeamColumns.join_code}<TableBodyCell>{team.join_code}</TableBodyCell>{/if}
                  {#if visibleTeamColumns.org_id}
                    <TableBodyCell>
                      {#if team.org_id}
                        <Badge color="purple">
                          {team.org_name || `Org #${team.org_id}`}
                        </Badge>
                      {:else}
                        -
                      {/if}
                    </TableBodyCell>
                  {/if}
                  {#if visibleTeamColumns.studentCount}
                    <TableBodyCell>
                      {team.studentCount}
                    </TableBodyCell>
                  {/if}
                  {#if visibleTeamColumns.createdAt}<TableBodyCell>{team.createdAt}</TableBodyCell>{/if}
                  {#each teamCustomFields as field}
                    {#if visibleTeamColumns[`custom_field.${field.key}`]}
                      <TableBodyCell>
                        {team[`custom_field.${field.key}`] || '-'}
                      </TableBodyCell>
                    {/if}
                  {/each}
                </TableBodyRow>
              {/each}
            </TableBody>
          </Table>
        </div>
      {/if}
    </TabItem>
    
    <TabItem open={activeTab === 2} title="Organizations" class="tab-item" activeClasses="tab-active">
      {#if loading}
        <p>Loading organization data...</p>
      {:else}
        <div class="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <Search size="md" placeholder="Search organizations..." class="search-input" bind:value={orgSearchTerm} />
          
          <div class="relative">
            <Button color="light" class="btn-primary">Show/Hide Columns</Button>
            <Dropdown class="w-48">
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleOrgColumns.org_id} on:change={() => toggleColumn('org_id', 'org')}>
                  Org ID
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleOrgColumns.name} on:change={() => toggleColumn('name', 'org')}>
                  Name
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleOrgColumns.join_code} on:change={() => toggleColumn('join_code', 'org')}>
                  Join Code
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleOrgColumns.coaches} on:change={() => toggleColumn('coaches', 'org')}>
                  Coaches
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleOrgColumns.address} on:change={() => toggleColumn('address', 'org')}>
                  Address
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleOrgColumns.studentCount} on:change={() => toggleColumn('studentCount', 'org')}>
                  Students
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleOrgColumns.teamCount} on:change={() => toggleColumn('teamCount', 'org')}>
                  Teams
                </Checkbox>
              </DropdownItem>
              <DropdownItem class="flex items-center gap-2">
                <Checkbox checked={visibleOrgColumns.registeredAt} on:change={() => toggleColumn('registeredAt', 'org')}>
                  Registered At
                </Checkbox>
              </DropdownItem>
              {#each orgCustomFields as field}
                <DropdownItem class="flex items-center gap-2">
                  <Checkbox checked={visibleOrgColumns[`custom_field.${field.key}`]} on:change={() => toggleColumn(`custom_field.${field.key}`, 'org')}>
                    {field.key} ({field.label})
                  </Checkbox>
                </DropdownItem>
              {/each}
            </Dropdown>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <Table striped={false} hoverable={true} class="table-compact themed-table">
            <TableHead class="border-b">
              {#if visibleOrgColumns.org_id}<TableHeadCell>Org ID</TableHeadCell>{/if}
              {#if visibleOrgColumns.name}<TableHeadCell>Name</TableHeadCell>{/if}
              {#if visibleOrgColumns.join_code}<TableHeadCell>Join Code</TableHeadCell>{/if}
              {#if visibleOrgColumns.coaches}<TableHeadCell>Coaches</TableHeadCell>{/if}
              {#if visibleOrgColumns.address}<TableHeadCell>Address</TableHeadCell>{/if}
              {#if visibleOrgColumns.studentCount}<TableHeadCell>Students</TableHeadCell>{/if}
              {#if visibleOrgColumns.teamCount}<TableHeadCell>Teams</TableHeadCell>{/if}
              {#if visibleOrgColumns.registeredAt}<TableHeadCell>Registered At</TableHeadCell>{/if}
              {#each orgCustomFields as field}
                {#if visibleOrgColumns[`custom_field.${field.key}`]}
                  <TableHeadCell>{field.key}</TableHeadCell>
                {/if}
              {/each}
            </TableHead>
            <TableBody>
              {#each Object.entries(filterOrgs(orgs, orgSearchTerm)) as [org_id, org]}
                <TableBodyRow>
                  {#if visibleOrgColumns.org_id}<TableBodyCell>{org.org_id}</TableBodyCell>{/if}
                  {#if visibleOrgColumns.name}<TableBodyCell>{org.name}</TableBodyCell>{/if}
                  {#if visibleOrgColumns.join_code}<TableBodyCell>{org.join_code || '-'}</TableBodyCell>{/if}
                  {#if visibleOrgColumns.coaches}
                    <TableBodyCell>
                      {#if org.coaches && org.coaches.length > 0}
                        <Badge color="blue">{org.coaches}</Badge>
                      {:else}
                        -
                      {/if}
                    </TableBodyCell>
                  {/if}
                  {#if visibleOrgColumns.address}<TableBodyCell>{org.address ? JSON.stringify(org.address) : '-'}</TableBodyCell>{/if}
                  {#if visibleOrgColumns.studentCount}<TableBodyCell>{org.studentCount || 0}</TableBodyCell>{/if}
                  {#if visibleOrgColumns.teamCount}<TableBodyCell>{org.teamCount || 0}</TableBodyCell>{/if}
                  {#if visibleOrgColumns.registeredAt}<TableBodyCell>{org.registeredAt}</TableBodyCell>{/if}
                  {#each orgCustomFields as field}
                    {#if visibleOrgColumns[`custom_field.${field.key}`]}
                      <TableBodyCell>
                        {org[`custom_field.${field.key}`] || '-'}
                      </TableBodyCell>
                    {/if}
                  {/each}
                </TableBodyRow>
              {/each}
            </TableBody>
          </Table>
        </div>
      {/if}
    </TabItem>
  </Tabs>
</div>

<style>
  /* Add fallback CSS variables in case the global ones aren't defined */
  :root {
    --primary: var(--primary, #4B5563);
    --primary-light: var(--primary-light, #E5E7EB);
    --primary-tint: var(--primary-tint, #F9FAFB);
    --primary-dark: var(--primary-dark, #374151);
    --secondary: var(--secondary, #6B7280);
    --accent: var(--accent, #3B82F6);
  }

  :global(.table-compact) {
    border-collapse: collapse;
  }
  
  :global(.table-compact th),
  :global(.table-compact td) {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
  
  :global(.border-b) {
    border-bottom-width: 1px;
    border-color: var(--primary-light, #ddd);
  }

  /* Table theming with global colors */
  :global(.themed-table thead) {
    background-color: var(--primary);
    color: white;
  }

  :global(.themed-table th) {
    font-weight: 600;
  }

  :global(.themed-table tbody tr:nth-child(odd)) {
    background-color: var(--primary-tint);
  }

  :global(.themed-table tbody tr:nth-child(even)) {
    background-color: white;
  }

  :global(.themed-table tbody tr:hover) {
    background-color: var(--primary-light);
    transition: background-color 0.2s;
  }

  :global(.themed-table td) {
    border-color: var(--primary-light);
  }

  /* Button theming */
  :global(.btn-primary) {
    background-color: var(--primary);
    color: white;
    border: none;
  }

  :global(.btn-primary:hover) {
    background-color: var(--primary-dark);
  }

  /* Tab theming */
  :global(.tab-active) {
    color: var(--primary);
    border-color: var(--primary);
  }

  :global(.tab-item:hover) {
    color: var(--primary-dark);
  }

  /* Badge theming */
  :global(.badge.blue) {
    background-color: var(--accent, #3B82F6);
  }

  :global(.badge.green) {
    background-color: var(--success, #10B981);
  }

  :global(.badge.purple) {
    background-color: var(--purple, #8B5CF6);
  }

  /* Search and filter controls */
  :global(.search-input) {
    border-color: var(--primary-light);
  }

  :global(.dropdown-toggle) {
    background-color: var(--primary);
    color: white;
  }

  /* Add a subtle box shadow for depth */
  :global(.table-compact) {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border-radius: 0.375rem;
    overflow: hidden;
    margin-bottom: 1rem;
  }
</style>
