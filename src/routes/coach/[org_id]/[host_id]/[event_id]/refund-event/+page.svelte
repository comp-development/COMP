<script lang="ts">
    import { page } from "$app/stores";
    import Loading from "$lib/components/Loading.svelte";
    import { user } from "$lib/sessionStore";
    import Modal from "$lib/components/Modal.svelte";
    import {
      getCoach,
      getEventInformation,
      getCoachOrganization,
      updateStudentTeam,
      deleteTeam,
      deleteStudentTeam,
      getHostInformation,
      getStudentsWithoutTeam,
      removeStudentFromOrganization,
      getTicketCount,
      getOrganizationActiveTickets,
      getOrganizationFinishedTickets,
    } from "$lib/supabase";
    import { Button, ButtonGroup, Timeline, TimelineItem, Badge, Card, Alert } from "flowbite-svelte";
    import type { Tables } from "../../../../../../db/database.types";
    import { CartSolid, UsersGroupSolid, CalendarWeekSolid, CheckCircleSolid, ClockSolid, CloseCircleSolid, UserAddSolid, InfoCircleSolid } from "flowbite-svelte-icons";
    import toast from "$lib/toast.svelte";
    import { handleError } from "$lib/handleError";
    import OrgForm from "$lib/components/OrgForm.svelte";
    import CopyText from "$lib/components/CopyText.svelte";
    import EventDisplay from "$lib/components/EventDisplay.svelte";
    import StudentTeam from "$lib/components/StudentTeam.svelte";
    import DraggableStudent from "$lib/components/DraggableStudent.svelte";
    import TeamForm from "$lib/components/TeamForm.svelte";
    import CustomForm from "$lib/components/CustomForm.svelte";
    import { supabase } from "$lib/supabaseClient";
    import InfoToolTip from "$lib/components/InfoToolTip.svelte";
    import { onMount } from 'svelte';
    import TicketCard from "$lib/components/TicketCard.svelte";
  
    let loading = $state(true);
    let coach: any = $state();
    let organizationDetails: any = $state(null);
    let ticketCount: number = $state(0);
    let event_details: Tables<"events"> | null = $state(null);
    const event_id = parseInt($page.params.event_id);
    const org_id = parseInt($page.params.org_id);
    let draggedMember: any = null;
    let sourceTeamId: number | null = null;
  
    let studentsWithoutTeams = $state([]);
    let isTeamModalOpen = $state(false);
    let teamName = $state("");
    let editingTeamId: number | null = $state(null);
  
    let isPurchaseModalOpen = $state(false);
    let ticketQuantity = $state(0);
    let newResponses = $state({});
    
  
    let showDeleteTeamConfirmation = $state(false);
    let deleteTeamId = $state(null);
  
    let stepNumber = $state(0);
  
    let host: any = $state();
    const host_id = parseInt($page.params.host_id);
  
    let ticket_orders: Tables<"ticket_orders">[] = $state([]);
    let in_progress_ticket_orders: Tables<"ticket_orders">[] = $state([]);

    async function requestRefund(first_name: string, last_name: string, email: string, ticket_order: Tables<"ticket_orders">) {
      if (ticket_order && ticket_order.refund_status == "NONE") {
        if (ticket_order.ticket_service == "eventbrite" || ticket_order.ticket_service == "stripe") {
          const { data: authData, error } = await supabase.auth.getSession();
          if (error != null) {
            handleError(error);
          }
          const token = authData.session?.access_token ?? null;
  
          let body = {
            event_id,
            ticket_id: ticket_order.id,
            token,
            org_id,
            first_name,
            last_name,
            email,
            eventbrite_order_id: ticket_order.order_id,
          };
          const response = await fetch("/api/request-eventbrite-refund-org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const text = await response.text();
          if (response.ok) {
            // Refresh ticket orders after successful refund request
            ticket_orders = await getOrganizationActiveTickets(event_id, org_id);
            in_progress_ticket_orders = await getOrganizationFinishedTickets(event_id, org_id);
          } else {
            handleError(new Error(text));
          }
        } else {
          handleError(new Error("Ticket service not found"));
        }
      }
    }
  
    (async () => {
      host = await getHostInformation(host_id);
      event_details = await getEventInformation(event_id);
  
      if (event_details?.eventbrite_event_id) {
        // Load the Eventbrite widget
        const script = document.createElement('script');
        script.src = 'https://www.eventbrite.com/static/widgets/eb_widgets.js';
        script.async = true;
        document.body.appendChild(script);
      }
  
      coach = await getCoach($user!.id);
      organizationDetails = await getCoachOrganization(
        coach.coach_id,
        event_id,
        org_id,
      );
  
      console.log("ORG", organizationDetails);
      ticketCount = await getTicketCount(event_id, org_id);
  
      studentsWithoutTeams = await getStudentsWithoutTeam(event_id, org_id);
      console.log("usedTickets", getUsedTickets());
  
      ticket_orders = await getOrganizationActiveTickets(event_id, org_id);
      in_progress_ticket_orders = await getOrganizationFinishedTickets(event_id, org_id);
  
      loading = false;
    })();
  
    function handleDragStart(event: DragEvent, team_member: any) {
      console.log("EVENT", event)
      if (event.dataTransfer) {
        draggedMember = team_member;
        sourceTeamId = team_member.team_id;
        event.dataTransfer.setData("text/plain", JSON.stringify(team_member));
      }
    }

    function getUsedTickets() {
    let usedTickets = 0;
    organizationDetails.teams.forEach((team: any) => {
      console.log("TEAM", team);
      team.teamMembers.forEach((member: any) => {
          usedTickets += 1
      });
    })
    return usedTickets;
  }
  
    $effect(() => {
      if (!organizationDetails) return;
      if (!organizationDetails.event) {
        stepNumber = 1;
      } else if (organizationDetails.teams.length === 0) {
        stepNumber = 2;
      } else if (ticketCount === 0) {
        stepNumber = 3;
      } else if (organizationDetails.teams.every((team: any) => team.teamMembers.length === 0) && studentsWithoutTeams.length === 0) {
        stepNumber = 4;
      } else if (organizationDetails.teams.every((team: any) => team.teamMembers.length === 0)) {
        stepNumber = 5;
      } else {
        stepNumber = 6;
      }
    });
  

  

  

  

  

  

  

  


  

  
  
  </script>

  <!-- Want a page that displays the list of all ticket orders for the event-->
   <!-- Calculate the total number of tickets purchased, and the tickets assigned -->
    <!-- Order by ticket quantity -->
    <!-- Enable ability to request refund by calling appropriate eventbrite api -->
        <!-- Call the request refund on that order -->
        <!-- take the tickets out of tickets available to use -->
        <!-- Tickets reques for refund-->
         <!-- Currently requested for refund -->
        <!--  -->

        <!-- If request is denied, can no longer use -->
         <!--  -->
     <!-- Or call appropriate stripe api -->
     <!--  -->

  {#if loading}
    <Loading />
  {:else}
    <EventDisplay
      id={event_id}
      host={host}
      event={event_details}
      editable={false}
    />
    <hr /><br><br>
    <div class="flex gap-8 p-6">
      <!-- Left Sidebar with Instructions -->
      <div class="w-1/2">
        <Card>
          <h5 class="mb-4 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Important Information
          </h5>
          <div class="space-y-4 text-gray-700 dark:text-gray-300">
            <div class="flex gap-2">
              <InfoCircleSolid class="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <p>
                When requesting refunds for organization tickets:
              </p>
            </div>
            <ul class="list-disc pl-8 space-y-2">
              <li>Each ticket requested for refund will be immediately deactivated upon refund request</li>
              <li>No student may be using the requested number of tickets to make a refund request.</li>
              <li>The host will review each request and either approve or deny it</li>
              <li>You will need to check this page to see the status of your requests</li>
            </ul>
            <Alert color="yellow" class="mt-4">
              <span class="font-medium">Please note:</span> This refund process cannot be undone once initiated, but you may reach out to the host and ask them to reject the request.
            </Alert>
          </div>
        </Card>
      </div>
      
      {#if ticket_orders.length > 0}
      <!-- Center Column - Active Tickets -->
      <div class="w-1/2">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h4 class="text-2xl font-bold mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10">Active Tickets</h4>
          <div class="overflow-y-auto max-h-[70vh] pr-2 -mr-2">
            <div class="space-y-4">
              {#each ticket_orders as ticket_order}
                <TicketCard 
                  ticket={ticket_order}
                  onRequestRefund={requestRefund}
                  first_name={coach?.first_name}
                  last_name={coach?.last_name}
                  email={coach?.email}
                />
              {/each}
            </div>
          </div>
        </div>
      </div>
      {/if}
  
      <!-- Right Column - Requested Refunds --
  
      <!-- Far Right Column - Finished Tickets -->
      {#if in_progress_ticket_orders.length > 0}
      <div class="w-1/2">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h4 class="text-2xl font-bold mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10">Inactive Tickets</h4>
          <div class="overflow-y-auto max-h-[70vh] pr-2 -mr-2">
            <div class="space-y-4">
              {#each in_progress_ticket_orders as ticket_order}
                <TicketCard 
                  ticket={ticket_order}
                  onRequestRefund={() => {}}
                />
              {/each}
            </div>
          </div>
        </div>
      </div>
      {/if}

    </div>

    <hr />

  {/if}

  
  <style>
    .organization {
      margin: 20px;
      border-radius: 20px;
    }
  
    .grid-container {
      display: grid;
      grid-template-columns: 3fr 1fr;
      gap: 20px;
      margin: 20px;
    }
  
    @media only screen and (max-width: 900px) {
      .grid-container {
        grid-template-columns: 100%;
      }
    }
  
    @media only screen and (max-width: 650px) {
      :global(.timeline h3) {
        text-align: center !important;
      }
    }
  
    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      grid-auto-rows: min-content;
      gap: 20px;
    }
  
    .border-box {
      padding: 20px;
      border-radius: 15px;
      border: 2px solid var(--primary-light);
    }
  </style>
  



  
