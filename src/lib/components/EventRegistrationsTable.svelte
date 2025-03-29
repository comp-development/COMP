<script lang="ts">
  import {
    Tabs,
    TabItem,
    Modal,
    Button,
    Radio,
    Select,
    Alert,
    Spinner,
    Input,
  } from "flowbite-svelte";
  import {
    getEventStudents,
    getEventTeams,
    getEventCustomFields,
    getCustomFieldResponsesBatch,
    getEventTicketCount,
    getEventOrganizations,
    getEventInformation,
  } from "$lib/supabase/events";
  import { getEventAddonQuantities } from "$lib/supabase";

  import { getOrganizationDetails, getTicketCount } from "$lib/supabase/orgs";
  import {
    transferStudentToTeam,
    transferStudentToOrg,
    transferTeamToOrg,
  } from "$lib/supabase/transfers";
  import { onMount } from "svelte";
  import CustomTable from "./CustomTable.svelte";
  import EntityBadge from "./EntityBadge.svelte";
  import {
    UsersGroupSolid,
    BuildingSolid,
    ArrowRightAltSolid,
    FileCheckSolid,
    FilePenSolid,
    CirclePlusSolid,
    UserSolid,
  } from "flowbite-svelte-icons";
  import type { Tables } from "../../../db/database.types";
  import { supabase } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";

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
    team_name: string | null;
    org_name: string | null;
    org_join_code: string | null;
    registeredAt: string;
    errorMessage?: string; // Add error message field
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
    org_join_code: string | null;
    studentCount: number;
    createdAt: string;
    errorMessage?: string; // Add error message field
    [key: string]: any; // For custom fields: custom_field.field_key
  };

  type OrgRowData = {
    org_id: number;
    name: string | null;
    address: any;
    join_code: string | null;
    coaches: string;
    primaryCoach?: {
      firstName: string;
      lastName: string;
      email: string;
      fullName: string;
      coach_id: string;
    } | null;
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

  type TicketOrderRowData = Tables<"ticket_orders">;

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
    dataType?: "string" | "number" | "date" | "boolean";
    format?: (
      value: any,
      row: any,
    ) => { text: string; isBadge: boolean; color?: string } | string;
  };

  // Define transfer result types at the top of the file with the other type definitions
  type StudentTransferResult = {
    student: StudentRowData;
    result?: any;
    error?: string;
    success: boolean;
  };

  type TeamTransferResult = {
    team: TeamRowData;
    result?: any;
    error?: string;
    success: boolean;
  };

  // Props
  let { event_id, host_id, event_name } = $props();

  // State variables - arrays for table display
  let students: StudentRowData[] = $state([]);
  let teams: TeamRowData[] = $state([]);
  let orgs: OrgRowData[] = $state([]);
  let ticketOrders: TicketOrderRowData[] = $state([]);

  // Add these memoized derived states for formatted data
  let formattedStudentRows = $derived(formatStudentRowsForDisplay(students));
  let formattedTeamRows = $derived(formatTeamRowsForDisplay(teams));
  let formattedOrgRows = $derived(formatOrgRowsForDisplay(orgs));

  // Lookup maps for quick access by ID
  let studentMap = $state<Map<string, StudentRowData>>(new Map());
  let teamMap = $state<Map<number, TeamRowData>>(new Map());
  let orgMap = $state<Map<number, OrgRowData>>(new Map());

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
  let transferType = $state<"team" | "org">("team");
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

  // State for ticket order modal
  let showTicketOrderModal = $state(false);
  let ticketOrderType = $state<"student" | "org">("student");
  let ticketOrderPurchaserID = $state<string | null>(null);
  let ticketOrderQuantity = $state(1);
  let ticketOrderID = $state("");
  let ticketOrderService = $state<"stripe" | "eventbrite" | "admin">("admin");
  let ticketOrderInsertInProgress = $state(false);
  let ticketOrderError: null | Error = $state(null);
  let ticketOrderSuccess = $state<string | null>(null);
  let isFormValid = $state(true); // For validating the form

  // Calculate if the Insert button should be disabled
  $effect(() => {
    // Check if the form is valid for submission
    const isOrderIdRequired = ticketOrderService === "stripe" || ticketOrderService === "eventbrite";
    isFormValid = 
      !!ticketOrderPurchaserID && 
      (!isOrderIdRequired || !!ticketOrderID);
  });

  let event = $state<any>(null);
  let waiverEnabled = $state(false);

  // Computed sorted arrays for dropdowns
  let sortedTeams: TeamRowData[] = $state([]);
  let sortedOrgs: OrgRowData[] = $state([]);
  let sortedStudents: StudentRowData[] = $state([]);
  
  // Define a sorted students array for the dropdown
  $effect(() => {
    // Sort students by name whenever students array changes
    sortedStudents = [...students].sort((a, b) => {
      // Sort by full name (first + last)
      const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
      const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    // Sort teams by name
    sortedTeams = [...teams].sort((a, b) =>
      (a.team_name || "").localeCompare(b.team_name || "")
    );
    
    // Sort orgs by name
    sortedOrgs = [...orgs].sort((a, b) =>
      (a.name || `Organization #${a.org_id}`).localeCompare(
        b.name || `Organization #${b.org_id}`
      )
    );
  });

  // Column definitions for CustomTable
  const studentColumns = $derived([
    {
      key: "student_id",
      label: "Student ID",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "student_name",
    },
    {
      key: "front_id",
      label: "Student #",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "student_name",
    },
    {
      key: "student_name",
      label: "Student",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      frozen: true,
      format: (value: any, row: any) => {
        // Use the pre-computed badge configuration if available
        if (row._studentNameBadge) {
          const result = {
            text: row.student_name,
            isBadge: false,
            ...row._studentNameBadge, // Spread all pre-computed properties
          };
          return result;
        }

        // Fallback to the original implementation if pre-computed data isn't available
        // (this should rarely happen)
        const result = {
          text: row.student_name,
          isBadge: false,
          component: EntityBadge,
          props: {
            primaryText: row.student_name || "Unnamed Student",
            prefix: row.front_id,
            subtitle: row.email,
            tooltipText: `ID: ${row.student_id}`,
            tooltipPlacement: "top",
            align: "left",
            backgroundColor: "#e0ebff",
            hoverBackgroundColor: "#ccdcff",
            textColor: "var(--blue-700, #1D4ED8)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            href: row.email ? `mailto:${row.email}` : null,
            width: null,
            style: "display: block; text-align: left; white-space: nowrap;",
            fitContent: true,
          },
          cellStyle:
            "width: fit-content; max-width: max-content; white-space: nowrap;",
        };
        return result;
      },
    },
    {
      key: "waiver",
      label: "Waiver",
      visible: waiverEnabled,
      searchable: false,
      dataType: "string" as const,
      format: (value: any, row: any) => {
        if (!waiverEnabled) return { text: "-", isBadge: false };

        const waiver = row.waiver;
        const isSigned = waiver !== null && waiver !== "";

        // Helper to check if string is a URL
        const isValidUrl = (str: string) => {
          try {
            new URL(str);
            return true;
          } catch {
            return false;
          }
        };

        // For CSV export, use the actual waiver value
        const rawValue = waiver || "";

        return {
          text: rawValue, // Preserve actual waiver value for CSV export
          isBadge: true,
          component: EntityBadge,
          props: {
            primaryText: isSigned ? "Signed" : "Not Signed",
            icon: isSigned ? FileCheckSolid : FilePenSolid,
            backgroundColor: isSigned ? "#e6f5eb" : "#fee2e2", // Light green or light red
            hoverBackgroundColor: isSigned ? "#d1ebdc" : "#fecaca", // Slightly darker green or red
            textColor: isSigned
              ? "var(--green-700, #047857)"
              : "var(--red-700, #b91c1c)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            width: null,
            style: "display: block; text-align: left; white-space: nowrap;",
            fitContent: true,
            href: isValidUrl(waiver) ? waiver : null, // Add href if waiver is a valid URL
            target: isValidUrl(waiver) ? "_blank" : null, // Open in new tab if it's a URL
            rel: isValidUrl(waiver) ? "noopener noreferrer" : null, // Security best practice for external links
          },
          cellStyle:
            "width: fit-content; max-width: max-content; white-space: nowrap;",
        };
      },
    },
    {
      key: "email",
      label: "Email",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "student_name",
    },
    {
      key: "first_name",
      label: "First Name",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "student_name",
    },
    {
      key: "last_name",
      label: "Last Name",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "student_name",
    },
    {
      key: "team_id",
      label: "Team ID",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "team_name",
    },
    {
      key: "team_name",
      label: "Team",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      format: (value: any, row: any) => {
        // Return early if no team_name or team_id
        if (!row.team_name && !row.team_id)
          return { text: "-", isBadge: false };

        // Use pre-computed badge if available
        if (row._teamNameBadge) {
          return {
            text: row.team_name || "Unnamed Team",
            isBadge: false,
            ...row._teamNameBadge,
          };
        }

        // Fallback implementation
        return {
          text: row.team_name || "Unnamed Team",
          isBadge: false,
          component: EntityBadge,
          props: {
            primaryText: row.team_name || "Unnamed Team",
            prefix: row.front_id,
            subtitle: row.join_code,
            tooltipText: `Team ID: ${row.team_id}`,
            tooltipPlacement: "top",
            align: "left",
            backgroundColor: "#e6f5eb", // Light green background
            hoverBackgroundColor: "#d1ebdc", // Slightly darker green for hover
            textColor: "var(--green-700, #047857)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            width: null,
            style: "display: block; text-align: left; white-space: nowrap;",
            fitContent: true,
          },
          cellStyle:
            "width: fit-content; max-width: max-content; white-space: nowrap;",
        };
      },
    },
    {
      key: "org_id",
      label: "Org ID",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "org_name",
    },
    {
      key: "org_name",
      label: "Organization",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      format: (value: any, row: any) => {
        // Return early if no org_name or org_id
        if (!row.org_name && !row.org_id) return { text: "-", isBadge: false };

        // Use pre-computed badge if available
        if (row._orgNameBadge) {
          return {
            text: row.org_name || `Organization #${row.org_id}`,
            isBadge: false,
            ...row._orgNameBadge,
          };
        }

        // Fallback implementation
        return {
          text: row.org_name || `Organization #${row.org_id}`,
          isBadge: false,
          component: EntityBadge,
          props: {
            primaryText: row.org_name || `Organization #${row.org_id}`,
            prefix: null,
            subtitle: row.org_join_code,
            tooltipText: `Org ID: ${row.org_id}`,
            tooltipPlacement: "top",
            align: "left",
            backgroundColor: "#f0e6ff", // Light purple background
            hoverBackgroundColor: "#e2d6f5", // Slightly darker purple for hover
            textColor: "var(--purple-700, #6D28D9)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            width: null,
            style: "display: block; text-align: left; white-space: nowrap;",
            fitContent: true,
          },
          cellStyle:
            "width: fit-content; max-width: max-content; white-space: nowrap;",
        };
      },
    },
    {
      key: "registeredAt",
      label: "Registered",
      visible: true,
      dataType: "date" as const,
      format: (value: any, row: any) => {
        if (!value) return { text: "-", isBadge: false };
        // Use pre-computed formatted date if available
        return {
          text: row._formattedRegisteredAt || new Date(value).toLocaleString(),
          isBadge: false,
        };
      },
    },
  ]);

  const teamColumns = $derived([
    {
      key: "team_id",
      label: "Team ID",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "team_name",
    },
    {
      key: "team_name",
      label: "Team Name",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      frozen: true,
      format: (value: any, row: any) => {
        // Use the pre-computed badge configuration if available
        if (row._teamNameBadge) {
          const result = {
            text: row.team_name || "Unnamed Team",
            isBadge: false,
            ...row._teamNameBadge, // Spread all pre-computed properties
          };
          return result;
        }

        // Fallback to the original implementation if pre-computed data isn't available
        const result = {
          text: row.team_name || "Unnamed Team",
          isBadge: false,
          component: EntityBadge,
          props: {
            primaryText: row.team_name || "Unnamed Team",
            prefix: row.front_id,
            subtitle: row.join_code,
            tooltipText: `Team ID: ${row.team_id}`,
            tooltipPlacement: "top",
            align: "left",
            backgroundColor: "#e6f5eb", // Light green background
            hoverBackgroundColor: "#d1ebdc", // Slightly darker green for hover
            textColor: "var(--green-700, #047857)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            width: null,
            style: "display: block; text-align: left; white-space: nowrap;",
            fitContent: true,
          },
          cellStyle:
            "width: fit-content; max-width: max-content; white-space: nowrap;",
        };
        return result;
      },
    },
    {
      key: "join_code",
      label: "Join Code",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "team_name",
    },
    {
      key: "front_id",
      label: "Team #",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "team_name",
    },
    {
      key: "org_id",
      label: "Org ID",
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
      format: (value: any, row: any) => {
        // Return early if no org_name or org_id
        if (!row.org_name && !row.org_id) return { text: "-", isBadge: false };

        // Use pre-computed badge if available
        if (row._orgNameBadge) {
          return {
            text: row.org_name || `Organization #${row.org_id}`,
            isBadge: false,
            ...row._orgNameBadge,
          };
        }

        // Fallback implementation
        return {
          text: row.org_name || `Organization #${row.org_id}`,
          isBadge: false,
          component: EntityBadge,
          props: {
            primaryText: row.org_name || `Organization #${row.org_id}`,
            prefix: null,
            subtitle: row.org_join_code,
            tooltipText: `Org ID: ${row.org_id}`,
            tooltipPlacement: "top",
            align: "left",
            backgroundColor: "#f0e6ff", // Light purple background
            hoverBackgroundColor: "#e2d6f5", // Slightly darker purple for hover
            textColor: "var(--purple-700, #6D28D9)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            width: null,
            style: "display: block; text-align: left; white-space: nowrap;",
            fitContent: true,
          },
          cellStyle:
            "width: fit-content; max-width: max-content; white-space: nowrap;",
        };
      },
    },
    {
      key: "createdAt",
      label: "Created",
      visible: true,
      dataType: "date" as const,
      format: (value: any, row: any) => {
        if (!value) return { text: "-", isBadge: false };
        // Use pre-computed formatted date if available
        return {
          text: row._formattedCreatedAt || new Date(value).toLocaleString(),
          isBadge: false,
        };
      },
    },
  ]);

  const orgColumns = $derived([
    {
      key: "org_id",
      label: "Org ID",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "name",
    },
    {
      key: "name",
      label: "Organization Name",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      frozen: true,
      format: (value: any, row: any) => {
        // Use the pre-computed badge configuration if available
        if (row._orgNameBadge) {
          const result = {
            text: row.name || `Organization #${row.org_id}`,
            isBadge: false,
            ...row._orgNameBadge, // Spread all pre-computed properties
          };
          return result;
        }

        // Fallback to the original implementation if pre-computed data isn't available
        const result = {
          text: row.name || `Organization #${row.org_id}`,
          isBadge: false,
          component: EntityBadge,
          props: {
            primaryText: row.name || `Organization #${row.org_id}`,
            prefix: null,
            subtitle: row.join_code,
            tooltipText: `Org ID: ${row.org_id}`,
            tooltipPlacement: "top",
            align: "left",
            backgroundColor: "#f0e6ff", // Light purple background
            hoverBackgroundColor: "#e2d6f5", // Slightly darker purple for hover
            textColor: "var(--purple-700, #6D28D9)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            width: null,
            style: "display: block; text-align: left; white-space: nowrap;",
            fitContent: true,
          },
          cellStyle:
            "width: fit-content; max-width: max-content; white-space: nowrap;",
        };
        return result;
      },
    },
    {
      key: "coaches",
      label: "Coach",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      format: (value: any, row: any) => {
        // Use pre-computed badge if available
        if (row._coachesBadge) {
          const result = {
            text: row.primaryCoach?.fullName || "No coach",
            isBadge: false,
            ...row._coachesBadge,
          };
          return result;
        }

        // Use the primaryCoach object if available
        const primaryCoach = row.primaryCoach;

        if (!primaryCoach) {
          return { text: "No coach", isBadge: false };
        }

        const hasMultipleCoaches = row.coaches && row.coaches.includes(",");

        const result = {
          text: primaryCoach.fullName,
          isBadge: false,
          component: EntityBadge,
          props: {
            primaryText: primaryCoach.fullName || "Unnamed Coach",
            prefix: null,
            subtitle: primaryCoach.email,
            tooltipText: hasMultipleCoaches
              ? "Multiple coaches available"
              : `Coach ID: ${primaryCoach.coach_id}`,
            tooltipPlacement: "top",
            align: "left",
            backgroundColor: "#f0e6ff", // Light purple background
            hoverBackgroundColor: "#e2d6f5", // Slightly darker purple for hover
            textColor: "var(--purple-700, #6D28D9)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            href: primaryCoach.email ? `mailto:${primaryCoach.email}` : null,
            width: null,
            style: "display: block; text-align: left; white-space: nowrap;",
            fitContent: true,
          },
          cellStyle:
            "width: fit-content; max-width: max-content; white-space: nowrap;",
        };
        return result;
      },
    },
    {
      key: "coach_email",
      label: "Coach Email",
      visible: false,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "coaches",
    },
    {
      key: "teamCount",
      label: "Teams",
      visible: true,
      searchable: false,
      dataType: "number" as const,
    },
    {
      key: "studentCount",
      label: "Students",
      visible: true,
      searchable: false,
      dataType: "number" as const,
    },
    {
      key: "ticketCount",
      label: "Tickets",
      visible: true,
      searchable: false,
      dataType: "number" as const,
    },
    {
      key: "join_code",
      label: "Join Code",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      linkedToColumn: "name",
    },
    {
      key: "registeredAt",
      label: "Registered",
      visible: true,
      dataType: "date" as const,
      format: (value: any, row: any) => {
        if (!value) return { text: "-", isBadge: false };
        // Use pre-computed formatted date if available
        return {
          text: row._formattedRegisteredAt || new Date(value).toLocaleString(),
          isBadge: false,
        };
      },
    },
  ]);

  // Memoized merged columns
  let mergedStudentColumns = $derived(getMergedStudentColumns());
  let mergedTeamColumns = $derived(getMergedTeamColumns());
  let mergedOrgColumns = $derived(getMergedOrgColumns());
  let ticketOrderColumns = [
    {
      key: "student_id",
      label: "Student",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      format: (c: any, _: any) => {
        if (!c) return { text: "-", isBadge: false };
        const s = studentMap.get(c)!;
        return {
          text: `${s.first_name} ${s.last_name}`,
          isBadge: false,
          component: EntityBadge,
          props: {
            primaryText: `${s.first_name} ${s.last_name}`,
            subtitle: s.email,
          },
        } as { text: string; isBadge: boolean };
      },
    },
    {
      key: "org_id",
      label: "Org",
      visible: true,
      searchable: true,
      dataType: "string" as const,
      format: (c: any, _: any) => {
        if (!c) return { text: "-", isBadge: false };
        const o = orgMap.get(c)!;
        return {
          text: o.name!,
          isBadge: false,
          component: EntityBadge,
          props: {
            primaryText: o.name,
            subtitle: o.join_code,
          },
        } as { text: string; isBadge: boolean };
      },
    },
    {
      key: "created_at",
      label: "Purchased",
      visible: true,
      dataType: "date" as const,
      format: (value: any, _: any) => ({
        text: value ? new Date(value).toLocaleString() : "-",
        isBadge: false,
      }),
    },
    {
      key: "quantity",
      label: "Quantity",
      visible: true,
      searchable: true,
      dataType: "number" as const,
    },
    {
      key: "ticket_service",
      label: "Ticket Service",
      visible: true,
      searchable: true,
      dataType: "string" as const,
    },
    {
      key: "order_id",
      label: "Order ID",
      visible: true,
      searchable: true,
      dataType: "string" as const,
    },
    {
      key: "id",
      label: "ID",
      visible: false,
      searchable: true,
      dataType: "string" as const,
    },
  ];

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
  // Open transfer modal
  function openTransferModal() {
    // Reset previous state
    transferType = "team";
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
  // Function to update ticket order modal state
  function openTicketModal() {
    // Reset form values
    ticketOrderType = "student";
    ticketOrderPurchaserID = null;
    ticketOrderQuantity = 1;
    ticketOrderID = "";
    ticketOrderInsertInProgress = false;
    ticketOrderError = null;
    ticketOrderSuccess = null;
    showTicketOrderModal = true;
  }

  // Update quantity when ticket order type changes
  $effect(() => {
    // If order type is student, force quantity to 1
    if (ticketOrderType === "student") {
      ticketOrderQuantity = 1;
    }
  });

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
      // Create an array of promises for all transfers
      const transferPromises = studentsToProcess.map(async (student) => {
        try {
          let result;
          if (transferType === "team") {
            // Handle team transfer (including special case -1 for no team)
            if (selectedTeamId === -1) {
              // Keep org but remove team
              result = await transferStudentToTeam(
                student.student_event_id,
                -1,
              );

              // Update local data
              const studentToUpdate = studentMap.get(student.student_id);
              if (studentToUpdate) {
                studentToUpdate.team_id = null;
                studentToUpdate.team_name = null;
                // Keep org_id and org_name unchanged
              }
            } else if (selectedTeamId !== null) {
              // Regular team transfer
              const destTeam = teamMap.get(selectedTeamId);
              const destOrgId = destTeam?.org_id || null;

              // We know selectedTeamId is not null at this point since we checked above
              const teamIdForTransfer = selectedTeamId as number;
              result = await transferStudentToTeam(
                student.student_event_id,
                teamIdForTransfer,
              );

              // Update local data
              const studentToUpdate = studentMap.get(student.student_id);
              if (studentToUpdate) {
                studentToUpdate.team_id = selectedTeamId;
                studentToUpdate.team_name = destTeam?.team_name || null;
                studentToUpdate.org_id = destOrgId;
                studentToUpdate.org_name = orgMap.get(destOrgId)?.name || null;
              }
            }
          } else if (transferType === "org" && selectedOrgId !== null) {
            // Handle org transfer (including special case -1 for no org)
            const orgIdForTransfer = selectedOrgId === -1 ? -1 : selectedOrgId;
            result = await transferStudentToOrg(
              student.student_event_id,
              orgIdForTransfer,
            );

            // Update local data
            const studentToUpdate = studentMap.get(student.student_id);
            if (studentToUpdate) {
              studentToUpdate.team_id = null;
              studentToUpdate.team_name = null;
              studentToUpdate.org_id =
                selectedOrgId === -1 ? null : selectedOrgId;
              studentToUpdate.org_name =
                selectedOrgId === -1
                  ? null
                  : orgMap.get(selectedOrgId)?.name || null;
            }
          } else {
            throw new Error("Invalid transfer type or missing destination");
          }

          return { student, result, success: true };
        } catch (error) {
          // Extract error message with our standard pattern
          const errorMessage =
            error && typeof error === "object" && "message" in error
              ? (error as { message: string }).message
              : error
                ? String(error)
                : "An unknown error occurred";

          return { student, error: errorMessage, success: false };
        }
      });

      // Execute all transfers in parallel
      const results = await Promise.allSettled(transferPromises);

      // Process results
      const successfulTransfers: StudentTransferResult[] = [];
      const failedTransfers: StudentTransferResult[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          if (result.value.success) {
            successfulTransfers.push(result.value);
          } else {
            failedTransfers.push(result.value);
          }
        } else {
          // Handle rejected promises (should be rare since we handle errors in the individual promises)
          failedTransfers.push({
            student: studentsToProcess[index],
            error: result.reason?.message || "Unknown error during transfer",
            success: false,
          });
        }
      });

      // Update failed students array for retry functionality
      // Add the error message to each failed student record
      failedStudents = failedTransfers.map((result) => ({
        ...result.student,
        errorMessage: result.error,
      }));

      // Set success/error states
      transferSuccess = successfulTransfers.length > 0;
      if (failedTransfers.length > 0) {
        transferError = `Failed to transfer ${failedTransfers.length} student(s)`;
      }

      // Recalculate metrics only if we need to
      if (successfulTransfers.length > 0) {
        // Recalculate team student counts
        if (
          transferType === "team" &&
          selectedTeamId &&
          teamMap.has(selectedTeamId)
        ) {
          const destTeam = teamMap.get(selectedTeamId);
          if (destTeam) {
            // Update the student count for the destination team
            destTeam.studentCount = getStudentsForTeam(selectedTeamId).length;
          }
        }

        // Recalculate org student and team counts if needed
        if (selectedOrgId && orgMap.has(selectedOrgId)) {
          const destOrg = orgMap.get(selectedOrgId);
          if (destOrg) {
            // Update org counts
            destOrg.studentCount = getStudentsForOrg(selectedOrgId).length;
            destOrg.teamCount = getTeamsForOrg(selectedOrgId).length;
          }
        }
      }

      // Still do a reload for consistency, but can reduce scope based on transfer type
      setTimeout(async () => {
        if (transferType === "team") {
          // If we transferred to a team, we only need to reload students
          await reloadData(["students"]);
        } else {
          // If we transferred to an org, we need to reload students and update org counts
          await reloadData(["students", "organizations"]);
        }

        transferInProgress = false;

        // If all transfers were successful, close the modal
        if (failedStudents.length === 0) {
          showTransferModal = false;
        }
      }, 1000);
    } catch (error) {
      // Apply the same improved error message extraction logic here
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : error
            ? String(error)
            : "An unknown error occurred";
      transferError = errorMessage;
    } finally {
      // Don't set transferInProgress to false here as it will be set in the setTimeout
    }
  }

  // Load team data and update related information
  async function loadTeamData() {
    try {
      const teamsData = await getEventTeams(event_id);

      // Process teams data into array
      teams = teamsData.map((team: any) => ({
        team_id: team.team_id,
        event_id: team.event_id,
        team_name: team.team_name,
        join_code: team.join_code,
        org_id: team.org_id,
        front_id: team.front_id,
        org_name: null, // Will be populated below
        org_join_code: null, // Will be populated below
        studentCount: 0, // Will be updated below
        createdAt: team.created_at
          ? new Date(team.created_at).toLocaleString()
          : new Date().toLocaleString(),
      }));

      // Build team lookup map
      teamMap = new Map();
      teams.forEach((team) => {
        teamMap.set(team.team_id, team);
      });

      // Count students per team using our utility function
      teams.forEach((team) => {
        team.studentCount = getStudentsForTeam(team.team_id).length;
      });

      // Update org names from org map
      teams.forEach((team) => {
        if (team.org_id && orgMap.has(team.org_id)) {
          const org = orgMap.get(team.org_id);
          team.org_name = org?.name || null;
          team.org_join_code = org?.join_code || null;
        }
      });

      // Update team_name in students after teams are loaded
      students.forEach((student) => {
        if (student.team_id && teamMap.has(student.team_id)) {
          student.team_name = teamMap.get(student.team_id)?.team_name || null;
        }
      });
    } catch (error) {
      console.error("Error loading team data:", error);
    }
  }

  // Execute team transfer to organization
  async function executeTeamTransfer() {
    if (!selectedTeams.length || selectedOrgId === null) return;

    teamTransferInProgress = true;
    transferError = null;
    transferSuccess = false;

    // Reset failed teams if this is a new transfer (not a retry)
    if (!isRetry) {
      failedTeams = [];
    }

    try {
      // Determine which teams to process
      const teamsToProcess = isRetry
        ? selectedTeams.filter((team) =>
            failedTeams.some((ft) => ft.team_id === team.team_id),
          )
        : selectedTeams;

      // Get destination org info for local updates (can be null for removal)
      const destOrg = selectedOrgId === -1 ? null : orgMap.get(selectedOrgId);

      // Create an array of promises for all team transfers
      const transferPromises = teamsToProcess.map(async (team) => {
        try {
          // Convert -1 to appropriate value for transfer
          const orgIdForTransfer = selectedOrgId as number;
          const result = await transferTeamToOrg(
            team.team_id,
            orgIdForTransfer,
          );

          // Update local data on successful transfer
          if (result) {
            // Update team in the map and array
            const teamToUpdate = teamMap.get(team.team_id);
            if (teamToUpdate) {
              teamToUpdate.org_id = selectedOrgId === -1 ? null : selectedOrgId;
              teamToUpdate.org_name = destOrg?.name || null;

              // Update students belonging to this team
              students.forEach((student) => {
                if (student.team_id === team.team_id) {
                  student.org_id = selectedOrgId === -1 ? null : selectedOrgId;
                  student.org_name = destOrg?.name || null;

                  // Also update the student in the map
                  const studentInMap = studentMap.get(student.student_id);
                  if (studentInMap) {
                    studentInMap.org_id =
                      selectedOrgId === -1 ? null : selectedOrgId;
                    studentInMap.org_name = destOrg?.name || null;
                  }
                }
              });
            }
          }

          return { team, result, success: true };
        } catch (error) {
          // Extract error message with our standard pattern
          const errorMessage =
            error && typeof error === "object" && "message" in error
              ? (error as { message: string }).message
              : error
                ? String(error)
                : "An unknown error occurred";

          return { team, error: errorMessage, success: false };
        }
      });

      // Execute all transfers in parallel
      const results = await Promise.allSettled(transferPromises);

      // Process results
      const successfulTransfers: TeamTransferResult[] = [];
      const failedTransfers: TeamTransferResult[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          if (result.value.success) {
            successfulTransfers.push(result.value);
          } else {
            failedTransfers.push(result.value);
          }
        } else {
          // Handle rejected promises (should be rare since we handle errors in the individual promises)
          failedTransfers.push({
            team: teamsToProcess[index],
            error: result.reason?.message || "Unknown error during transfer",
            success: false,
          });
        }
      });

      // Update failed teams array for retry functionality
      // Add the error message to each failed team record
      failedTeams = failedTransfers.map((result) => ({
        ...result.team,
        errorMessage: result.error,
      }));

      // Set success/error states
      transferSuccess = successfulTransfers.length > 0;
      if (failedTransfers.length > 0) {
        transferError = `Failed to transfer ${failedTransfers.length} team(s)`;
      }

      // Update org counts if any transfers were successful
      if (successfulTransfers.length > 0 && orgMap.has(selectedOrgId)) {
        const destOrg = orgMap.get(selectedOrgId);
        if (destOrg) {
          // Update org counts
          destOrg.teamCount = getTeamsForOrg(selectedOrgId).length;
          destOrg.studentCount = getStudentsForOrg(selectedOrgId).length;
        }
      }

      // Reload data after 1 second to show success message
      setTimeout(async () => {
        // When transferring teams, we need to update both teams and students data
        // and update organization counts
        await reloadData(["teams", "students", "organizations"]);

        teamTransferInProgress = false;

        // If all transfers were successful, close the modal
        if (failedTeams.length === 0) {
          showTeamTransferModal = false;
        }
      }, 1000);
    } catch (error) {
      // Apply the same improved error message extraction logic here
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : error
            ? String(error)
            : "An unknown error occurred";
      transferError = errorMessage;
    } finally {
      // Don't set teamTransferInProgress to false here as it will be set in the setTimeout
    }
  }

  async function attemptTicketOrderInsert() {
    ticketOrderInsertInProgress = true;
    ticketOrderSuccess = null;
    try {
      // Check if order ID is provided for Stripe and Eventbrite
      if ((ticketOrderService === "stripe" || ticketOrderService === "eventbrite") && !ticketOrderID) {
        throw new Error(`Order ID is required for ${ticketOrderService} tickets`);
      }

      // Generate or format order ID based on service type
      let orderID = "";
      
      if (ticketOrderService === "admin") {
        // For admin orders: always add the admin- prefix
        if (!ticketOrderID) {
          orderID = generateUUID();
        } else {
          orderID = `admin-${ticketOrderID}`;
        }
      } else if (ticketOrderService === "stripe") {
        // For Stripe: always add cs_live_ prefix
        orderID = `cs_live_${ticketOrderID}`;
      } else {
        // For eventbrite: use as is
        orderID = ticketOrderID;
      }

      const { data, error } = await supabase.from("ticket_orders").insert({
        event_id,
        order_id: orderID,
        [ticketOrderType == "student" ? "student_id" : "org_id"]: ticketOrderPurchaserID,
        quantity: ticketOrderQuantity,
        ticket_service: ticketOrderService,
      });
      
      if (error) throw error;

      ticketOrderError = null;
      ticketOrderSuccess = "Insert Successful";
      
      // Reload ticket orders data
      setTimeout(async () => {
        await reloadData(["ticket_orders"]);
      }, 1000);
    
    } catch (error) {
      handleError(error as any);
      if (error instanceof Error) {
        ticketOrderError = error;
      } else {
        ticketOrderError = new Error(String(error));
      }
    }
    ticketOrderInsertInProgress = false;
  }

  // Fetch data on mount
  onMount(async () => {
    try {
      loading = true;

      // Fetch event details first to check waiver settings
      event = await getEventInformation(event_id);
      waiverEnabled = event?.waivers && event.waivers.type !== "none";

      // Fetch custom fields and ticket count in parallel
      const [
        studentCustomFieldsData,
        teamCustomFieldsData,
        orgCustomFieldsData,
        ticketCount,
      ] = await Promise.all([
        getEventCustomFields(event_id, "students"),
        getEventCustomFields(event_id, "teams"),
        getEventCustomFields(event_id, "orgs"),
        getEventTicketCount(event_id),
      ]);

      // Store ticket count
      totalPurchasedTickets = ticketCount;

      // Store custom fields
      studentCustomFields = studentCustomFieldsData;
      teamCustomFields = teamCustomFieldsData;
      orgCustomFields = orgCustomFieldsData;

      // Now load all data using our reloadData function
      await reloadData(["students", "teams", "organizations", "ticket_orders"]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      loading = false;
    }
  });

  // Fetch organizations data
  async function fetchOrganizations() {
    try {
      // Get all organizations associated with the event from org_events table
      const orgEventsData = await getEventOrganizations(event_id);

      if (orgEventsData.length === 0) {
        orgs = [];
        orgMap = new Map();
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

          // Extract the first coach for badge display
          let primaryCoach = null;
          let coachesText = "";

          if (
            orgData.coaches &&
            Array.isArray(orgData.coaches) &&
            orgData.coaches.length > 0
          ) {
            // Get the first coach for badge display
            const firstCoach = orgData.coaches[0];
            if (firstCoach.person) {
              primaryCoach = {
                firstName: firstCoach.person.first_name || "",
                lastName: firstCoach.person.last_name || "",
                email: firstCoach.person.email || "",
                fullName:
                  `${firstCoach.person.first_name || ""} ${firstCoach.person.last_name || ""}`.trim(),
                coach_id: firstCoach.person.coach_id,
              };
            }

            // Format all coaches for text display and tooltip
            coachesText = orgData.coaches
              .map((c: any) => {
                if (c.person) {
                  return `${c.person.first_name || ""} ${c.person.last_name || ""} (${c.person.email || ""})`.trim();
                }
                return "";
              })
              .filter(Boolean)
              .join(", ");
          }

          // Create organization entry with all required properties
          const orgEntry: OrgRowData = {
            org_id: orgId,
            name: orgData.name,
            address: orgData.address,
            join_code: orgEvent.join_code || null,
            coaches: coachesText,
            coach_email: primaryCoach?.email || null,
            primaryCoach: primaryCoach, // Add the primary coach object for badge display
            studentCount: getStudentsForOrg(orgId).length,
            teamCount: getTeamsForOrg(orgId).length,
            ticketCount: orgTicketCount,
            registeredAt: orgEvent.created_at
              ? new Date(orgEvent.created_at).toLocaleString()
              : new Date().toLocaleString(),
            // Store original event data for custom field processing
            event: {
              join_code: orgEvent.join_code,
              created_at: orgEvent.created_at,
              org_event_id: orgEvent.org_event_id,
            },
          };

          return orgEntry;
        } catch (error) {
          console.error(`Error processing org ${orgEvent.org_id}:`, error);
          return null;
        }
      });

      // Collect all org data and filter out nulls
      const orgResults = await Promise.all(orgPromises);
      orgs = orgResults.filter((org): org is OrgRowData => org !== null);

      // Build org lookup map
      orgMap = new Map();
      orgs.forEach((org) => {
        orgMap.set(org.org_id, org);
      });

      // Update related entities after org data is loaded
      // Update org name in students
      students.forEach((student) => {
        if (student.org_id && orgMap.has(student.org_id)) {
          const org = orgMap.get(student.org_id);
          student.org_name = org?.name || null;
          student.org_join_code = org?.join_code || null;
        }
      });

      // Update org name in teams
      teams.forEach((team) => {
        if (team.org_id && orgMap.has(team.org_id)) {
          const org = orgMap.get(team.org_id);
          team.org_name = org?.name || null;
          team.org_join_code = org?.join_code || null;
        }
      });
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

  // Utility functions for efficient data lookup

  // Get all students for a team
  function getStudentsForTeam(teamId: number): StudentRowData[] {
    // Filter is still O(n) but we avoid nested loops this way
    return students.filter((s) => s.team_id === teamId);
  }

  // Get all teams for an org
  function getTeamsForOrg(orgId: number): TeamRowData[] {
    return teams.filter((t) => t.org_id === orgId);
  }

  // Get all students for an org
  function getStudentsForOrg(orgId: number): StudentRowData[] {
    return students.filter((s) => s.org_id === orgId);
  }

  // Format student rows for display to avoid repeated formatting during render
  function formatStudentRowsForDisplay(
    rawStudents: StudentRowData[],
  ): StudentRowData[] {
    const formattedRows = rawStudents.map((student) => {
      // Create a processed copy that already has all the formatted display values
      const processedStudent = { ...student };

      // Pre-format any date fields
      if (processedStudent.registeredAt) {
        try {
          const dateObj = new Date(processedStudent.registeredAt);
          processedStudent._formattedRegisteredAt = dateObj.toLocaleString();
        } catch (e) {
          processedStudent._formattedRegisteredAt =
            processedStudent.registeredAt;
        }
      }

      // Pre-compute the EntityBadge configuration for student_name
      // This avoids recreating the config object on every render
      processedStudent._studentNameBadge = {
        component: EntityBadge,
        props: {
          primaryText: processedStudent.student_name || "Unnamed Student",
          prefix: processedStudent.front_id,
          subtitle: processedStudent.email,
          tooltipText: `ID: ${processedStudent.student_id}`,
          tooltipPlacement: "top",
          align: "left",
          backgroundColor: "#e0ebff", // Solid light blue background (no transparency)
          hoverBackgroundColor: "#ccdcff", // Solid slightly darker blue for hover
          textColor: "var(--blue-700, #1D4ED8)",
          borderRadius: "0.375rem",
          padding: "0.5rem 0.75rem",
          href: processedStudent.email
            ? `mailto:${processedStudent.email}`
            : null,
          width: null,
          style: "display: block; text-align: left; white-space: nowrap;",
          fitContent: true,
        },
        cellStyle:
          "width: fit-content; max-width: max-content; white-space: nowrap;",
      };

      // Pre-compute team badge if student belongs to a team
      if (processedStudent.team_id && teamMap.has(processedStudent.team_id)) {
        const team = teamMap.get(processedStudent.team_id);
        if (team) {
          processedStudent._teamNameBadge = {
            component: EntityBadge,
            props: {
              primaryText: team.team_name || "Unnamed Team",
              prefix: team.front_id,
              subtitle: team.join_code,
              tooltipText: `Team ID: ${team.team_id}`,
              tooltipPlacement: "top",
              align: "left",
              backgroundColor: "#e6f5eb", // Light green background
              hoverBackgroundColor: "#d1ebdc", // Slightly darker green for hover
              textColor: "var(--green-700, #047857)",
              borderRadius: "0.375rem",
              padding: "0.5rem 0.75rem",
              width: null,
              style: "display: block; text-align: left; white-space: nowrap;",
              fitContent: true,
            },
            cellStyle:
              "width: fit-content; max-width: max-content; white-space: nowrap;",
          };
        }
      }

      // Pre-compute org badge if student belongs to an organization (directly or via team)
      if (processedStudent.org_id && orgMap.has(processedStudent.org_id)) {
        const org = orgMap.get(processedStudent.org_id);
        if (org) {
          processedStudent._orgNameBadge = {
            component: EntityBadge,
            props: {
              primaryText: org.name || `Organization #${org.org_id}`,
              prefix: null,
              subtitle: org.join_code || processedStudent.org_join_code || null,
              tooltipText: `Org ID: ${org.org_id}`,
              tooltipPlacement: "top",
              align: "left",
              backgroundColor: "#f0e6ff", // Light purple background
              hoverBackgroundColor: "#e2d6f5", // Slightly darker purple for hover
              textColor: "var(--purple-700, #6D28D9)",
              borderRadius: "0.375rem",
              padding: "0.5rem 0.75rem",
              width: null,
              style: "display: block; text-align: left; white-space: nowrap;",
              fitContent: true,
            },
            cellStyle:
              "width: fit-content; max-width: max-content; white-space: nowrap;",
          };
        }
      }

      // Add addon quantities if available
      if (addonData) {
        const studentQuantities = addonData.studentQuantities.get(student.student_event_id);
        if (studentQuantities) {
          addonData.addons.forEach(addon => {
            if (addon.addon_table === 'students') {
              processedStudent[`addon.${addon.key}`] = studentQuantities.get(addon.addon_id) || 0;
            }
          });
        }
      }

      return processedStudent;
    });
    return formattedRows;
  }

  // Format team rows for display
  function formatTeamRowsForDisplay(rawTeams: TeamRowData[]): TeamRowData[] {
    const formattedRows = rawTeams.map((team) => {
      // Create a processed copy that already has all the formatted display values
      const processedTeam = { ...team };

      // Pre-format any date fields
      if (processedTeam.createdAt) {
        try {
          const dateObj = new Date(processedTeam.createdAt);
          processedTeam._formattedCreatedAt = dateObj.toLocaleString();
        } catch (e) {
          processedTeam._formattedCreatedAt = processedTeam.createdAt;
        }
      }

      // Pre-compute the EntityBadge configuration for team_name
      processedTeam._teamNameBadge = {
        component: EntityBadge,
        props: {
          primaryText: processedTeam.team_name || "Unnamed Team",
          prefix: processedTeam.front_id,
          subtitle: processedTeam.join_code,
          tooltipText: `Team ID: ${processedTeam.team_id}`,
          tooltipPlacement: "top",
          align: "left",
          backgroundColor: "#e6f5eb", // Light green background
          hoverBackgroundColor: "#d1ebdc", // Slightly darker green for hover
          textColor: "var(--green-700, #047857)",
          borderRadius: "0.375rem",
          padding: "0.5rem 0.75rem",
          width: null,
          style: "display: block; text-align: left; white-space: nowrap;",
          fitContent: true,
        },
        cellStyle:
          "width: fit-content; max-width: max-content; white-space: nowrap;",
      };

      // Pre-compute org badge if this team belongs to an organization
      if (processedTeam.org_id && orgMap.has(processedTeam.org_id)) {
        const org = orgMap.get(processedTeam.org_id);
        processedTeam._orgNameBadge = {
          component: EntityBadge,
          props: {
            primaryText:
              processedTeam.org_name || `Organization #${processedTeam.org_id}`,
            prefix: null,
            subtitle: org?.join_code || processedTeam.org_join_code || null,
            tooltipText: `Org ID: ${processedTeam.org_id}`,
            tooltipPlacement: "top",
            align: "left",
            backgroundColor: "#f0e6ff", // Light purple background
            hoverBackgroundColor: "#e2d6f5", // Slightly darker purple for hover
            textColor: "var(--purple-700, #6D28D9)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            width: null,
            style: "display: block; text-align: left; white-space: nowrap;",
            fitContent: true,
          },
          cellStyle:
            "width: fit-content; max-width: max-content; white-space: nowrap;",
        };
      }

      // Add addon quantities if available
      if (addonData) {
        const teamQuantities = addonData.teamQuantities.get(team.team_id);
        if (teamQuantities) {
          addonData.addons.forEach(addon => {
            if (addon.addon_table === 'teams') {
              processedTeam[`addon.${addon.key}`] = teamQuantities.get(addon.addon_id) || 0;
            }
          });
        }
      }

      return processedTeam;
    });
    return formattedRows;
  }

  // Format org rows for display
  function formatOrgRowsForDisplay(rawOrgs: OrgRowData[]): OrgRowData[] {
    const formattedRows = rawOrgs.map((org) => {
      // Create a processed copy that already has all the formatted display values
      const processedOrg = { ...org };

      // Pre-format any date fields
      if (processedOrg.registeredAt) {
        try {
          const dateObj = new Date(processedOrg.registeredAt);
          processedOrg._formattedRegisteredAt = dateObj.toLocaleString();
        } catch (e) {
          processedOrg._formattedRegisteredAt = processedOrg.registeredAt;
        }
      }

      // Pre-compute the organization name badge
      processedOrg._orgNameBadge = {
        component: EntityBadge,
        props: {
          primaryText:
            processedOrg.name || `Organization #${processedOrg.org_id}`,
          prefix: null,
          subtitle: processedOrg.join_code || null,
          tooltipText: `Org ID: ${processedOrg.org_id}`,
          tooltipPlacement: "top",
          align: "left",
          backgroundColor: "#f0e6ff", // Light purple background
          hoverBackgroundColor: "#e2d6f5", // Slightly darker purple for hover
          textColor: "var(--purple-700, #6D28D9)",
          borderRadius: "0.375rem",
          padding: "0.5rem 0.75rem",
          width: null,
          style: "display: block; text-align: left; white-space: nowrap;",
          fitContent: true,
        },
        cellStyle:
          "width: fit-content; max-width: max-content; white-space: nowrap;",
      };

      // Pre-compute the coaches badge if a primary coach exists
      if (processedOrg.primaryCoach) {
        const primaryCoach = processedOrg.primaryCoach;
        const hasMultipleCoaches =
          processedOrg.coaches && processedOrg.coaches.includes(",");

        processedOrg._coachesBadge = {
          component: EntityBadge,
          props: {
            primaryText: primaryCoach.fullName || "Unnamed Coach",
            prefix: null,
            subtitle: primaryCoach.email,
            tooltipText: hasMultipleCoaches
              ? "Multiple coaches available"
              : `Coach ID: ${primaryCoach.coach_id}`,
            tooltipPlacement: "top",
            align: "left",
            backgroundColor: "#f0e6ff", // Light purple background
            hoverBackgroundColor: "#e2d6f5", // Slightly darker purple for hover
            textColor: "var(--purple-700, #6D28D9)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            href: primaryCoach.email ? `mailto:${primaryCoach.email}` : null,
            width: null,
            style: "display: block; text-align: left; white-space: nowrap;",
            fitContent: true,
          },
          cellStyle:
            "width: fit-content; max-width: max-content; white-space: nowrap;",
        };
      }

      // Add addon quantities if available
      if (addonData && org.event?.org_event_id) {
        const orgQuantities = addonData.orgQuantities.get(org.event.org_event_id);
        if (orgQuantities) {
          addonData.addons.forEach(addon => {
            if (addon.addon_table === 'orgs') {
              processedOrg[`addon.${addon.key}`] = orgQuantities.get(addon.addon_id) || 0;
            }
          });
        }
      }

      return processedOrg;
    });
    return formattedRows;
  }

  /**
   * Reloads data after transfers are completed
   * @param dataTypes Array of data types to reload ('students', 'teams', 'organizations')
   */
  async function reloadData(
    dataTypes: ("students" | "teams" | "organizations" | "ticket_orders")[] = [
      "students",
      "teams",
      "organizations",
      "ticket_orders",
    ],
  ) {
    try {
      // Load addon data if any of the main data types are being reloaded
      if (dataTypes.some(type => ["students", "teams", "organizations"].includes(type))) {
        addonData = await getEventAddonQuantities(event_id);
        console.log('Addon data loaded:', {
          addons: addonData.addons.length,
          studentQuantities: addonData.studentQuantities.size,
          teamQuantities: addonData.teamQuantities.size,
          orgQuantities: addonData.orgQuantities.size
        });
      }

      if (dataTypes.includes("students")) {
        // Reload students data
        const studentsData = await getEventStudents(event_id);

        // Process students data into array
        students = studentsData.map((s: any) => {
          const person = s.person || {};
          // Create a fullName property combining first and last names
          const fullName =
            [person.first_name, person.last_name].filter(Boolean).join(" ") ||
            "Unnamed";

          return {
            ...s,
            ...person,
            student_name: fullName,
            registeredAt: s.created_at || s.registered_at || "-",
            // Ensure these fields are available for our badge display
            email: person.email || "",
            front_id: s.front_id || "",
            student_id: s.student_id,
          };
        });

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

        // Rebuild the student lookup map
        studentMap = new Map();
        students.forEach((student) => {
          studentMap.set(student.student_id, student);
        });
        console.log(studentMap);
      }

      if (dataTypes.includes("teams")) {
        await loadTeamData();
      }

      if (dataTypes.includes("organizations")) {
        await fetchOrganizations();
      }

      if (dataTypes.includes("ticket_orders")) {
        const { data, error } = await supabase
          .from("ticket_orders")
          .select("*")
          .filter("event_id", "eq", event_id);
        if (error) {
          handleError(error);
          return;
        }
        ticketOrders = data;
      }

      // Update relationships AFTER all data is loaded
      // This ensures all references exist when establishing relationships

      // Update team names and organization names for students
      if (dataTypes.includes("students")) {
        students.forEach((student) => {
          // Update team name using the map for quick lookup
          if (student.team_id && teamMap.has(student.team_id)) {
            const team = teamMap.get(student.team_id);
            student.team_name = team?.team_name || null;
          }

          // Update org name using the map for quick lookup
          if (student.org_id && orgMap.has(student.org_id)) {
            const org = orgMap.get(student.org_id);
            student.org_name = org?.name || null;
          }
        });
      }

      // Update org names for teams if we reloaded teams but not organizations
      if (dataTypes.includes("teams") && !dataTypes.includes("organizations")) {
        teams.forEach((team) => {
          if (team.org_id && orgMap.has(team.org_id)) {
            const org = orgMap.get(team.org_id);
            team.org_name = org?.name || null;
          }
        });
      }

      // Update custom field values if any data has been reloaded
      if (dataTypes.length > 0) {
        await fetchCustomFieldValues();
      }
      
      // Map addon quantities to the respective data objects
      if (addonData) {
        // Add addon data to students
        students.forEach(student => {
          if (student.student_event_id) {
            // Convert to number if needed
            const studentEventId = Number(student.student_event_id);
            const studentAddonMap = addonData.studentQuantities.get(studentEventId);
            if (studentAddonMap) {
              addonData.addons
                .filter(addon => addon.addon_table === 'students')
                .forEach(addon => {
                  const quantity = studentAddonMap.get(addon.addon_id) || 0;
                  student[`addon.${addon.key}`] = quantity;
                });
            }
          }
        });
        
        // Add addon data to teams
        teams.forEach(team => {
          if (team.team_id) {
            // Convert team_id to number to match Map keys
            const teamIdNum = Number(team.team_id);
            const teamAddonMap = addonData.teamQuantities.get(teamIdNum);
            if (teamAddonMap) {
              addonData.addons
                .filter(addon => addon.addon_table === 'teams')
                .forEach(addon => {
                  const quantity = teamAddonMap.get(addon.addon_id) || 0;
                  team[`addon.${addon.key}`] = quantity;
                });
            }
          }
        });
        
        // Add addon data to organizations (orgs array rather than organizations)
        orgs.forEach(org => {
          if (org.event?.org_event_id) {
            const orgEventIdNum = Number(org.event.org_event_id);
            const orgAddonMap = addonData.orgQuantities.get(orgEventIdNum);
            if (orgAddonMap) {
              addonData.addons
                .filter(addon => addon.addon_table === 'orgs')
                .forEach(addon => {
                  const quantity = orgAddonMap.get(addon.addon_id) || 0;
                  org[`addon.${addon.key}`] = quantity;
                });
            }
          }
        });
      }
    } catch (error) {
      console.error("Error in reloadData:", error);
    }
  }

  // Computed properties for merged columns
  function getMergedStudentColumns(): TableColumn[] {
    // Start with regular columns
    const regularColumns = [...studentColumns];

    // Add addon columns
    if (addonData) {
      const addonColumns = addonData.addons
        .filter(addon => addon.addon_table === 'students')
        .map(addon => ({
          key: `addon.${addon.key}`,
          label: addon.key,
          visible: true,
          searchable: true,
          dataType: "number" as const,
          format: (value: any, row: any) => ({ 
            text: String(value || 0), 
            isBadge: false 
          })
        }));
      regularColumns.push(...addonColumns);
    }

    // Add custom field columns
    const customColumns = studentCustomFields.map((field) => ({
      key: `custom_field.${field.key}`,
      label: field.key,
      visible: true,
      searchable: true,
      dataType: field.dataType || ("string" as const),
    }));

    return [...regularColumns, ...customColumns];
  }

  function getMergedTeamColumns(): TableColumn[] {
    // Start with regular columns
    const regularColumns = [...teamColumns];

    // Add addon columns
    if (addonData) {
      const addonColumns = addonData.addons
        .filter(addon => addon.addon_table === 'teams')
        .map(addon => ({
          key: `addon.${addon.key}`,
          label: addon.label,
          visible: true,
          searchable: true,
          dataType: "number" as const,
          format: (value: any, row: any) => ({ 
            text: String(value || 0), 
            isBadge: false 
          })
        }));
      regularColumns.push(...addonColumns);
    }

    // Add custom field columns
    const customColumns = teamCustomFields.map((field) => ({
      key: `custom_field.${field.key}`,
      label: field.key,
      visible: true,
      searchable: true,
      dataType: field.dataType || ("string" as const),
    }));

    return [...regularColumns, ...customColumns];
  }

  function getMergedOrgColumns(): TableColumn[] {
    // Start with regular columns
    const regularColumns = [...orgColumns];

    // Add addon columns
    if (addonData) {
      const addonColumns = addonData.addons
        .filter(addon => addon.addon_table === 'orgs')
        .map(addon => ({
          key: `addon.${addon.key}`,
          label: addon.label,
          visible: true,
          searchable: true,
          dataType: "number" as const,
          format: (value: any, row: any) => ({ 
            text: String(value || 0), 
            isBadge: false 
          })
        }));
      regularColumns.push(...addonColumns);
    }

    // Add custom field columns
    const customColumns = orgCustomFields.map((field) => ({
      key: `custom_field.${field.key}`,
      label: field.key,
      visible: true,
      searchable: true,
      dataType: field.dataType || ("string" as const),
    }));

    return [...regularColumns, ...customColumns];
  }

  // State for filters
  let nameFilter = $state("");
  let teamFilter = $state("");
  let orgFilter = $state("");
  let divisionFilter = $state("");
  let waiverFilter = $state<"all" | "signed" | "unsigned" | null>("all");

  // Generate a unique ID for admin orders
  function generateUUID(): string {
    return 'admin-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  // Custom comparator for name sorting
  // ... existing code ...

  // Add state for addon data
  let addonData = $state<{
    addons: any[];
    studentQuantities: Map<number, Map<string, number>>;
    teamQuantities: Map<number, Map<string, number>>;
    orgQuantities: Map<number, Map<string, number>>;
  } | null>(null);
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
        <span class="text-xl font-semibold text-amber-600"
          >{totalPurchasedTickets}</span
        >
      </div>
    </div>
  </div>

  {#snippet student_actions()}
    {#if hasSelectedStudents}
      <Button
        color="primary"
        on:click={openTransferModal}
        class="flex items-center gap-2"
      >
        <ArrowRightAltSolid class="w-4 h-4" />
        Transfer Students ({selectedStudents.length})
      </Button>
    {/if}
  {/snippet}
  {#snippet team_actions()}
    {#if hasSelectedTeams}
      <Button
        color="primary"
        on:click={openTeamTransferModal}
        class="flex items-center gap-2"
      >
        <ArrowRightAltSolid class="w-4 h-4" />
        Transfer Teams ({selectedTeams.length})
      </Button>
    {/if}
  {/snippet}

  <Tabs style="underline" class="themed-tabs">
    <TabItem
      open={activeTab === 0}
      title="Students"
      class="tab-item"
      activeClasses="tab-active"
      onclick={() => {
        activeTab = 0;
      }}
    >
      <CustomTable
        data={formattedStudentRows}
        columns={mergedStudentColumns}
        entityType="student"
        isLoading={loading}
        {event_id}
        {event_name}
        tableId={`event_${event_id}_students`}
        idField="student_id"
        debounceSearch={400}
        lazyLoad={true}
        on:selectionChange={handleStudentSelectionChange}
        actions={student_actions}
      ></CustomTable>
    </TabItem>

    <TabItem
      open={activeTab === 1}
      title="Teams"
      class="tab-item"
      activeClasses="tab-active"
      onclick={() => {
        activeTab = 1;
      }}
    >
      <CustomTable
        data={formattedTeamRows}
        columns={mergedTeamColumns}
        entityType="team"
        isLoading={loading}
        {event_id}
        {event_name}
        tableId={`event_${event_id}_teams`}
        idField="team_id"
        selectable={true}
        debounceSearch={400}
        lazyLoad={true}
        on:selectionChange={handleTeamSelectionChange}
        actions={team_actions}
      ></CustomTable>
    </TabItem>

    <TabItem
      open={activeTab === 2}
      title="Organizations"
      class="tab-item"
      activeClasses="tab-active"
      onclick={() => {
        activeTab = 2;
      }}
    >
      <CustomTable
        data={formattedOrgRows}
        columns={mergedOrgColumns}
        entityType="org"
        isLoading={loading}
        {event_id}
        {event_name}
        tableId={`event_${event_id}_orgs`}
        idField="org_id"
        debounceSearch={400}
        lazyLoad={true}
      />
    </TabItem>

    <TabItem
      open={activeTab === 3}
      title="Ticket Orders"
      class="tab-item"
      activeClasses="tab-active"
      onclick={() => {
        activeTab = 3;
      }}
    >
      <!-- hack to get around scoping of snippet -->
      {#if true}
        {#snippet actions()}
          <Button
            color="primary"
            on:click={openTicketModal}
            class="flex items-center gap-2"
          >
            <CirclePlusSolid class="w-4 h-4" />
            Insert Order
          </Button>
          <Button
            color="primary"
            on:click={() => reloadData(["ticket_orders"])}
            class="flex items-center gap-2"
          >
            Reload
          </Button>
        {/snippet}
        <CustomTable
          data={ticketOrders}
          columns={ticketOrderColumns}
          entityType="student"
          isLoading={loading}
          {event_id}
          {event_name}
          tableId={`event_${event_id}_ticket_orders`}
          idField="id"
          debounceSearch={400}
          lazyLoad={true}
          {actions}
        ></CustomTable>
      {/if}
    </TabItem>
  </Tabs>

  <!-- Transfer Modal -->
  <Modal
    title="Transfer Students"
    bind:open={showTransferModal}
    size="md"
    autoclose={false}
  >
    <div class="space-y-4">
      {#if transferSuccess && !transferError}
        <Alert color="green" class="mb-4">
          <span class="font-medium">Success!</span> All students have been transferred
          successfully.
        </Alert>
      {:else if transferSuccess && transferError}
        <Alert color="yellow" class="mb-4">
          <span class="font-medium">Partial Success!</span> Some students were transferred
          successfully, but others encountered errors.
        </Alert>

        <div class="mt-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">
            Failed Transfers ({failedStudents.length})
          </h4>
          <div
            class="bg-red-50 border border-red-200 rounded-lg overflow-hidden"
          >
            {#each failedStudents as student, index}
              <div
                class="p-3 {index !== failedStudents.length - 1
                  ? 'border-b border-red-100'
                  : ''}"
              >
                <div class="flex items-start">
                  <div class="flex-shrink-0 text-red-500 mt-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">
                      {student.fullName}
                    </h3>
                    <div class="mt-1 text-xs text-red-700">
                      {student.errorMessage || "Unknown error"}
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
          <h4 class="text-sm font-semibold text-gray-700 mb-2">
            Failed Transfers ({failedStudents.length})
          </h4>
          <div
            class="bg-red-50 border border-red-200 rounded-lg overflow-hidden"
          >
            {#each failedStudents as student, index}
              <div
                class="p-3 {index !== failedStudents.length - 1
                  ? 'border-b border-red-100'
                  : ''}"
              >
                <div class="flex items-start">
                  <div class="flex-shrink-0 text-red-500 mt-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">
                      {student.fullName}
                    </h3>
                    <div class="mt-1 text-xs text-red-700">
                      {student.errorMessage || "Unknown error"}
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
            Retry transfer for {failedStudents.length} failed student{failedStudents.length !==
            1
              ? "s"
              : ""} to:
          {:else}
            Transfer {selectedStudents.length} student{selectedStudents.length !==
            1
              ? "s"
              : ""} to:
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
          {#if transferType === "team"}
            <div class="mt-2">
              <label
                for="team-select"
                class="block mb-2 text-sm font-medium text-gray-900"
              >
                Select Team
              </label>
              <Select
                id="team-select"
                class="w-full"
                bind:value={selectedTeamId}
              >
                <option value={null} disabled selected>Choose a team...</option>
                <option value={-1}>No team (remove from current team)</option>
                {#each sortedTeams as team}
                  <option value={team.team_id}>
                    {team.team_name} ({team.org_name
                      ? `Org: ${team.org_name} / `
                      : ""}Code: {team.join_code})
                  </option>
                {/each}
              </Select>
              <Alert color="yellow" class="mt-2 text-xs">
                <span class="font-medium">Note:</span> Students will also be moved
                to the selected team's organization automatically.
              </Alert>
            </div>
          {:else}
            <!-- Organization Selection -->
            <div class="mt-2">
              <label
                for="org-select"
                class="block mb-2 text-sm font-medium text-gray-900"
              >
                Select Organization
              </label>
              <Select id="org-select" class="w-full" bind:value={selectedOrgId}>
                <option value={null} disabled selected
                  >Choose an organization...</option
                >
                <option value={-1}
                  >No organization (remove from current org)</option
                >
                {#each sortedOrgs as org}
                  <option value={org.org_id}>
                    {org.name || `Organization #${org.org_id}`}{org.join_code ? ` (${org.join_code})` : ''}
                  </option>
                {/each}
              </Select>
              <Alert color="yellow" class="mt-2 text-xs">
                <span class="font-medium">Note:</span> Students will be removed from
                their current teams when being transferred to a new organization.
              </Alert>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Modal Footer -->
    <svelte:fragment slot="footer">
      <Button color="alternative" on:click={() => (showTransferModal = false)}>
        {transferSuccess && !transferError ? "Close" : "Cancel"}
      </Button>
      {#if !transferSuccess || (transferSuccess && transferError)}
        <Button
          color="primary"
          on:click={executeTransfer}
          disabled={transferInProgress ||
            (transferType === "team" && !selectedTeamId) ||
            (transferType === "org" && !selectedOrgId)}
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
  <Modal
    title="Transfer Teams"
    bind:open={showTeamTransferModal}
    size="md"
    autoclose={false}
  >
    <div class="space-y-4">
      {#if transferSuccess && !transferError}
        <Alert color="green" class="mb-4">
          <span class="font-medium">Success!</span> All teams have been transferred
          successfully.
        </Alert>
      {:else if transferSuccess && transferError}
        <Alert color="yellow" class="mb-4">
          <span class="font-medium">Partial Success!</span> Some teams were transferred
          successfully, but others encountered errors.
        </Alert>

        <div class="mt-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">
            Failed Transfers ({failedTeams.length})
          </h4>
          <div
            class="bg-red-50 border border-red-200 rounded-lg overflow-hidden"
          >
            {#each failedTeams as team, index}
              <div
                class="p-3 {index !== failedTeams.length - 1
                  ? 'border-b border-red-100'
                  : ''}"
              >
                <div class="flex items-start">
                  <div class="flex-shrink-0 text-red-500 mt-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">
                      {team.team_name}
                    </h3>
                    <div class="mt-1 text-xs text-red-700">
                      {team.errorMessage || "Unknown error"}
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
          <h4 class="text-sm font-semibold text-gray-700 mb-2">
            Failed Transfers ({failedTeams.length})
          </h4>
          <div
            class="bg-red-50 border border-red-200 rounded-lg overflow-hidden"
          >
            {#each failedTeams as team, index}
              <div
                class="p-3 {index !== failedTeams.length - 1
                  ? 'border-b border-red-100'
                  : ''}"
              >
                <div class="flex items-start">
                  <div class="flex-shrink-0 text-red-500 mt-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">
                      {team.team_name}
                    </h3>
                    <div class="mt-1 text-xs text-red-700">
                      {team.errorMessage || "Unknown error"}
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
            Retry transfer for {failedTeams.length} failed team{failedTeams.length !==
            1
              ? "s"
              : ""} to:
          {:else}
            Transfer {selectedTeams.length} team{selectedTeams.length !== 1
              ? "s"
              : ""} to:
          {/if}
        </p>

        <div class="flex flex-col gap-3">
          <!-- Organization Selection -->
          <div class="mt-2">
            <label
              for="team-org-select"
              class="block mb-2 text-sm font-medium text-gray-900"
            >
              Select Organization
            </label>
            <Select
              id="team-org-select"
              class="w-full"
              bind:value={selectedOrgId}
            >
              <option value={null} disabled selected
                >Choose an organization...</option
              >
              <option value={-1}
                >No organization (remove org affiliation)</option
              >
              {#each sortedOrgs as org}
                <option value={org.org_id}>
                  {org.name || `Organization #${org.org_id}`}{org.join_code ? ` (${org.join_code})` : ''}
                </option>
              {/each}
            </Select>
            <Alert color="yellow" class="mt-2 text-xs">
              <span class="font-medium">Note:</span> All students on the selected
              teams will also be transferred to the new organization.
            </Alert>
          </div>
        </div>
      {/if}
    </div>

    <!-- Modal Footer -->
    <svelte:fragment slot="footer">
      <Button
        color="alternative"
        on:click={() => (showTeamTransferModal = false)}
      >
        {transferSuccess && !transferError ? "Close" : "Cancel"}
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

  <!-- Ticket order adding Modal -->
  <Modal
    title="Add Ticket Order"
    bind:open={showTicketOrderModal}
    size="md"
  
  >
    <div class="space-y-4">
      {#if ticketOrderSuccess}
        <Alert color="green" class="mb-4">
          <span class="font-medium">Success!</span> Ticket order has been added successfully.
        </Alert>
      {:else}
        <div class="flex flex-col gap-3">
          <!-- Purchaser Type Selection (similar to transfer modal) -->
          <div class="flex gap-4">
            <Radio name="purchaserType" value="student" bind:group={ticketOrderType}>
              <div class="flex items-center gap-2">
                <UserSolid class="w-4 h-4 text-blue-600" />
                <span>Student</span>
              </div>
            </Radio>
            <Radio name="purchaserType" value="org" bind:group={ticketOrderType}>
              <div class="flex items-center gap-2">
                <BuildingSolid class="w-4 h-4 text-purple-600" />
                <span>Organization</span>
              </div>
            </Radio>
          </div>

          <!-- Student Selection -->
          {#if ticketOrderType === "student"}
            <div class="mt-2">
              <label
                for="student-select"
                class="block mb-2 text-sm font-medium text-gray-900"
              >
                Select Student
              </label>
              <Select
                id="student-select"
                class="w-full"
                bind:value={ticketOrderPurchaserID}
              >
                <option value="" disabled selected>Choose a student...</option>
                {#each sortedStudents as student}
                  <option value={student.student_id}>
                    {student.first_name} {student.last_name} ({student.email})
                  </option>
                {/each}
              </Select>
            </div>
          {:else}
            <!-- Organization Selection -->
            <div class="mt-2">
              <label
                for="org-select"
                class="block mb-2 text-sm font-medium text-gray-900"
              >
                Select Organization
              </label>
              <Select id="org-select" class="w-full" bind:value={ticketOrderPurchaserID}>
                <option value="" disabled selected>Choose an organization...</option>
                {#each sortedOrgs as org}
                  <option value={org.org_id}>
                    {org.name || `Organization #${org.org_id}`}{org.join_code ? ` (${org.join_code})` : ''}
                  </option>
                {/each}
              </Select>
            </div>
          {/if}
          <div class="mt-2">
            <label
              for="ticket-service"
              class="block mb-2 text-sm font-medium text-gray-900"
            >
              Select Ticket Service
            </label>
            <Select
              id="ticket-service" 
              class="w-full"
              bind:value={ticketOrderService}
            >
              <option value="admin">Admin</option>
              <option value="stripe">Stripe</option>
              <option value="eventbrite">Eventbrite</option>
            </Select>
          </div>
          <div class="mt-2">
            <label
              for="ticket-order-id"
              class="block mb-2 text-sm font-medium text-gray-900"
            >
              {ticketOrderService === "admin" 
                ? "Custom Order ID" 
                : ticketOrderService === "stripe"
                  ? "Stripe Order ID *"
                  : "Eventbrite Order ID *"}
            </label>
            
            {#if ticketOrderService === "admin"}
              <div class="flex">
                <span class="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md flex-shrink-0" style="height: 38px;">
                  admin-
                </span>
                <Input id="ticket-order-id" class="rounded-l-none" bind:value={ticketOrderID} />
              </div>
            {:else if ticketOrderService === "stripe"}
              <div class="flex">
                <span class="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md flex-shrink-0" style="height: 38px;">
                  cs_live_
                </span>
                <Input id="ticket-order-id" class="rounded-l-none" bind:value={ticketOrderID} placeholder="a1b2c3..." required />
              </div>
            {:else}
              <Input id="ticket-order-id" bind:value={ticketOrderID} placeholder="1234..." required />
            {/if}
            
            <p class="mt-1 text-xs text-gray-500">
              {ticketOrderService === "admin" 
                ? "A descriptive unique order ID for this order" 
                : `The exact order ID on ${ticketOrderService} (required)`}
            </p>
          </div>
          <div class="mt-2">
            <label
              for="ticket-order-quantity"
              class="block mb-2 text-sm font-medium text-gray-900"
            >
              Quantity
            </label>
            <Input
              id="ticket-order-quantity"
              type="number"
              bind:value={ticketOrderQuantity}
              disabled={ticketOrderType === "student"}
              min="1"
            />
            {#if ticketOrderType === "student"}
              <p class="mt-1 text-xs text-gray-500">
                Student tickets are limited to quantity of 1
              </p>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    {#if ticketOrderError}
      <Alert color="yellow" class="mt-2 text-xs">
        <span class="font-medium">Error:</span>
        {ticketOrderError.message}
      </Alert>
      <br />
    {/if}

    {#if ticketOrderSuccess}
      <Alert color="green" class="mt-2 text-xs">
        <span class="font-medium">Success:</span>
        {ticketOrderSuccess}
      </Alert>
      <br />
    {/if}

    <!-- Modal Footer -->
    <svelte:fragment slot="footer">
      <Button
        color="alternative"
        on:click={() => (showTicketOrderModal = false)}
      >
        {ticketOrderSuccess ? "Close" : "Cancel"}
      </Button>
      {#if !ticketOrderSuccess}
        <Button
          color="primary"
          on:click={attemptTicketOrderInsert}
          disabled={ticketOrderInsertInProgress || !isFormValid}
        >
          {#if ticketOrderInsertInProgress}
            <Spinner class="mr-2" size="4" />
          {/if}
          Insert
        </Button>
      {/if}
    </svelte:fragment>
  </Modal>
</div>

<style>
  /* CSS variables are now defined in CustomTable component */

  /* Keep styles specific to this component */
  #app {
    max-width: 1280px;
    margin: 0 auto;
  }

  /* Button theming */
  .btn-primary {
    background-color: var(--primary);
    color: white;
  }

  .btn-primary:hover {
    background-color: var(--primary-dark);
  }

  .btn-outline {
    border: 1px solid var(--primary);
    color: var(--primary);
  }

  .btn-outline:hover {
    background-color: var(--primary-tint);
  }

  .btn-accent {
    background-color: var(--accent);
    color: white;
  }

  .btn-accent:hover {
    opacity: 0.9;
  }

  /* Disabled button opacity */
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Dialog element styling */
  dialog {
    border-radius: 0.5rem;
    border: 1px solid var(--primary-light);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  /* Modal backdrop */
  dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }

  /* Custom styling for table rows to add more vertical padding */
  :global(table td) {
    padding-top: 0.75rem !important;
    padding-bottom: 0.75rem !important;
  }

  /* Control width of name column - it should be as small as possible while still accommodating the content */
  :global(td.identity-column-first) {
    width: fit-content !important;
    white-space: nowrap;
  }

  /* Ensure the fitContent property works properly */
  :global(.entity-badge[style*="width: max-content"]) {
    width: max-content !important;
    display: inline-block !important;
  }
</style>
