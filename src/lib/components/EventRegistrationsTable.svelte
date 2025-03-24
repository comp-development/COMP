<script lang="ts">
  import { Tabs, TabItem } from "flowbite-svelte";
  import {
    Tabs,
    TabItem,
    Modal,
    Button,
    Radio,
    Select,
    Alert,
    Spinner
  } from "flowbite-svelte";
  import { 
    getEventStudents, 
    getEventTeams, 
    getEventCustomFields,
    getCustomFieldResponsesBatch,
    getEventTicketCount,
    getEventOrganizations

  } from "$lib/supabase/events";
  import { getOrganizationDetails, getTicketCount } from "$lib/supabase/orgs";
  import { transferStudentToTeam, transferStudentToOrg, transferTeamToOrg } from "$lib/supabase/transfers";
  import { onMount } from "svelte";
  import CustomTable from './CustomTable.svelte';
  import { UsersGroupSolid, BuildingSolid, ArrowRightAltSolid } from "flowbite-svelte-icons";


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
    waiver: string | null;
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
    dataType?: "string" | "number" | "date" | "boolean";
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
      };
    }>;
  };

  // Define a generic column type
  type TableColumn = {
    key: string;
    label: string;
    visible: boolean;
    searchable?: boolean;
    dataType?: 'string' | 'number' | 'date' | 'boolean';
    format?: (value: any, row: any) => { text: string; isBadge: boolean; color?: string } | string;
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
  
  // Student selection state
  let selectedStudents = $state<any[]>([]);
  let hasSelectedStudents = $state(false);

  // Team selection state
  let selectedTeams = $state<any[]>([]);
  let hasSelectedTeams = $state(false);

  // Transfer modal state
  let showTransferModal = $state(false);
  let transferType = $state<'team' | 'org'>('team');
  let selectedTeamId = $state<number | null>(null);
  let selectedOrgId = $state<number | null>(null);
  let transferInProgress = $state(false);
  let transferError = $state<string | null>(null);
  let transferSuccess = $state(false);
  let failedStudents = $state<StudentRowData[]>([]); // Track students that failed to transfer
  let isRetry = $state(false); // Flag to indicate if this is a retry operation
  
  // Team transfer modal state
  let showTeamTransferModal = $state(false);
  let teamTransferInProgress = $state(false);
  let failedTeams = $state<TeamRowData[]>([]); // Track teams that failed to transfer

  // Computed sorted arrays for dropdowns
  const sortedTeams = $derived(
    [...teams].sort((a, b) => (a.team_name || '').localeCompare(b.team_name || ''))
  );

  const sortedOrgs = $derived(
    [...orgs].sort((a, b) => (a.name || `Organization #${a.org_id}`).localeCompare(b.name || `Organization #${b.org_id}`))
  );
  
  // Debug effect to monitor activeTab changes
  $effect(() => {
    console.log("Active tab changed to:", activeTab);
  });

  // Column definitions for CustomTable
  let studentColumns = $state([
    {
      key: "student_id",
      label: "Student ID",
      visible: true,
      searchable: true,
      dataType: "string" as const,
    },
    {
      key: "front_id",
      label: "Student #",
      visible: true,
      searchable: true,
      dataType: "string" as const,
    },
    {
      key: "fullName",
      label: "Full Name",
      visible: true,
      searchable: true,
      dataType: "string" as const,
    },
    {
      key: "email",
      label: "Email",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      format: (value: string) => ({
        text: value,
        isBadge: true,
        color: "blue",
      }),
    },
    { 
      key: 'team_id', 
      label: 'Team ID', 
      visible: true,
      searchable: true,
      dataType: 'number' as const
    },
    { 
      key: 'team_name', 
      label: 'Team', 
      visible: true,
      searchable: true,
      dataType: "string" as const,
      format: (value: string, row: StudentRowData) => {
        if (row.team_id) {
          return {
            text: value || `Team #${row.team_id}`,
            isBadge: true,
            color: "green",
          };
        }
        return "";
      },
    },
    { 
      key: 'org_id', 
      label: 'Org ID', 
      visible: true,
      searchable: true,
      dataType: 'number' as const
    },
    { 
      key: 'org_name', 
      label: 'Organization', 
      visible: true,
      searchable: true,
      dataType: "string" as const,
      format: (value: string, row: StudentRowData) => {
        if (row.org_id) {
          return {
            text: value || `Org #${row.org_id}`,
            isBadge: true,
            color: "purple",
          };
        }
        return "";
      },
    },
    {
      key: "registeredAt",
      label: "Registered At",
      visible: true,
      searchable: false,
      dataType: "date" as const,
    },
    {
      key: "waiver",
      label: "Waiver",
      visible: true,
      searchable: true,
      dataType: "link" as const,
    },
  ]);

  const teamColumns = [
    { key: 'team_id', label: 'Team ID', visible: true, searchable: true, dataType: 'number' as const },
    { key: 'front_id', label: 'Team #', visible: true, searchable: true, dataType: 'string' as const },
    { key: 'team_name', label: 'Name', visible: true, searchable: true, dataType: 'string' as const },
    { key: 'join_code', label: 'Join Code', visible: true, searchable: true, dataType: 'string' as const },
    { 
      key: 'org_id', 
      label: 'Org ID', 
      visible: true,
      searchable: true,
      dataType: 'number' as const
    },
    { 
      key: 'org_name', 
      label: 'Organization', 
      visible: true,
      searchable: true,
      dataType: "string" as const,
    },
    {
      key: "org_name",
      label: "Organization",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      format: (value: string, row: TeamRowData) => {
        if (row.org_id) {
          return {
            text: value || `Org #${row.org_id}`,
            isBadge: true,
            color: "purple",
          };
        }
        return "";
      },
    },
    {
      key: "studentCount",
      label: "Students",
      visible: true,
      searchable: false,
      dataType: "number" as const,
    },
    {
      key: "createdAt",
      label: "Created At",
      visible: true,
      searchable: false,
      dataType: "date" as const,
    },
  ];

  const orgColumns = [
    {
      key: "org_id",
      label: "Org ID",
      visible: true,
      searchable: true,
      dataType: "number" as const,
    },
    {
      key: "name",
      label: "Name",
      visible: true,
      searchable: true,
      dataType: "string" as const,
    },
    {
      key: "join_code",
      label: "Join Code",
      visible: true,
      searchable: true,
      dataType: "string" as const,
    },
    {
      key: "coaches",
      label: "Coaches",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      format: (value: string) => {
        if (value && value.length > 0) {
          return { text: value, isBadge: true, color: "blue" };
        }
        return "";
      },
    },
    {
      key: "address",
      label: "Address",
      visible: true,
      searchable: false,
      dataType: "string" as const,
      format: (value: any) => (value ? JSON.stringify(value) : ""),
    },
    {
      key: "studentCount",
      label: "Students",
      visible: true,
      searchable: false,
      dataType: "number" as const,
    },
    {
      key: "teamCount",
      label: "Teams",
      visible: true,
      searchable: false,
      dataType: "number" as const,
    },
    {
      key: "ticketCount",
      label: "Total Tickets",
      visible: true,
      searchable: false,
      dataType: "number" as const,
      format: (value: number) => ({
        text: value.toString(),
        isBadge: true,
        color: "yellow",
      }),
    },
    {
      key: "registeredAt",
      label: "Registered At",
      visible: true,
      searchable: false,
      dataType: "date" as const,
    },
  ];

  // Computed properties for merged columns
  function getMergedStudentColumns(): TableColumn[] {
    // Start with regular columns
    const regularColumns = [...studentColumns];
    
    // Add custom field columns
    const customColumns = studentCustomFields.map(field => ({
      key: `custom_field.${field.key}`,
      label: field.key,
      visible: true,
      searchable: true,
      dataType: field.dataType || 'string' as const
    }));
    
    return [...regularColumns, ...customColumns];
  }

  function getMergedTeamColumns(): TableColumn[] {
    // Start with regular columns
    const regularColumns = [...teamColumns];
    
    // Add custom field columns
    const customColumns = teamCustomFields.map(field => ({
      key: `custom_field.${field.key}`,
      label: field.key,
      visible: true,
      searchable: true,
      dataType: field.dataType || 'string' as const
    }));
    
    return [...regularColumns, ...customColumns];
  }

  function getMergedOrgColumns(): TableColumn[] {
    // Start with regular columns
    const regularColumns = [...orgColumns];
    
    // Add custom field columns
    const customColumns = orgCustomFields.map(field => ({
      key: `custom_field.${field.key}`,
      label: field.key,
      visible: true,
      searchable: true,
      dataType: field.dataType || 'string' as const
    }));
    
    return [...regularColumns, ...customColumns];
  }

  // Handle student selection changes
  function handleStudentSelectionChange(event: CustomEvent) {
    const { selectedData, count } = event.detail;
    selectedStudents = selectedData;
    hasSelectedStudents = count > 0;
  }

  // Handle team selection changes
  function handleTeamSelectionChange(event: CustomEvent) {
    const { selectedData, count } = event.detail;
    selectedTeams = selectedData;
    hasSelectedTeams = count > 0;
  }
  
  // Handle tab change
  function handleTabChange(event: CustomEvent) {
    console.log("Tab changed:", event.detail);
    activeTab = event.detail;
    // Log the current state to confirm
    console.log("Current active tab:", activeTab);
  }

  // Open transfer modal
  function openTransferModal() {
    // Reset previous state
    transferType = 'team';
    selectedTeamId = null;
    selectedOrgId = null;
    transferError = null;
    transferSuccess = false;
    failedStudents = [];
    isRetry = false;
    showTransferModal = true;
  }

  // Open team transfer modal
  function openTeamTransferModal() {
    // Reset previous state
    selectedOrgId = null;
    transferError = null;
    transferSuccess = false;
    failedTeams = [];
    isRetry = false;
    showTeamTransferModal = true;
  }

  // Execute the transfer based on selected options
  async function executeTransfer() {
    // Determine which students to process
    const studentsToProcess = isRetry ? failedStudents : selectedStudents;
    
    if (!studentsToProcess.length) return;

    transferInProgress = true;
    transferError = null;
    transferSuccess = false;
    
    // Reset failed students if this is a new transfer (not a retry)
    if (!isRetry) {
      failedStudents = [];
    }

    try {
      // Track results for each student
      const results = [];
      const failures = [];
      const newFailedStudents: StudentRowData[] = [];

      // Process transfers one by one to capture individual errors
      for (const student of studentsToProcess) {
        try {
          if (transferType === 'team' && selectedTeamId) {
            console.log("Transferring student to team", student.student_event_id, selectedTeamId);
            await transferStudentToTeam(student.student_event_id, selectedTeamId);
            results.push(`Successfully transferred ${student.fullName} to team`);
          } else if (transferType === 'org' && selectedOrgId) {
            console.log("Transferring student to org", student.student_event_id, selectedOrgId);
            await transferStudentToOrg(student.student_event_id, selectedOrgId);
            results.push(`Successfully transferred ${student.fullName} to organization`);
          }
        } catch (error) {
          console.log("ERROR", error);
          // Check if error has a message property directly before falling back to string conversion or default
          const errorMessage = error && typeof error === 'object' && 'message' in error
            ? (error as { message: string }).message
            : (error ? String(error) : 'Unknown error');
          console.log("ERROR MESSAGE", errorMessage);
          failures.push(`Error transferring ${student.fullName}: ${errorMessage}`);
          newFailedStudents.push(student); // Add to failed students list
          console.error(`Transfer error for student ${student.student_id}:`, error);
        }
      }

      // Update the failedStudents state
      failedStudents = newFailedStudents;

      // Determine if the operation was successful overall
      if (failures.length === 0) {
        // Complete success
        transferSuccess = true;
      } else if (results.length === 0) {
        // Complete failure
        transferError = `All transfers failed. Errors:\n${failures.join('\n')}`;
      } else {
        // Partial success
        transferSuccess = true;
        transferError = `Some transfers failed (${failures.length}/${studentsToProcess.length}):\n${failures.join('\n')}`;
      }

      // Set the retry flag for next time
      isRetry = failures.length > 0;

      // Reload data after 1 second to show success message
      setTimeout(async () => {
        // Reload students data
        const studentsData = await getEventStudents(event_id);
        
        // Process students data into array
        students = studentsData.map((student: any) => ({
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
          team_name: null,
          org_name: null,
          registeredAt: new Date().toLocaleString(),
        }));
        
        // Add created_at if available
        studentsData.forEach((student: any, index: number) => {
          // Use type assertion to handle the 'created_at' property
          const studentData = student as any;
          if (studentData.created_at) {
            students[index].registeredAt = new Date(studentData.created_at).toLocaleString();
          }
        });

        // Update team names
        teams.forEach(team => {
          students.forEach(student => {
            if (student.team_id === team.team_id) {
              student.team_name = team.team_name;
            }
          });
        });

        // Update org names
        orgs.forEach(org => {
          students.forEach(student => {
            if (student.org_id === org.org_id) {
              student.org_name = org.name;
            }
          });
        });

        // Only close modal if all transfers succeeded
        if (failures.length === 0) {
          showTransferModal = false;
        }
      }, 1000);
    } catch (error) {
      // Apply the same improved error message extraction logic here
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : (error ? String(error) : 'An unknown error occurred');
      transferError = errorMessage;
    } finally {
      transferInProgress = false;
    }
  }

  // Execute team transfer to organization
  async function executeTeamTransfer() {
    if (!selectedTeams.length || !selectedOrgId) return;

    teamTransferInProgress = true;
    transferError = null;
    transferSuccess = false;
    
    // Reset failed teams if this is a new transfer (not a retry)
    if (!isRetry) {
      failedTeams = [];
    }

    try {
      // Track results for each team
      const results = [];
      const failures = [];
      const newFailedTeams: TeamRowData[] = [];

      // Process transfers one by one to capture individual errors
      for (const team of selectedTeams) {
        try {
          console.log("Transferring team to org", team.team_id, selectedOrgId);
          await transferTeamToOrg(team.team_id, selectedOrgId);
          results.push(`Successfully transferred ${team.team_name} to organization`);
        } catch (error) {
          console.log("ERROR", error);
          // Check if error has a message property directly before falling back to string conversion or default
          const errorMessage = error && typeof error === 'object' && 'message' in error
            ? (error as { message: string }).message
            : (error ? String(error) : 'Unknown error');
          console.log("ERROR MESSAGE", errorMessage);
          failures.push(`Error transferring ${team.team_name}: ${errorMessage}`);
          newFailedTeams.push(team); // Add to failed teams list
          console.error(`Transfer error for team ${team.team_id}:`, error);
        }
      }

      // Update the failedTeams state
      failedTeams = newFailedTeams;

      // Determine if the operation was successful overall
      if (failures.length === 0) {
        // Complete success
        transferSuccess = true;
      } else if (results.length === 0) {
        // Complete failure
        transferError = `All transfers failed. Errors:\n${failures.join('\n')}`;
      } else {
        // Partial success
        transferSuccess = true;
        transferError = `Some transfers failed (${failures.length}/${selectedTeams.length}):\n${failures.join('\n')}`;
      }

      // Set the retry flag for next time
      isRetry = failures.length > 0;

      // Reload data after 1 second to show success message
      setTimeout(async () => {
        // Reload teams data
        const teamsData = await getEventTeams(event_id);
        
        // Process teams data into array
        teams = teamsData.map((team: any) => ({
          team_id: team.team_id,
          event_id: team.event_id,
          team_name: team.team_name,
          join_code: team.join_code,
          org_id: team.org_id,
          front_id: team.front_id,
          org_name: null,
          studentCount: 0,
          createdAt: team.created_at ? new Date(team.created_at).toLocaleString() : new Date().toLocaleString(),
        }));
        
        // Count students per team
        teams.forEach(team => {
          team.studentCount = students.filter(s => s.team_id === team.team_id).length;
        });

        // Update org names
        orgs.forEach(org => {
          teams.forEach(team => {
            if (team.org_id === org.org_id) {
              team.org_name = org.name;
            }
          });
        });

        // Only close modal if all transfers succeeded
        if (failures.length === 0) {
          showTeamTransferModal = false;
        }
      }, 1000);
    } catch (error) {
      // Apply the same improved error message extraction logic here
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : (error ? String(error) : 'An unknown error occurred');
      transferError = errorMessage;
    } finally {
      teamTransferInProgress = false;
    }
  }

  // Fetch data on mount
  (async () => {
    try {
      loading = true;

      // Fetch data in parallel
      const [
        event,
        studentsData,
        teamsData,
        studentCustomFieldsData,
        teamCustomFieldsData,
        orgCustomFieldsData,
        ticketCount,
      ] = await Promise.all([
        getEventInformation(event_id),
        getEventStudents(event_id),
        getEventTeams(event_id),
        getEventCustomFields(event_id, "students"),
        getEventCustomFields(event_id, "teams"),
        getEventCustomFields(event_id, "orgs"),
        getEventTicketCount(event_id),
      ]);

      if (event.waivers?.type == "external") {
        let updatedColumns = [...studentColumns];
        updatedColumns[7].dataType = "checked" as const;
        studentColumns = updatedColumns;
      } else if (event.waivers?.type == "none") {
        let updatedColumns = [...studentColumns];
        updatedColumns.splice(7, 1);
        studentColumns = updatedColumns;
      }

      // Store ticket count
      totalPurchasedTickets = ticketCount;

      // Process students data into array
      students = studentsData.map((student: any) => ({
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
        fullName:
          `${student.person.first_name || ""} ${student.person.last_name || ""}`.trim(),
        team_name: null, // Will be populated after teams are processed
        org_name: null, // Will be populated after orgs are processed
        registeredAt: new Date().toLocaleString(), // Default value
        waiver: student.waiver,
      }));

      // Add created_at if available
      studentsData.forEach((student: any, index: number) => {
        // Use type assertion to handle the 'created_at' property
        const studentData = student as any;
        if (studentData.created_at) {
          students[index].registeredAt = new Date(
            studentData.created_at,
          ).toLocaleString();
        }
      });

      // Process teams data into array
      teams = teamsData.map((team: any) => ({
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
      teamsData.forEach((team: any, index: number) => {
        if ('created_at' in team) {
          teams[index].createdAt = new Date(team.created_at as string).toLocaleString();
        }
      });

      // Count students per team and update team_name in students

      teams.forEach((team) => {
        // Count students for this team
        team.studentCount = students.filter(
          (s) => s.team_id === team.team_id,
        ).length;

        // Update team name in students
        students.forEach((student) => {
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
  })();

  // Fetch organizations data
  async function fetchOrganizations() {
    try {
      // Get all organizations associated with the event from org_events table
      const orgEventsData = await getEventOrganizations(event_id);
      
      if (orgEventsData.length === 0) {
        orgs = [];
        return;
      }
      
      // Fetch org details and ticket counts in parallel
      const orgPromises = orgEventsData.map(async (orgEvent) => {
        try {
          const orgId = orgEvent.org_id;
          
          // Fetch ticket count for this organization
          const orgTicketCount = await getTicketCount(event_id, orgId);
          
          // Extract org data from the orgEvent
          const orgData = orgEvent.org;
          
          // Format coaches information from the already fetched data
          const coachesText = orgData.coaches && Array.isArray(orgData.coaches) ? 
            orgData.coaches
              .map((c: any) => `${c.person?.first_name || ''} ${c.person?.last_name || ''} (${c.person?.email || ''})`).join(', ') : 
            '';
          // Create organization entry with all required properties
          const orgEntry: OrgRowData = {
            org_id: orgId,
            name: orgData.name,
            address: orgData.address,
            join_code: orgEvent.join_code || null,
            coaches: coachesText,
            studentCount: students.filter(s => s.org_id === orgId).length,
            teamCount: teams.filter(t => t.org_id === orgId).length,
            ticketCount: orgTicketCount,
            registeredAt: orgEvent.created_at ? 
              new Date(orgEvent.created_at).toLocaleString() : 
              new Date().toLocaleString(),
            // Store original event data for custom field processing
            event: {
              join_code: orgEvent.join_code,
              created_at: orgEvent.created_at,
              org_event_id: orgEvent.org_event_id
            },
          };

          // Update org name in students and teams
          students.forEach((student) => {
            if (student.org_id === orgId) {
              student.org_name = orgData.name;
            }
          });

          teams.forEach((team) => {
            if (team.org_id === orgId) {
              team.org_name = orgData.name;
            }
          });

          return orgEntry;
        } catch (error) {
          console.error(`Error processing org ${orgEvent.org_id}:`, error);
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

      const studentIds = students.map((s) => s.student_event_id);
      const teamIds = teams.map((t) => t.team_id);

      // For organizations, we need to use org_event_id, not org_id
      const orgEventIds = orgs
        .filter((o) => o.event && o.event.org_event_id !== undefined)
        .map((o) => o.event?.org_event_id)
        .filter((id) => id !== undefined) as number[];

      // Fetch custom field values in parallel for all entity types
      const [studentValues, teamValues, orgValues] = await Promise.all([
        getCustomFieldResponsesBatch(
          studentCustomFields,
          studentIds,
          "students",
        ),
        getCustomFieldResponsesBatch(teamCustomFields, teamIds, "teams"),
        getCustomFieldResponsesBatch(orgCustomFields, orgEventIds, "orgs"),
      ]);

      // Store raw values for debugging/reference
      customFieldValues = {
        ...studentValues,
        ...teamValues,
        ...orgValues,
      };

      // Add custom field values to each entity with the requested format
      studentCustomFields.forEach((field) => {
        // Determine the appropriate dataType based on custom_field_type

        field.dataType = mapCustomFieldTypeToDataType(field.custom_field_type);

        students.forEach((student) => {
          const key = `student_${student.student_event_id}_${field.custom_field_id}`;
          const value = studentValues[key] || "";
          student[`custom_field.${field.key}`] = value;
        });
      });

      teamCustomFields.forEach((field) => {
        // Determine the appropriate dataType based on custom_field_type
        field.dataType = mapCustomFieldTypeToDataType(field.custom_field_type);

        teams.forEach((team) => {
          const key = `team_${team.team_id}_${field.custom_field_id}`;
          const value = teamValues[key] || "";
          team[`custom_field.${field.key}`] = value;
        });
      });

      orgCustomFields.forEach((field) => {
        // Determine the appropriate dataType based on custom_field_type
        field.dataType = mapCustomFieldTypeToDataType(field.custom_field_type);

        orgs.forEach((org) => {
          if (org.event?.org_event_id) {
            const key = `org_${org.event.org_event_id}_${field.custom_field_id}`;
            const value = orgValues[key] || "";
            org[`custom_field.${field.key}`] = value;
          }
        });
      });
    } catch (error) {
      console.error("Error fetching custom field values:", error);
    }
  }

  // Helper function to map custom_field_type to dataType
  function mapCustomFieldTypeToDataType(
    fieldType: string,
  ): "string" | "number" | "date" | "boolean" {
    switch (fieldType.toLowerCase()) {
      case "number":
      case "integer":
        return "number" as const;
      case "date":
        return "date" as const;
      case "text":
      case "paragraph":
      case "email":
      case "phone":
      case "multiple_choice":
      case "dropdown":
      case "checkboxes":
      default:
        return "string" as const;
    }
  }

  // Helper function to get custom field value
  function getCustomFieldValue(entityId: number, fieldId: number, entityType: string): string {
    let key = '';
    
    if (entityType === 'org') {
      // For organizations, find the org_event_id using the org_id
      const org = orgs.find(o => o.org_id === entityId);

      if (org?.event?.org_event_id) {
        key = `${entityType}_${org.event.org_event_id}_${fieldId}`;
      } else {
        return ""; // No org_event_id found
      }
    } else {
      // For other entity types
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
      <h3 class="text-xl font-medium text-gray-900">
        Event Registration Summary
      </h3>
    </div>

    <!-- Stats cards in their own section -->
    <div class="flex flex-wrap gap-4 justify-center sm:justify-between">
      <div
        class="flex flex-col items-center text-center px-4 py-2 bg-blue-100 rounded-lg"
      >
        <span class="text-sm text-gray-600">Students</span>
        <span class="text-xl font-semibold text-blue-600"
          >{students.length}</span
        >
      </div>
      <div
        class="flex flex-col items-center text-center px-4 py-2 bg-green-100 rounded-lg"
      >
        <span class="text-sm text-gray-600">Teams</span>
        <span class="text-xl font-semibold text-green-600">{teams.length}</span>
      </div>
      <div
        class="flex flex-col items-center text-center px-4 py-2 bg-purple-100 rounded-lg"
      >
        <span class="text-sm text-gray-600">Organizations</span>
        <span class="text-xl font-semibold text-purple-600">{orgs.length}</span>
      </div>
      <div
        class="flex flex-col items-center text-center px-4 py-2 bg-amber-100 rounded-lg"
      >
        <span class="text-sm text-gray-600">Tickets Purchased</span>
        <span class="text-xl font-semibold text-amber-600">{totalPurchasedTickets}</span>
      </div>
    </div>
  </div>
  <Tabs style="underline" class="themed-tabs">
    <TabItem 
      open={activeTab === 0} 
      title="Students" 
      class="tab-item" 
      activeClasses="tab-active"
      onclick={() => activeTab = 0}
    >
      <CustomTable 
        data={students}
        columns={getMergedStudentColumns()}
        entityType="student"
        isLoading={loading}
        event_id={event_id}
        event_name={event_name}
        tableId={`event_${event_id}_students`}
        idField="student_id"
        on:selectionChange={handleStudentSelectionChange}
      >
        <svelte:fragment slot="actions">
          {#if hasSelectedStudents && activeTab === 0}
            <Button color="primary" on:click={openTransferModal} class="flex items-center gap-2">
              <ArrowRightAltSolid class="w-4 h-4" />
              Transfer Students ({selectedStudents.length})
            </Button>
          {/if}
        </svelte:fragment>
      </CustomTable>
    </TabItem>
    
    <TabItem 
      open={activeTab === 1} 
      title="Teams" 
      class="tab-item" 
      activeClasses="tab-active"
      onclick={() => activeTab = 1}
    >
      <CustomTable 
        data={teams}
        columns={getMergedTeamColumns()}
        entityType="team"
        isLoading={loading}
        event_id={event_id}
        event_name={event_name}
        tableId={`event_${event_id}_teams`}
        idField="team_id"
        selectable={true}
        on:selectionChange={handleTeamSelectionChange}
      >
        <svelte:fragment slot="actions">
          {#if hasSelectedTeams && activeTab === 1}
            <Button color="primary" on:click={openTeamTransferModal} class="flex items-center gap-2">
              <ArrowRightAltSolid class="w-4 h-4" />
              Transfer Teams ({selectedTeams.length})
            </Button>
          {/if}
        </svelte:fragment>
      </CustomTable>
    </TabItem>
    
    <TabItem 
      open={activeTab === 2} 
      title="Organizations" 
      class="tab-item" 
      activeClasses="tab-active"
      onclick={() => activeTab = 2}
    >
      <CustomTable 
        data={orgs}
        columns={getMergedOrgColumns()}
        entityType="org"
        isLoading={loading}
        event_id={event_id}
        event_name={event_name}
        tableId={`event_${event_id}_orgs`}
        idField="org_id"
      />
    </TabItem>
  </Tabs>

  <!-- Transfer Modal -->
  <Modal title="Transfer Students" bind:open={showTransferModal} size="md" autoclose={false}>
    <div class="space-y-4">
      {#if transferSuccess && !transferError}
        <Alert color="green" class="mb-4">
          <span class="font-medium">Success!</span> All students have been transferred successfully.
        </Alert>
      {:else if transferSuccess && transferError}
        <Alert color="yellow" class="mb-4">
          <span class="font-medium">Partial Success!</span> Some students were transferred successfully, but others encountered errors.
        </Alert>
        
        <div class="mt-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Failed Transfers ({failedStudents.length})</h4>
          <div class="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
            {#each failedStudents as student, index}
              <div class="p-3 {index !== failedStudents.length - 1 ? 'border-b border-red-100' : ''}">
                <div class="flex items-start">
                  <div class="flex-shrink-0 text-red-500 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">{student.fullName}</h3>
                    <div class="mt-1 text-xs text-red-700">
                      {#if transferError}
                        {transferError.split('\n')
                          .find(line => line.includes(student.fullName))
                          ?.replace(`Error transferring ${student.fullName}: `, '') || 'Unknown error'}
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else if transferError}
        <Alert color="red" class="mb-4">
          <span class="font-medium">Error:</span> Failed to transfer students.
        </Alert>
        
        <div class="mt-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Failed Transfers ({failedStudents.length})</h4>
          <div class="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
            {#each failedStudents as student, index}
              <div class="p-3 {index !== failedStudents.length - 1 ? 'border-b border-red-100' : ''}">
                <div class="flex items-start">
                  <div class="flex-shrink-0 text-red-500 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">{student.fullName}</h3>
                    <div class="mt-1 text-xs text-red-700">
                      {#if transferError}
                        {transferError.split('\n')
                          .find(line => line.includes(student.fullName))
                          ?.replace(`Error transferring ${student.fullName}: `, '') || 'Unknown error'}
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <p class="mb-2">
          {#if isRetry}
            Retry transfer for {failedStudents.length} failed student{failedStudents.length !== 1 ? 's' : ''} to:
          {:else}
            Transfer {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} to:
          {/if}
        </p>

        <div class="flex flex-col gap-3">
          <!-- Transfer Type Selection -->
          <div class="flex gap-4">
            <Radio name="transferType" value="team" bind:group={transferType}>
              <div class="flex items-center gap-2">
                <UsersGroupSolid class="w-4 h-4 text-green-600" />
                <span>Team</span>
              </div>
            </Radio>
            <Radio name="transferType" value="org" bind:group={transferType}>
              <div class="flex items-center gap-2">
                <BuildingSolid class="w-4 h-4 text-purple-600" />
                <span>Organization</span>
              </div>
            </Radio>
          </div>

          <!-- Team Selection -->
          {#if transferType === 'team'}
            <div class="mt-2">
              <label for="team-select" class="block mb-2 text-sm font-medium text-gray-900">
                Select Team
              </label>
              <Select id="team-select" class="w-full" bind:value={selectedTeamId}>
                <option value={null} disabled selected>Choose a team...</option>
                {#each sortedTeams as team}
                  <option value={team.team_id}>
                    {team.team_name} ({team.org_name ? `${team.org_name} - ` : ''}ID: {team.team_id})
                  </option>
                {/each}
              </Select>
              <Alert color="yellow" class="mt-2 text-xs">
                <span class="font-medium">Note:</span> Students will also be moved to the selected team's organization automatically.
              </Alert>
            </div>
          {:else}
            <!-- Organization Selection -->
            <div class="mt-2">
              <label for="org-select" class="block mb-2 text-sm font-medium text-gray-900">
                Select Organization
              </label>
              <Select id="org-select" class="w-full" bind:value={selectedOrgId}>
                <option value={null} disabled selected>Choose an organization...</option>
                {#each sortedOrgs as org}
                  <option value={org.org_id}>
                    {org.name || `Organization #${org.org_id}`}
                  </option>
                {/each}
              </Select>
              <Alert color="yellow" class="mt-2 text-xs">
                <span class="font-medium">Note:</span> Students will be removed from their current teams when being transferred to a new organization.
              </Alert>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Modal Footer -->
    <svelte:fragment slot="footer">
      <Button color="alternative" on:click={() => showTransferModal = false}>
        {transferSuccess && !transferError ? 'Close' : 'Cancel'}
      </Button>
      {#if !transferSuccess || (transferSuccess && transferError)}
        <Button 
          color="primary" 
          on:click={executeTransfer} 
          disabled={transferInProgress || (transferType === 'team' && !selectedTeamId) || (transferType === 'org' && !selectedOrgId)}
        >
          {#if transferInProgress}
            <Spinner class="mr-2" size="4" />
          {/if}
          {#if isRetry}
            Retry Transfer ({failedStudents.length})
          {:else}
            Transfer
          {/if}
        </Button>
      {/if}
    </svelte:fragment>
  </Modal>

  <!-- Team Transfer Modal -->
  <Modal title="Transfer Teams" bind:open={showTeamTransferModal} size="md" autoclose={false}>
    <div class="space-y-4">
      {#if transferSuccess && !transferError}
        <Alert color="green" class="mb-4">
          <span class="font-medium">Success!</span> All teams have been transferred successfully.
        </Alert>
      {:else if transferSuccess && transferError}
        <Alert color="yellow" class="mb-4">
          <span class="font-medium">Partial Success!</span> Some teams were transferred successfully, but others encountered errors.
        </Alert>
        
        <div class="mt-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Failed Transfers ({failedTeams.length})</h4>
          <div class="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
            {#each failedTeams as team, index}
              <div class="p-3 {index !== failedTeams.length - 1 ? 'border-b border-red-100' : ''}">
                <div class="flex items-start">
                  <div class="flex-shrink-0 text-red-500 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">{team.team_name}</h3>
                    <div class="mt-1 text-xs text-red-700">
                      {#if transferError}
                        {transferError.split('\n')
                          .find(line => line.includes(team.team_name))
                          ?.replace(`Error transferring ${team.team_name}: `, '') || 'Unknown error'}
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else if transferError}
        <Alert color="red" class="mb-4">
          <span class="font-medium">Error:</span> Failed to transfer teams.
        </Alert>
        
        <div class="mt-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Failed Transfers ({failedTeams.length})</h4>
          <div class="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
            {#each failedTeams as team, index}
              <div class="p-3 {index !== failedTeams.length - 1 ? 'border-b border-red-100' : ''}">
                <div class="flex items-start">
                  <div class="flex-shrink-0 text-red-500 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">{team.team_name}</h3>
                    <div class="mt-1 text-xs text-red-700">
                      {#if transferError}
                        {transferError.split('\n')
                          .find(line => line.includes(team.team_name))
                          ?.replace(`Error transferring ${team.team_name}: `, '') || 'Unknown error'}
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <p class="mb-2">
          {#if isRetry}
            Retry transfer for {failedTeams.length} failed team{failedTeams.length !== 1 ? 's' : ''} to:
          {:else}
            Transfer {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} to:
          {/if}
        </p>

        <div class="flex flex-col gap-3">
          <!-- Organization Selection -->
          <div class="mt-2">
            <label for="team-org-select" class="block mb-2 text-sm font-medium text-gray-900">
              Select Organization
            </label>
            <Select id="team-org-select" class="w-full" bind:value={selectedOrgId}>
              <option value={null} disabled selected>Choose an organization...</option>
              {#each sortedOrgs as org}
                <option value={org.org_id}>
                  {org.name || `Organization #${org.org_id}`}
                </option>
              {/each}
            </Select>
            <Alert color="yellow" class="mt-2 text-xs">
              <span class="font-medium">Note:</span> All students on the selected teams will also be transferred to the new organization.
            </Alert>
          </div>
        </div>
      {/if}
    </div>

    <!-- Modal Footer -->
    <svelte:fragment slot="footer">
      <Button color="alternative" on:click={() => showTeamTransferModal = false}>
        {transferSuccess && !transferError ? 'Close' : 'Cancel'}
      </Button>
      {#if !transferSuccess || (transferSuccess && transferError)}
        <Button 
          color="primary" 
          on:click={executeTeamTransfer} 
          disabled={teamTransferInProgress || !selectedOrgId}
        >
          {#if teamTransferInProgress}
            <Spinner class="mr-2" size="4" />
          {/if}
          {#if isRetry}
            Retry Transfer ({failedTeams.length})
          {:else}
            Transfer
          {/if}
        </Button>
      {/if}
    </svelte:fragment>
  </Modal>
</div>

<style>
  /* Add fallback CSS variables in case the global ones aren't defined */
  :root {
    --primary: var(--primary, #4b5563);
    --primary-light: var(--primary-light, #e5e7eb);
    --primary-tint: var(--primary-tint, #f9fafb);
    --primary-dark: var(--primary-dark, #374151);
    --secondary: var(--secondary, #6b7280);
    --accent: var(--accent, #3b82f6);
  }

  :global(.table-compact) {
    border-collapse: collapse;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border-radius: 0.375rem;
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
    background-color: var(--accent, #3b82f6);
  }

  :global(.badge.green) {
    background-color: var(--success, #10b981);
  }

  :global(.badge.purple) {
    background-color: var(--purple, #8b5cf6);
  }

  /* Search and filter controls */
  :global(.search-input) {
    border-color: var(--primary-light);
  }

  :global(.dropdown-toggle) {
    background-color: var(--primary);
    color: white;
  }
</style>
