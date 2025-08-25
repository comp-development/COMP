<script lang="ts">
  import { page } from "$app/stores";
  import { Button, Tabs, TabItem } from "flowbite-svelte";
  import StudentForm from "$lib/components/StudentForm.svelte";
  import Loading from "$lib/components/Loading.svelte";
  import { Alert } from "flowbite-svelte";
  import { InfoCircleSolid } from "flowbite-svelte-icons";
  import { user } from "$lib/sessionStore";
  import {
    getEventInformation,
    getStudentEvent,
    getStudentAvailableTickets,
    getStudentTicketOrder,
    updateStudentTeam,
    getOrgEventByJoinCode,
    getHostInformation,
    type StudentEvent,
    getStudent,
    updateStudentOrgEvent,
    type Student,
    getStudentTotalTickets,
    getScoreReportInfo,
  } from "$lib/supabase";
  import type { Json, Tables } from "../../../../../db/database.types";
  import {
    supabase,
    type AsyncReturnType,
    type Get,
  } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";
  import AddOnButton from "$lib/components/AddOnButton.svelte";

  const host_id = parseInt($page.params.host_id);
  const event_id = parseInt($page.params.event_id);
  let student_event: StudentEvent = $state(null);
  let event_details: AsyncReturnType<typeof getEventInformation> | null =
    $state(null);
  let score_report: AsyncReturnType<typeof getScoreReportInfo> | null = $state(null)

  import CustomForm from "$lib/components/CustomForm.svelte";
  import EventDisplay from "$lib/components/EventDisplay.svelte";
  import StudentTeam from "$lib/components/StudentTeam.svelte";

  let team: Get<StudentEvent, "team"> | undefined = $state(null);
  let org_event: Get<StudentEvent, "org_event"> | undefined = $state(null);
  // let ticket_order: Tables<"ticket_orders"> | null = null;
  let ticket_order:
    | (Tables<"ticket_orders"> & { refund_requests: Tables<"refund_requests">[] })
    | null;

  let available_tickets = $state(0);
  let total_tickets = $state(0);
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

  const orgJoinSubmit = async (_: Event) => {
    try {
      org_event = await getOrgEventByJoinCode(
        event_id,
        orgJoinFormResponses.org_join_code.toUpperCase(),
      );
    } catch (e) {
      const error: any = e;
      if (error.code === "PGRST116") {
        orgJoinFormErrors["org_join_code"] = "No organization with code";
        return;
      } else {
        error.message = `Error getting org: ${error.message}`;
        handleError(error);
      }
    }
    if (org_event) {
      await updateStudentOrgEvent(
        student_event!.student_event_id,
        org_event.org_id,
      );
      student_event!.org_event = org_event;
    } else {
      throw new Error(
        "An unknown error has occurred. Please email the tournament organizers.",
      );
    }
  };

  async function eventbritePurchase(
    creating_team: boolean,
    joining_team_code: string | null,
  ) {
    const { data: authData, error } = await supabase.auth.getSession();
    if (error != null) {
      handleError(error);
    }
    const token = authData.session?.access_token ?? null;

    return async (data: any) => {
      // TODO: check that data has quantity 1.
      console.log("eventbrite", data);
      let body = {
        event_id,
        host_id: event_details!.host_id,
        token,
        quantity: 1,
        creating_team,
        joining_team_code,
        target_org_id: null,
        eventbrite_order_id: data.orderId,
      };
      const response = await fetch("/api/purchase-eventbrite-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      if (response.ok) {
        document.location.assign(text);
      } else {
        handleError(new Error(text));
      }
    };
  }

  async function openEventbriteWidget(
    creating_team: boolean,
    joining_team_code: string | null,
  ) {
    const eventbriteEventId = event_details?.eventbrite_event_id; // Replace with your actual Eventbrite event ID
    if (eventbriteEventId) {
      // Check if the event ID is valid
      (window as any).EBWidgets.createWidget({
        widgetType: "checkout",
        eventId: eventbriteEventId,
        modal: true,
        modalTriggerElementId: "eventbrite-widget-container",
        iFrameContainerId: "modalTriggerElementId",
        onOrderComplete: await eventbritePurchase(
          creating_team,
          joining_team_code,
        ),
        promoCode: "student",
      });
      (
        document.querySelector("#eventbrite-widget-container") as HTMLElement
      ).click();
    }
  }

  (async () => {
    // Check if this student is registered in this event.
    // NOTE: only student accounts can view this page (because of the student/layout.svelte)
    // Therefore, getStudent always returns non-null.
    student = await getStudent($user!.id)!;
    host = await getHostInformation(host_id);
    student_event = await getStudentEvent($user!.id, event_id);
    ticket_order = await getStudentTicketOrder($user!.id, event_id);
    available_tickets = await getStudentAvailableTickets($user!.id, event_id);
    total_tickets = await getStudentTotalTickets( $user!.id, event_id);
    score_report = await getScoreReportInfo(student_event.student_event_id)
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
    {#if event_details?.reg_frozen}
      <p>
        This event is now closed for registration.
      </p>
    {:else if transaction_stored}
      {#if available_tickets > 0}
        <p>
          Payment found, but registration is not complete. Please fill out the
          following form to proceed.
        </p>
        <br />
      {:else if available_tickets == 0}
        <Alert border color="red">
          <InfoCircleSolid slot="icon" class="w-5 h-5" />
          <span class="font-medium">Your ticket has been refunded.</span>
          <Button
          href={`/student/${$page.params.host_id}/${$page.params.event_id}/request-refund`}
          pill>View Requests</Button
        >
        </Alert>
        <br />
      {/if}
    {/if}
  {/if}

  {#if student_event}
    {#if team || org_event}
      <div class="team_info">
        {#if org_event}
          <h2>{org_event.org.name}</h2>
          <br />
        {/if}

        {#if student_event
          && (event_details?.waivers as {[key: string]: Json})?.type
          && (event_details?.waivers as {[key: string]: Json})?.type != "none" && !student_event.waiver}
          <Alert border color="red">
            <InfoCircleSolid slot="icon" class="w-5 h-5" />
            <span class="font-medium">Sign Your Waiver!</span>
            Your registration is not complete until you sign it.
            {#if event_details.waivers?.type == "external"}
              <br />
              Instructions: {event_details.waivers?.instructions}
            {:else}
              Click <a href="/student/{host_id}/{event_id}/waiver">here</a> to sign
              the waiver
            {/if}
          </Alert>
          <br />
        {/if}

        {#if !team}
          <Alert border color="red">
            <InfoCircleSolid slot="icon" class="w-5 h-5" />
            <span class="font-medium">Not assigned to a team!</span>
            Your registration is not complete until you are assigned to a team -
            reach out to your coach to assign you to a team.
          </Alert>
        {:else}
          {#if !event_details.waivers?.requireWaivers || event_details.waivers?.type == "none" || student_event.waiver}            
            <div class="flex">
              <Button
                href={`/student/${$page.params.host_id}/${$page.params.event_id}/tests`}
                pill>Take Tests</Button
              >
              {#if score_report?.visible && !score_report?.disqualified}
                <Button
                  href={"https://google.com"}
                  pill>Download Score Report</Button
                >
              {/if}
              <div class="ml-2">
                <AddOnButton 
                  event_id={event_id} 
                  host_id={host_id} 
                  student_event_id={student_event?.student_event_id} 
                  buttonLabel="Purchase Add-ons"
                />
              </div>
            </div>
            <br />
          {/if}
          <div class="teamContainer">
            <StudentTeam
              {event_id}
              {host_id}
              org_id={team?.org_id}
              team={{
                ...team,
                teamMembers: team?.student_event?.map(
                  (member: StudentEvent) => ({
                    ...member,
                    person: member.student,
                  }),
                ),
              }}
              showTeamCode={org_event ? false : true}
              waiverType={event_details?.waivers?.type ?? "none"}
              editableFeatures={false}
              user={student}
              {event_details}
              onDrop={() => {}}
              onDragStart={() => {}}
              onDeleteStudent={() => {}}
              handleDragOver={() => {}}
              handleDragLeave={() => {}}
              maxTeamSize={event_details?.max_team_size}
              handleDeleteTeam={() => {}}
            />
          </div>
        {/if}
      </div>
    {:else if available_tickets == 0 && total_tickets > 0}
      <Alert border color="red">
        <InfoCircleSolid slot="icon" class="w-5 h-5" />
        <span class="font-medium">Your ticket has been refunded.</span>
        <Button
        href={`/student/${$page.params.host_id}/${$page.params.event_id}/request-refund`}
        pill>View Requests</Button
      >
      </Alert>
    {:else}
      <br /><br />
      <div class="registrationForm">
        <Tabs tabStyle="pill">
          <TabItem
            onclick={() => (selectedOption = "join_org")}
            open={selectedOption === "join_org"}
            title="Join Organization"
            divClass="bg-[var(--background)]"
            style="border: 2px solid var(--primary); padding: 10px 16px;"
          >
            <h2>Join Organization</h2>
            <p>
              Get your organization join code from your organization's coach.
            </p>
            <p>
              <em>
                If you are registering as an individual, or want to create a
                team independent of an organization (without a coach), please
                <strong>create an independent team</strong> instead.
              </em>
            </p>
            <CustomForm
              fields={[
                {
                  event_custom_field_id: "org_join_code",
                  key: "org_join_code",
                  label: "Organization Join Code",
                  required: true,
                  regex: /^O-[A-Z0-9]{6}$/,
                  placeholder: "O-ABC123",
                  regex_error_message: "Organization join code must be in the format O-ABC123 (all uppercase)",
                  value: null,
                  choices: null,
                  editable: true,
                  hidden: false,
                },
              ]}
              custom_fields={[]}
              bind:newResponses={orgJoinFormResponses}
              bind:validationErrors={orgJoinFormErrors}
              handleSubmit={orgJoinSubmit}
            />
          </TabItem>
          {#if event_details?.event_id !== 12}
            <TabItem
              onclick={() => (selectedOption = "join_team")}
              open={selectedOption === "join_team"}
              title="Join Independent Team"
              divClass="bg-[var(--background)]"
              style="border: 2px solid var(--primary); padding: 10px 16px;"
            >
              <h2>Join Independent Team</h2>
              <p>Get the code from an already registered team member.</p>
              <CustomForm
                fields={[
                  {
                    event_custom_field_id: "team_join_code",
                    key: "team_join_code",
                    name: "team_join_code",
                    label: "Team Join Code",
                    required: true,
                    regex: /^T-[A-Z0-9]{6}$/,
                    regex_error_message: "Team join code must be in the format T-ABC123 (all uppercase)",
                    placeholder: "T-ABC123",
                    value: null,
                    choices: null,
                    editable: true,
                    hidden: false,
                  },
                ]}
                custom_fields={[]}
                bind:newResponses={teamJoinFormResponses}
                bind:validationErrors={teamJoinFormErrors}
                handleSubmit={() => {
                  if (
                    event_details?.eventbrite_event_id &&
                    !transaction_stored
                  ) {
                    openEventbriteWidget(
                      false,
                      teamJoinFormResponses["team_join_code"],
                    );
                  } else {
                    document.location.assign(
                      `/student/${$page.params.host_id}/${$page.params.event_id}/join-team/${teamJoinFormResponses["team_join_code"]}`,
                    );
                  }
                }}
              />
              <div id="eventbrite-widget-container"></div>
            </TabItem>
          {/if}
          <TabItem
            onclick={() => (selectedOption = "create_team")}
            open={selectedOption === "create_team"}
            title="Create Independent Team"
            divClass="bg-[var(--background)]"
            style="border: 2px solid var(--primary); padding: 10px 16px;"
          >
            <h2>Create Independent Team</h2>
            <p>
              If you're an individual, or you want to create a team independent of an org, then create an independent team.
            </p>
            <p>
              <em>
                If you want to register as part of an organization with a coach,
                please <strong>create an organization</strong> instead.
              </em>
            </p>
            <br />
            <div class="flex">
              <Button
                on:click={() => {
                  if (
                    event_details?.eventbrite_event_id &&
                    !transaction_stored
                  ) {
                    openEventbriteWidget(true, null);
                  } else {
                    document.location.assign(
                      `/student/${$page.params.host_id}/${$page.params.event_id}/create-team`,
                    );
                  }
                }}
                pill
              >
                Create Team!
              </Button>
            </div>
            <div id="eventbrite-widget-container"></div>
          </TabItem>
        </Tabs>
        <br />
      </div>
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

  <hr />

  {#if !event_details?.reg_frozen}
    <StudentForm
      bind:student_event
      user={{ ...student, ...$user }}
      {event_id}
      editing={student_event ? true : false}
      afterSubmit={() => {
        let org_join_code = $page.url.searchParams.get("org_join_code");
        if (org_join_code) {
          document.location.assign(
            `/student/${$page.params.host_id}/${$page.params.event_id}/join-org/${org_join_code}`,
          );
        }
      
        let team_join_code = $page.url.searchParams.get("team_join_code");
        if (team_join_code) {
          document.location.assign(
            `/student/${$page.params.host_id}/${$page.params.event_id}/join-team/${team_join_code}`,
          );
        }
      }}
    />
  {/if}
  {#if student_event && !org_event}
  <Button
          href={`/student/${$page.params.host_id}/${$page.params.event_id}/request-refund`}
          pill>Request Refund</Button
        >
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
