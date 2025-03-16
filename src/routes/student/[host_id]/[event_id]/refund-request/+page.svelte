<script lang="ts">
  import { page } from "$app/stores";
  import { Button, Badge, Tabs, TabItem, Card } from "flowbite-svelte";
  import StudentForm from "$lib/components/StudentForm.svelte";
  import Loading from "$lib/components/Loading.svelte";
  import { Alert } from "flowbite-svelte";
  import { InfoCircleSolid } from "flowbite-svelte-icons";
  import { user } from "$lib/sessionStore";
  import {
    getEventInformation,
    getStudentEvent,
    getStudentTicketOrder,
    updateStudentTeam,
    getOrgEventByJoinCode,
    getHostInformation,
    type StudentEvent,
    getStudent,
    updateStudentOrgEvent,
    type Student,
  } from "$lib/supabase";
  import type { Tables } from "../../../../../db/database.types";
  import {
    supabase,
    type AsyncReturnType,
    type Get,
  } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";
  import TicketCard from "$lib/components/TicketCard.svelte";

  const host_id = parseInt($page.params.host_id);
  const event_id = parseInt($page.params.event_id);
  let student_event: StudentEvent = $state(null);
  let event_details: AsyncReturnType<typeof getEventInformation> | null =
    $state(null);
  import CustomForm from "$lib/components/CustomForm.svelte";
  import EventDisplay from "$lib/components/EventDisplay.svelte";
  import CopyText from "$lib/components/CopyText.svelte";
  import StudentTeam from "$lib/components/StudentTeam.svelte";
  let team: Get<StudentEvent, "team"> | undefined = $state(null);
  let org_event: Get<StudentEvent, "org_event"> | undefined = $state(null);
  let ticket_order: Tables<"ticket_orders"> | null = $state(null);
  let transaction_stored = $state(false);
  let loading = $state(true);
  let student: Student = $state(null);
  let teamJoinFormResponses: any = $state({});
  let teamJoinFormErrors: any = $state({});
  let orgJoinFormResponses: any = $state({});
  let orgJoinFormErrors: any = $state({});
  let host = $state();
  let selectedOption: "join_org" | "join_team" | "create_team" =
    $state("join_org");

  


  async function requestRefund() {
    if (ticket_order && ticket_order.refund_status == "NONE") {
      if (ticket_order.ticket_service == "eventbrite") {
        const { data: authData, error } = await supabase.auth.getSession();
        if (error != null) {
          handleError(error);
        }
        const token = authData.session?.access_token ?? null;
        console.log("calling");

        // TODO: check that data has quantity 1.
        let body = {
          event_id,
          ticket_id: ticket_order.id,
          token,
          eventbrite_order_id: ticket_order.order_id,
        };
        console.log("calling");
        console.log("body", body);
        const response = await fetch("/api/request-eventbrite-refund-student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const text = await response.text();
        if (response.ok) {
          ticket_order = await getStudentTicketOrder($user!.id, event_id);
          console.log("ticket_order", ticket_order);
        } else {
          handleError(new Error(text));
        }
      } else if (ticket_order.ticket_service == "stripe") {
        handleError(new Error("Refunds with stripe not yet supported"));
      } else {
        handleError(new Error("Ticket service not found"));
      }
    }
  }
  // // actual call should make an api call and make sure there is no error:
  // const response = await fetch("/api/request-refund", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ student_event_id: student_event!.student_event_id }),
  // })
  // const text = await response.text();
  // if (response.ok) {
  //   ticket_order = await getStudentTicketOrder($user!.id, event_id);
  // } else {
  //   handleError(new Error(text));
  // should force page reload here
  // ticket_order.refund_status = "PENDING APPROVAL";
  // const eventbriteEventId = event_details?.eventbrite_event_id; // Replace with your actual Eventbrite event ID
  // if (eventbriteEventId) {
  //   // Check if the event ID is valid
  //    (window as any).EBWidgets.createWidget({
  //     widgetType: "checkout",
  //     eventId: eventbriteEventId,
  //     modal: true,
  //     modalTriggerElementId: "eventbrite-widget-container",
  //     iFrameContainerId: "modalTriggerElementId",
  //     onOrderComplete: await eventbritePurchase(creating_team, joining_team_code),
  //     promoCode: "student",
  //   });
  //   (document.querySelector("#eventbrite-widget-container") as HTMLElement).click();
  // }
  // }

  (async () => {
    // Check if this student is registered in this event.
    // NOTE: only student accounts can view this page (because of the student/layout.svelte)
    // Therefore, getStudent always returns non-null.
    student = await getStudent($user!.id)!;
    host = await getHostInformation(host_id);
    student_event = await getStudentEvent($user!.id, event_id);
    ticket_order = await getStudentTicketOrder($user!.id, event_id);
    console.log("ticket_order", ticket_order);
    console.log("hello");
    transaction_stored = ticket_order != null;
    team = student_event?.team;
    org_event = student_event?.org_event;
    team?.student_event.sort((a: StudentEvent, b: StudentEvent) => {
      const aValues = [
        a?.front_id ?? "",
        a?.student?.first_name ?? "",
        a?.student?.last_name ?? "",
      ];
      const bValues = [
        b?.front_id ?? "",
        b?.student?.first_name ?? "",
        b?.student?.last_name ?? "",
      ];
      return aValues < bValues ? 1 : -1;
    });

    console.log("student_event", student_event);
    event_details = await getEventInformation(event_id);

    // if (event_details?.eventbrite_event_id) {
    //   // Load the Eventbrite widget
    //   const script = document.createElement("script");
    //   script.src = "https://www.eventbrite.com/static/widgets/eb_widgets.js";
    //   script.async = true;
    //   document.body.appendChild(script);
    // }

    loading = false;
  })();
</script>

{#if loading}
  <Loading />
{:else}
  <script
    src="https://www.eventbrite.com/static/widgets/eb_widgets.js"
  ></script>
  <EventDisplay id={event_id} {host} event={event_details} editable={false} />
  <hr />
  {#if !student_event}
    {#if transaction_stored}
      <p>
        Payment found, but registration is not complete. Please fill out the
        following form to proceed.
      </p>
      <br />
    {/if}
  {/if}

  <!-- // need to ensure that the ticket they bought is theres -->
  <!-- // need to make sure they are not already in a team -->
  <!-- If we request a refund on the ticket, will be removed from the team -->
  {#if student_event}
    {#if team}
      <div class="flex gap-8 p-6">
        <!-- Left Sidebar with Instructions -->
        <div class="w-2/5">
          <Card>
            <h5 class="mb-4 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Important Information
            </h5>
            <div class="space-y-4 text-gray-700 dark:text-gray-300">
              <div class="flex gap-2">
                <InfoCircleSolid class="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <p>
                  If you request a refund for your ticket:
                </p>
              </div>
              <ul class="list-disc pl-8 space-y-2">
                <li>The tickets you request to refund will be immediately deactivated</li>
                <li>You will not be able to participate in the event with this ticket, unless the request gets explicitly denied.</li>
                <li>You cannot purchase a new ticket until the host responds to your request</li>
                <li>The host will review your request and either approve or deny it</li>
                <li>You will have to check this page to see the status of your request</li>
              </ul>
              <Alert color="yellow" class="mt-4">
                <span class="font-medium">Please note:</span> This process cannot be undone once initiated.
              </Alert>
            </div>
          </Card>
        </div>

        <!-- Right Side Ticket List -->
        <div class="w-fit max-w-2xl">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h4 class="text-2xl font-bold mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10">Your Tickets</h4>
            <div class="overflow-y-auto max-h-[70vh] pr-2 -mr-2">
              <div class="space-y-4">
                {#if ticket_order}
                  <TicketCard ticket={ticket_order} onRequestRefund={requestRefund} />
                {/if}

                <!-- Placeholder for additional tickets -->
                <TicketCard 
                  ticket={{
                    order_id: "SAMPLE-123",
                    refund_status: "REQUESTED",
                    ticket_service: "eventbrite",
                    id: 0,
                    student_id: "",
                    event_id: 0,
                    created_at: new Date().toISOString(),
                    org_id: null,
                    quantity: 1
                  }} 
                  onRequestRefund={() => {}}
                />
                <TicketCard 
                  ticket={{
                    order_id: "SAMPLE-456",
                    refund_status: "APPROVED",
                    ticket_service: "eventbrite",
                    id: 1,
                    student_id: "",
                    event_id: 0,
                    created_at: new Date().toISOString(),
                    org_id: null,
                    quantity: 1
                  }} 
                  onRequestRefund={() => {}}
                />
                <TicketCard 
                  ticket={{
                    order_id: "SAMPLE-789",
                    refund_status: "DENIED",
                    ticket_service: "eventbrite",
                    id: 2,
                    student_id: "",
                    event_id: 0,
                    created_at: new Date().toISOString(),
                    org_id: null,
                    quantity: 1
                  }} 
                  onRequestRefund={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <Alert border color="red">
        <InfoCircleSolid slot="icon" class="w-5 h-5" />
        <span class="font-medium">Not assigned to a team!</span>
        Error, you are not registered for this event? You cannot request a refund
      </Alert>
    {/if}

    <!--
    {#if org_event != null}
      {#if !purchase_ticket}
        <button onclick={purchase_ticket({})}
          >Purchase Individual Ticket (check with your organization if you need to
          do so)</button
        >
      {/if}
    {/if}
    -->
  {/if}

{/if}

<style>
  .team_info {
    padding: 10px;
    margin: 20px;
  }

  :global([role="tabpanel"]) {
    background-color: transparent;
  }

  .teamContainer {
    max-width: 800px;
    margin: 0 auto;
  }
</style>
