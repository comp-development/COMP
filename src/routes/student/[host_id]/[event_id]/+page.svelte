<script lang="ts">
  import { page } from "$app/stores";
  import { Button, Badge, Tabs, TabItem } from "flowbite-svelte";
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
    getTeamByJoinCode,
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
  let ticket_order: Tables<"ticket_orders"> | null = null;
  let transaction_stored = $state(false);
  let loading = $state(true);
  let student: Student = $state(null);
  let teamJoinFormResponses: any = $state({});
  let teamJoinFormErrors: any = $state({});
  let orgJoinFormResponses: any = $state({});
  let orgJoinFormErrors: any = $state({});
  let selectedOption: "join_org" | "join_team" | "create_team" =
    $state("join_org");

  const afterTeamSubmit = async () => {
    // If this callback is called, then the student must've been in the event => student_event is non-null.
    // Also, we assume the TeamForm component created a team => team is not null.
    await updateStudentTeam(
      student_event!.student_event_id,
      team!.team_id,
      team!.org_id,
    );
    student_event!.team = team!;
  };

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
      console.log("eventbrite", data)
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
        onOrderComplete: await eventbritePurchase(creating_team, joining_team_code),
      });
      (document.querySelector("#eventbrite-widget-container") as HTMLElement).click();
      // setTimeout(async () => {
      //    (window as any).EBWidgets.createWidget({
      //     widgetType: "checkout",
      //     eventId: eventbriteEventId,
      //     modal: true,
      //     modalTriggerElementId: "eventbrite-widget-container",
      //     iFrameContainerId: "modalTriggerElementId",
      //     onOrderComplete: await eventbritePurchase(creating_team, joining_team_code),
      //   });
        
      // }, 1000)
    }
  }

  (async () => {
    // Check if this student is registered in this event.
    // NOTE: only student accounts can view this page (because of the student/layout.svelte)
    // Therefore, getStudent always returns non-null.
    student = await getStudent($user!.id)!;
    student_event = await getStudentEvent($user!.id, event_id);
    ticket_order = await getStudentTicketOrder($user!.id, event_id);
    transaction_stored = ticket_order != null;
    team = student_event?.team;
    org_event = student_event?.org_event;
    team?.student_event.sort((a, b) => {
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
  <script src="https://www.eventbrite.com/static/widgets/eb_widgets.js"></script>
  <EventDisplay
    name={event_details?.event_name}
    date={event_details?.event_date}
    logo={event_details?.logo && event_details?.logo != ""
      ? event_details?.logo
      : event_details?.host.logo}
    email={event_details?.email ?? event_details?.host.email}
    markdown={event_details?.summary}
  />
  {#if !student_event}
    {#if transaction_stored}
      <p>
        Payment found, but registration is not complete. Please fill out the
        following form to proceed.
      </p>
      <br />
    {/if}
  {/if}

  {#if student_event}
    {#if team || org_event}
      <div class="team_info">
        {#if org_event}
          <h2>{org_event.org.name}</h2>
          <br />
        {:else}
          <CopyText text={team?.join_code} />
        {/if}

        {#if !team}
          <Alert border color="red">
            <InfoCircleSolid slot="icon" class="w-5 h-5" />
            <span class="font-medium">Not assigned to a team!</span>
            You cannot take tests until you are assigned to a team - reach out to
            your coach if you believe this is in error.
          </Alert>
        {:else}
          <div class="flex">
            <Button
              href={`/student/${$page.params.host_id}/${$page.params.event_id}/tests`}
              pill>Take Tests</Button
            >
          </div>
          <br />
        {/if}

        <div class="teamContainer">
          <StudentTeam
            {event_id}
            org_id={team?.org_id}
            team={{
              ...team,
              teamMembers: team?.student_event?.map((member) => ({
                ...member,
                person: member.student,
              })),
            }}
            editableFeatures={false}
            onDrop={() => {}}
            onDragStart={() => {}}
            onDeleteStudent={() => {}}
            openEditModal={() => {}}
            handleDragOver={() => {}}
            handleDragLeave={() => {}}
            maxTeamSize={event_details?.max_team_size}
            handleDeleteTeam={() => {}}
          />
        </div>
      </div>
    {:else}
      <div class="registrationForm">
        <Tabs tabStyle="pill">
          <TabItem
            on:click={() => (selectedOption = "join_org")}
            open={selectedOption === "join_org"}
            title="Join Organization"
          >
            <h2>Join Organization</h2>
            <p>
              Get your organization join code from your organization's coach.
            </p>
            <CustomForm
              fields={[
                {
                  event_custom_field_id: "org_join_code",
                  key: "org_join_code",
                  label: "Organization Join Code",
                  required: true,
                  regex: /^[A-Za-z0-9]{6}$/,
                  placeholder: "ABC123",
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
          <TabItem
            on:click={() => (selectedOption = "join_team")}
            open={selectedOption === "join_team"}
            title="Join Team"
          >
            <h2>Join Team</h2>
            <p>
              Get the code from your coach if you're a part of an org, or an
              already registered team member for independent teams.
            </p>
            <CustomForm
              fields={[
                {
                  event_custom_field_id: "team_join_code",
                  key: "team_join_code",
                  name: "team_join_code",
                  label: "Team Join Code",
                  required: true,
                  regex: /^[A-Za-z0-9]{6}$/,
                  placeholder: "ABC123",
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
                if (event_details?.eventbrite_event_id && !transaction_stored) {
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
          <TabItem
            on:click={() => (selectedOption = "create_team")}
            open={selectedOption === "create_team"}
            title="Create Independent Team"
          >
            <div class="flex">
              <Button
                on:click={()=> {
                  if (event_details?.eventbrite_event_id && !transaction_stored) {
                  console.log("hi")
                    openEventbriteWidget(
                      true,
                      null,
                    );
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
  <StudentForm
    title={student_event ? "Update Registration" : "Register"}
    bind:student_event
    user={{ ...student, ...$user }}
    {event_id}
  />
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
