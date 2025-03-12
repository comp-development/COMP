<script lang="ts">
  import {
    Tabs,
    TabItem
  } from "flowbite-svelte";
  import { 
    getEventStudents, 
    getEventTeams, 
    getEventCustomFields,
    getCustomFieldResponsesBatch,
    getEventTicketCount
  } from "$lib/supabase/events";

  import { getOrganizationDetails, getTicketCount } from "$lib/supabase/orgs";
  import { onMount } from "svelte";
  import type { Tables } from "../../../db/database.types";
  import CustomTable from './CustomTable.svelte';

  // Define types for our extended data structures
  // Updated to use array structures instead of dictionaries

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
    ticketCount: number;
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
    dataType?: 'string' | 'number' | 'date' | 'boolean';
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
      coach_id: string;
      org_id: number;
      created_at: string;
      org_coach_id: number;
      person: {
        coach_id: string;
        email: string;
        first_name: string;
        last_name: string;

      }
    }>;
  };

  // Props
  let { event_id, host_id, event_name } = $props();

  // State variables - changed from objects to arrays
  let students = $state<StudentRowData[]>([]);
  let teams = $state<TeamRowData[]>([]);
  let orgs = $state<OrgRowData[]>([]);
  let studentCustomFields = $state<CustomField[]>([]);
  let teamCustomFields = $state<CustomField[]>([]);
  let orgCustomFields = $state<CustomField[]>([]);
  let customFieldValues = $state<Record<string, string>>({});
  let loading = $state(true);
  let activeTab = $state(0);
  let totalPurchasedTickets = $state(0);
  

  // Column definitions for CustomTable
  const studentColumns = [
    { key: 'student_id', label: 'Student ID', visible: true, searchable: true, dataType: 'string' as const },
    { key: 'front_id', label: 'Student #', visible: true, searchable: true, dataType: 'string' as const },
    { key: 'fullName', label: 'Full Name', visible: true, searchable: true, dataType: 'string' as const },
    { 
      key: 'email', 
      label: 'Email', 
      visible: true,
      searchable: true,
      dataType: 'string' as const,
      format: (value: string) => ({ text: value, isBadge: true, color: 'blue' })
    },
    { 
      key: 'team_name', 
      label: 'Team', 
      visible: true,
      searchable: true,
      dataType: 'string' as const,
      format: (value: string, row: StudentRowData) => {
        if (row.team_id) {
          return { text: value || `Team #${row.team_id}`, isBadge: true, color: 'green' };
        }
        return '';
      }
    },
    { 
      key: 'org_name', 
      label: 'Organization', 
      visible: true,
      searchable: true,
      dataType: 'string' as const,
      format: (value: string, row: StudentRowData) => {
        if (row.org_id) {
          return { text: value || `Org #${row.org_id}`, isBadge: true, color: 'purple' };
        }
        return '';
      }
    },
    { key: 'registeredAt', label: 'Registered At', visible: true, searchable: false, dataType: 'date' as const }
  ];

  const teamColumns = [
    { key: 'team_id', label: 'Team ID', visible: true, searchable: true, dataType: 'number' as const },
    { key: 'front_id', label: 'Team #', visible: true, searchable: true, dataType: 'string' as const },
    { key: 'team_name', label: 'Name', visible: true, searchable: true, dataType: 'string' as const },
    { key: 'join_code', label: 'Join Code', visible: true, searchable: true, dataType: 'string' as const },
    { 
      key: 'org_name', 
      label: 'Organization', 
      visible: true,
      searchable: true,
      dataType: 'string' as const,
      format: (value: string, row: TeamRowData) => {
        if (row.org_id) {
          return { text: value || `Org #${row.org_id}`, isBadge: true, color: 'purple' };
        }
        return '';
      }
    },
    { key: 'studentCount', label: 'Students', visible: true, searchable: false, dataType: 'number' as const },
    { key: 'createdAt', label: 'Created At', visible: true, searchable: false, dataType: 'date' as const }
  ];

  const orgColumns = [
    { key: 'org_id', label: 'Org ID', visible: true, searchable: true, dataType: 'number' as const },
    { key: 'name', label: 'Name', visible: true, searchable: true, dataType: 'string' as const },
    { key: 'join_code', label: 'Join Code', visible: true, searchable: true, dataType: 'string' as const },
    { 
      key: 'coaches', 
      label: 'Coaches', 
      visible: true,
      searchable: true,
      dataType: 'string' as const,
      format: (value: string) => {
        if (value && value.length > 0) {
          return { text: value, isBadge: true, color: 'blue' };
        }
        return '';
      }
    },
    { 
      key: 'address', 
      label: 'Address', 
      visible: true,
      searchable: false,
      dataType: 'string' as const,
      format: (value: any) => value ? JSON.stringify(value) : ''
    },
    { key: 'studentCount', label: 'Students', visible: true, searchable: false, dataType: 'number' as const },
    { key: 'teamCount', label: 'Teams', visible: true, searchable: false, dataType: 'number' as const },
    { 
      key: 'ticketCount', 
      label: 'Total Tickets', 
      visible: true,
      searchable: false,
      dataType: 'number' as const,
      format: (value: number) => ({ text: value.toString(), isBadge: true, color: 'yellow' })
    },
    { key: 'registeredAt', label: 'Registered At', visible: true, searchable: false, dataType: 'date' as const }
  ];


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
      

      // Process students data into array
      students = studentsData.map(student => ({
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
      }));
      
      // Add created_at if available
      studentsData.forEach((student, index) => {
        // Use type assertion to handle the 'created_at' property
        const studentData = student as any;
        if (studentData.created_at) {
          students[index].registeredAt = new Date(studentData.created_at).toLocaleString();
        }
      });
      
      // Process teams data into array
      teams = teamsData.map(team => ({
        team_id: team.team_id,
        event_id: team.event_id,
        team_name: team.team_name,
        join_code: team.join_code,
        org_id: team.org_id,
        front_id: team.front_id,
        org_name: null, // Will be populated after orgs are processed
        studentCount: 0, // Will be updated below
        createdAt: new Date().toLocaleString(), // Default value
      }));
      
      // Add created_at if available
      teamsData.forEach((team, index) => {
        if ('created_at' in team) {
          teams[index].createdAt = new Date(team.created_at as string).toLocaleString();

        }
      });
      
      // Count students per team and update team_name in students

      teams.forEach(team => {
        // Count students for this team
        team.studentCount = students.filter(s => s.team_id === team.team_id).length;
        
        // Update team name in students
        students.forEach(student => {
          if (student.team_id === team.team_id) {
            student.team_name = team.team_name;
          }
        });

      });
      
      // Store custom fields
      studentCustomFields = studentCustomFieldsData;
      teamCustomFields = teamCustomFieldsData;
      orgCustomFields = orgCustomFieldsData;
      

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

        ...students.map(s => s.org_id).filter(id => id !== null),
        ...teams.map(t => t.org_id).filter(id => id !== null)
      ])) as number[];
      
      if (orgIds.length === 0) {
        orgs = [];

        return;
      }
      
      // Fetch org details in parallel

      const orgPromises = orgIds.map(async (orgId) => {
        try {
          const orgData = await getOrganizationDetails(orgId, event_id) as OrgDataFromAPI;
          
          // Fetch ticket count for this organization
          const orgTicketCount = await getTicketCount(event_id, orgId);
          
          // Create organization entry with all required properties
          const orgEntry: OrgRowData = {
            org_id: orgId,
            name: orgData.name,
            address: orgData.address,
            join_code: orgData.event?.join_code || null,
            coaches: orgData.coaches ? 
              orgData.coaches.map(c => `${c.person.first_name} ${c.person.last_name} (${c.person.email})`).join(', ') : 
              '',
            studentCount: students.filter(s => s.org_id === orgId).length,
            teamCount: teams.filter(t => t.org_id === orgId).length,
            ticketCount: orgTicketCount, // Set the actual ticket count
            registeredAt: orgData.event?.created_at ? 
              new Date(orgData.event.created_at).toLocaleString() : 
              new Date().toLocaleString(),
            // Store original event data for custom field processing
            event: orgData.event,
          };
          
          // Update org name in students and teams
          students.forEach(student => {
            if (student.org_id === orgId) {
              student.org_name = orgData.name;
            }
          });
          
          teams.forEach(team => {
            if (team.org_id === orgId) {
              team.org_name = orgData.name;
            }
          });
          
          return orgEntry;
        } catch (error) {
          console.error(`Error fetching org ${orgId}:`, error);
          return null;
        }
      });
      
      // Collect all org data and filter out nulls
      const orgResults = await Promise.all(orgPromises);
      orgs = orgResults.filter((org): org is OrgRowData => org !== null);
      

    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  }

  // Fetch custom field values for all entities in batch
  async function fetchCustomFieldValues() {
    try {
      // Prepare entity IDs for batch fetching

      const studentIds = students.map(s => s.student_event_id);
      const teamIds = teams.map(t => t.team_id);
      
      // For organizations, we need to use org_event_id, not org_id
      const orgEventIds = orgs
        .filter(o => o.event && o.event.org_event_id !== undefined)
        .map(o => o.event?.org_event_id)
        .filter(id => id !== undefined) as number[];

      
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

        // Determine the appropriate dataType based on custom_field_type
        
        field.dataType = mapCustomFieldTypeToDataType(field.custom_field_type);

        students.forEach(student => {

          const key = `student_${student.student_event_id}_${field.custom_field_id}`;
          const value = studentValues[key] || '';
          student[`custom_field.${field.key}`] = value;
        });
      });
      
      teamCustomFields.forEach(field => {

        // Determine the appropriate dataType based on custom_field_type
        field.dataType = mapCustomFieldTypeToDataType(field.custom_field_type);
        
        teams.forEach(team => {

          const key = `team_${team.team_id}_${field.custom_field_id}`;
          const value = teamValues[key] || '';
          team[`custom_field.${field.key}`] = value;
        });
      });
      
      orgCustomFields.forEach(field => {

        // Determine the appropriate dataType based on custom_field_type
        field.dataType = mapCustomFieldTypeToDataType(field.custom_field_type);
        
        orgs.forEach(org => {

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


  // Helper function to map custom_field_type to dataType
  function mapCustomFieldTypeToDataType(fieldType: string): 'string' | 'number' | 'date' | 'boolean' {
    switch (fieldType.toLowerCase()) {
      case 'number':
      case 'integer':
        return 'number' as const;
      case 'date':
        return 'date' as const;
      case 'text':
      case 'paragraph':
      case 'email':
      case 'phone':
      case 'multiple_choice':
      case 'dropdown':
      case 'checkboxes':
      default:
        return 'string' as const;
    }
  }


  // Helper function to get custom field value
  function getCustomFieldValue(entityId: number, fieldId: number, entityType: string): string {
    let key;
    
    if (entityType === 'org') {
      // For organizations, find the org_event_id using the org_id

      const org = orgs.find(o => o.org_id === entityId);

      if (org?.event?.org_event_id) {
        key = `${entityType}_${org.event.org_event_id}_${fieldId}`;
      } else {
        return ''; // No org_event_id found
      }
    } else {
      key = `${entityType}_${entityId}_${fieldId}`;
    }
    
    const value = customFieldValues[key] || '';
    return value;
  }

</script>

<div class="w-full">
  <div class="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">

    <!-- Title in its own section -->
    <div class="w-full mb-4 border-b pb-2">
      <h3 class="text-xl font-medium text-gray-900">Event Registration Summary</h3>
    </div>
    
    <!-- Stats cards in their own section -->
    <div class="flex flex-wrap gap-4 justify-center sm:justify-between">
      <div class="flex flex-col items-center text-center px-4 py-2 bg-blue-100 rounded-lg">
        <span class="text-sm text-gray-600">Students</span>
        <span class="text-xl font-semibold text-blue-600">{students.length}</span>
      </div>
      <div class="flex flex-col items-center text-center px-4 py-2 bg-green-100 rounded-lg">
        <span class="text-sm text-gray-600">Teams</span>
        <span class="text-xl font-semibold text-green-600">{teams.length}</span>
      </div>
      <div class="flex flex-col items-center text-center px-4 py-2 bg-purple-100 rounded-lg">
        <span class="text-sm text-gray-600">Organizations</span>
        <span class="text-xl font-semibold text-purple-600">{orgs.length}</span>
      </div>
      <div class="flex flex-col items-center text-center px-4 py-2 bg-amber-100 rounded-lg">
        <span class="text-sm text-gray-600">Tickets Purchased</span>
        <span class="text-xl font-semibold text-amber-600">{totalPurchasedTickets}</span>

      </div>
    </div>
  </div>

  <Tabs style="underline" class="themed-tabs" on:change={(e) => activeTab = e.detail}>
    <TabItem open={activeTab === 0} title="Students" class="tab-item" activeClasses="tab-active">
      <CustomTable 
        data={students}
        columns={studentColumns}
        customFields={studentCustomFields}
        entityType="student"
        isLoading={loading}
        event_id={event_id}
        event_name={event_name}
      />
    </TabItem>
    
    <TabItem open={activeTab === 1} title="Teams" class="tab-item" activeClasses="tab-active">
      <CustomTable 
        data={teams}
        columns={teamColumns}
        customFields={teamCustomFields}
        entityType="team"
        isLoading={loading}
        event_id={event_id}
        event_name={event_name}
      />
    </TabItem>
    
    <TabItem open={activeTab === 2} title="Organizations" class="tab-item" activeClasses="tab-active">
      <CustomTable 
        data={orgs}
        columns={orgColumns}
        customFields={orgCustomFields}
        entityType="org"
        isLoading={loading}
        event_id={event_id}
        event_name={event_name}
      />

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
