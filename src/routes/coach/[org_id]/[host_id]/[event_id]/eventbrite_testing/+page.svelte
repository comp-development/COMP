<script lang="ts">

    const loadExternalScript = () => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = "https://www.eventbrite.com/static/widgets/eb_widgets.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load script'));
        document.head.appendChild(script);
      });
    };
  
    // Once the script is loaded, create the widget
    loadExternalScript().then(() => {
      window.EBWidgets.createWidget({
        widgetType: 'checkout',
        eventId: '52766401728',
        modal: true,
        modalTriggerElementId: 'example-widget-trigger',
        onOrderComplete: () => {
          console.log('Order complete!');
        },
      });
    }).catch(console.error);
    import { page } from "$app/stores";
    import Loading from "$lib/components/Loading.svelte";
    import { user } from "$lib/sessionStore";
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
    } from "$lib/supabase";
    import { Button, ButtonGroup, Modal, Timeline, TimelineItem } from "flowbite-svelte";
    import type { Tables } from "../../../../../../db/database.types";
    import { CartSolid, UsersGroupSolid, CalendarWeekSolid, CheckCircleSolid, ClockSolid, CloseCircleSolid } from "flowbite-svelte-icons";
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
  
    var exampleCallback = function () {
        console.log('Order complete!');
    };
  
    window.EBWidgets.createWidget({
        widgetType: 'checkout',
        eventId: '52766401728',
        modal: true,
        modalTriggerElementId: 'example-widget-trigger',
        onOrderComplete: exampleCallback,
    });
  
    let loading = $state(true);
    let coach: any = $state();
    let organizationDetails: any = $state();
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
  
    let isEventbrite = $state({})
  
    let showDeleteTeamConfirmation = $state(false);
    let deleteTeamId = $state(null);
  
    let stepNumber = $state(0);
  
    let host: any = $state();
    const host_id = parseInt($page.params.host_id);
  
    (async () => {
      host = await getHostInformation(host_id);
      event_details = await getEventInformation(event_id);
  
      coach = await getCoach($user!.id);
      organizationDetails = await getCoachOrganization(
        coach.coach_id,
        event_id,
        org_id,
      );
  
      console.log("ORG", organizationDetails);
      ticketCount = await getTicketCount(event_id, org_id);
  
      studentsWithoutTeams = await getStudentsWithoutTeam(event_id, org_id);
  
      loading = false;
    })();
  
    function handleDragStart(event: DragEvent, team_member: any) {
      if (event.dataTransfer) {
        draggedMember = team_member;
        sourceTeamId = team_member.team_id;
        event.dataTransfer.setData("text/plain", JSON.stringify(team_member));
      }
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
  
    async function handleDrop(event: DragEvent, targetTeam: any | null) {
      console.log("DROP", draggedMember, sourceTeamId, targetTeam);
      try {
        event.preventDefault();
        if (event.currentTarget instanceof HTMLElement) {
          event.currentTarget.style.backgroundColor = "";
        }
  
        // Early return if dragging to same team
        console.log(sourceTeamId, targetTeam?.team_id);
        if ((sourceTeamId && targetTeam?.team_id === sourceTeamId) || (!targetTeam && !sourceTeamId)) return;
        if (!draggedMember) return;
  
        if (targetTeam === null) {
          // Scenario A: Moving to unassigned category
          await updateStudentTeam(draggedMember.student_event_id, null, org_id);
  
          // Remove from current team
          organizationDetails = {
            ...organizationDetails,
            teams: organizationDetails.teams.map((team: any) => {
              if (team.team_id === sourceTeamId) {
                return {
                  ...team,
                  teamMembers: team.teamMembers.filter(
                    (member: any) =>
                      member.student_event_id !== draggedMember.student_event_id,
                  ),
                };
              }
              return team;
            }),
          };
  
          const updatedMember = {
            ...draggedMember,
            team_id: null,
          };
  
          // Add to unassigned students
          studentsWithoutTeams = [...studentsWithoutTeams, updatedMember];
  
          console.log(
            `Moving ${draggedMember.person.first_name} to unassigned students`,
          );
        } else if (sourceTeamId) {
          // Scenario B: Moving between teams
          await updateStudentTeam(
            draggedMember.student_event_id,
            targetTeam.team_id,
            org_id,
          );
  
          organizationDetails = {
            ...organizationDetails,
            teams: organizationDetails.teams.map((team: any) => {
              if (team.team_id === sourceTeamId) {
                // Remove from source team
                return {
                  ...team,
                  teamMembers: team.teamMembers.filter(
                    (member: any) =>
                      member.student_event_id !== draggedMember.student_event_id,
                  ),
                };
              }
              if (team.team_id === targetTeam.team_id) {
                // Add to target team
                const updatedMember = {
                  ...draggedMember,
                  team_id: targetTeam.team_id,
                };
                return {
                  ...team,
                  teamMembers: [...team.teamMembers, updatedMember],
                };
              }
              return team;
            }),
          };
  
          console.log(
            `Moving ${draggedMember.person.first_name} to team ${targetTeam.team_name}`,
          );
        } else {
          // Scenario C: Moving from unassigned to team
          await updateStudentTeam(
            draggedMember.student_event_id,
            targetTeam.team_id,
            org_id,
          );
  
          // Remove from unassigned students
          studentsWithoutTeams = studentsWithoutTeams.filter(
            (student) =>
              student.student_event_id !== draggedMember.student_event_id,
          );
  
          // Add to target team
          organizationDetails = {
            ...organizationDetails,
            teams: organizationDetails.teams.map((team: any) => {
              if (team.team_id === targetTeam.team_id) {
                const updatedMember = {
                  ...draggedMember,
                  team_id: targetTeam.team_id,
                };
                return {
                  ...team,
                  teamMembers: [...team.teamMembers, updatedMember],
                };
              }
              return team;
            }),
          };
  
          console.log(
            `Moving ${draggedMember.person.first_name} to team ${targetTeam.team_name}`,
          );
        }
      } catch (e) {
        handleError(e);
      } finally {
        // Reset the drag state
        draggedMember = null;
        sourceTeamId = null;
        console.log("DROP_FINISH", sourceTeamId, draggedMember);
      }
    }
  
    function openEditModal(team: any) {
      teamName = team.team_name;
      editingTeamId = team.team_id;
      isTeamModalOpen = true;
    }
  
    function openAddModal() {
      teamName = "";
      editingTeamId = null;
      isTeamModalOpen = true;
    }
    function openPurchaseModal() {
      ticketQuantity = 0;
      isPurchaseModalOpen = true;
    }
  
    function handleDragOver(event: DragEvent) {
      event.preventDefault();
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
      }
    }
  
    function handleDragLeave(event: DragEvent) {
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.style.backgroundColor = "";
      }
    }
  
    async function purchase_ticket(quantity: number) {
      const { data, error } = await supabase.auth.getSession();
      if (error != null) {
        handleError(error);
      }
      const token = data.session?.access_token ?? null;
  
      let body = {
        event_id,
        token,
        quantity,
        creating_team: false,
        joining_team_code: null,
        target_org_id: org_id,
        is_coach: true,
        host_id,
      };
      const response = await fetch("/api/purchase-ticket", {
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
    }
  
    async function handleChangeTeam(newTeamData) {
      try {
        let newOrganizationDetails = { ...organizationDetails };
  
        if (editingTeamId) {
          // Update the existing team
          newOrganizationDetails = {
            ...newOrganizationDetails,
            teams: newOrganizationDetails.teams.map((team) => {
              if (team.team_id === newTeamData.team_id) {
                return { ...team, team_name: newTeamData.team_name };
              }
              return team;
            }),
          };
          toast.success("Team updated successfully");
        } else {
          // Add a new team
          newOrganizationDetails = {
            ...newOrganizationDetails,
            teams: [
              ...newOrganizationDetails.teams,
              {
                ...newTeamData,
                teamMembers: [],
              },
            ],
          };
          toast.success("Team added successfully");
        }
  
        organizationDetails = newOrganizationDetails;
  
        // Close the modal and reset the input
        isTeamModalOpen = false;
        teamName = "";
        editingTeamId = null;
      } catch (error) {
        handleError(error);
      }
    }
  
    async function handleDeletingStudent(student) {
      try {
        await removeStudentFromOrganization(student.student_event_id);
  
        studentsWithoutTeams = studentsWithoutTeams.filter(
          (s) => s.student_event_id !== student.student_event_id,
        );
  
        toast.success(
          `${student.person.first_name} has been removed from the organization`,
        );
      } catch (e) {
        handleError(e);
      }
    }
  
    async function handleDeleteTeam() {
      try {
        const teamToDelete = organizationDetails.teams.find(
          (t) => t.team_id === deleteTeamId,
        );
  
        if (teamToDelete?.teamMembers && teamToDelete.teamMembers.length > 0) {
          studentsWithoutTeams = [
            ...studentsWithoutTeams,
            ...teamToDelete.teamMembers,
          ];
        }
  
        await deleteTeam(deleteTeamId);
  
        organizationDetails = {
          ...organizationDetails,
          teams: organizationDetails.teams.filter(
            (t: any) => t.team_id !== deleteTeamId,
          ),
        };
  
        toast.success("Team deleted successfully");
        showDeleteTeamConfirmation = false;
        deleteTeamId = null;
      } catch (error) {
        handleError(error);
      }
    }
  
    async function handleDeleteStudentTeam(e, student) {
      try {
        e.preventDefault();
  
        await deleteStudentTeam(student.student_event_id);
  
        let newOrganizationDetails = { ...organizationDetails };
        newOrganizationDetails = {
          ...newOrganizationDetails,
          teams: newOrganizationDetails.teams.map((team: any) => {
            return {
              ...team,
              teamMembers: team.teamMembers.filter(
                (member: any) =>
                  member.student_event_id !== student.student_event_id,
              ),
            };
          }),
        };
        organizationDetails = newOrganizationDetails;
  
        studentsWithoutTeams.push(student);
  
        toast.success("Student deleted successfully");
      } catch (error) {
        handleError(error);
      }
    }
  </script>
  
  {#if loading}
    <Loading />
  {:else}
    <EventDisplay
      id={event_id}
      host={host}
      event={event_details}
      editable={true}
    />
    <hr /><br><br>
    
    <div class="flex justify-center">
      <div class="mx-10">
        <Timeline order="horizontal">
          {#each [
            { title: "Register", step: 1, description: "Fill out the registration form below." },
            { title: "Add Teams", step: 2, description: "Click the 'Create Team' button to make your first team!" },
            { title: "Purchase Tickets", step: 3, description: "Buy your first ticket(s) by clicking the 'Purchase Tickets' button. Each ticket is valid for one student." },
            { title: "Invite Students", step: 4, description: "Have your students join your organization by having them create a student account and sending them the join code. You can also send them the team join code." },
            { title: "Assign Students", step: 5, description: "Once students have joined your organization, assign them onto teams. You can do this by clicking and dragging students from the 'Unassigned Students' section into one of your teams!" },
            { title: "Done!", step: 6, description: null }
          ] as { title, step, description }}
          <div style="max-width: 500px; margin: 0 auto;">
            <TimelineItem title={title} classLi="text-left mx-2" classH3="text-left">
                <svelte:fragment slot="icon">
                  <div class="flex items-center justify-center">
                    <div class="flex z-10 justify-center items-center w-6 h-6 
                      {step < stepNumber || stepNumber === 6 ? 'bg-primary-200 rounded-full border border-gray-900' : step === stepNumber ? 'rounded-full bg-primary-200 border border-gray-900' : 'rounded-full border border-gray-900 bg-gray-200'} ">
                      {#if step < stepNumber || stepNumber === 6}
                        <CheckCircleSolid class="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      {:else if step === stepNumber}
                        <div class="w-3 h-3" style="background-color: var(--background); border-radius: 50%;"></div>
                      {/if}
                    </div>
                    {#if step < 6}
                      <div class="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700 -mx-4"></div>
                    {/if}
                  </div>
                </svelte:fragment>
                  {#if step === stepNumber && description}
                    <div class="border-box">
                      <p class="text-base font-normal text-gray-500 dark:text-gray-400 text-left">
                        {description}
                      </p>
                    </div>
                  {/if}
            </TimelineItem>
          </div>
          {/each}
        </Timeline>
      </div>
    </div>
    <br>
    <hr>
  
    {#if organizationDetails.event}
      
      <div class="organization">
        <div class="flex">
          <InfoToolTip
            text="Send this code to your students and they will be able to join this organization"
          />
          <CopyText text={organizationDetails.event.join_code} />
        </div>
  
        <div style="margin: 10px 0;">
          <ButtonGroup>
            <Button pill outline color="primary" onclick={openAddModal}>
              <UsersGroupSolid class="w-4 h-4 me-2" />
              Add Team
            </Button>
            <Button pill outline color="primary" onclick={openPurchaseModal}>
              <CartSolid class="w-4 h-4 me-2" />
              Purchase Tickets ({ticketCount} bought)
            </Button>
          </ButtonGroup>
        </div>
  
        <button id="example-widget-trigger" type="button">Buy Tickets</button>
        
  
        <div class="grid-container">
          <div class="teams-grid">
            {#each organizationDetails.teams as team}
              <StudentTeam
                {event_id}
                {org_id}
                {team}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onDeleteStudent={handleDeleteStudentTeam}
                {openEditModal}
                {handleDeleteTeam}
                {handleDragOver}
                {handleDragLeave}
                maxTeamSize={event_details?.max_team_size}
                bind:organizationDetails
                bind:studentsWithoutTeams
                bind:showDeleteTeamConfirmation
                bind:deleteTeamId
              />
            {/each}
          </div>
          <div
            class="border-box"
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            ondrop={(e) => handleDrop(e, null)}
          >
            <h3 class="text-xl font-semibold mb-4 flex">
              <InfoToolTip
                text="These students are a part of your organization but do not have a team. Drag over these students to one of them boxes to add them"
              />
              Unassigned Students
            </h3>
            {#each studentsWithoutTeams as student}
              <DraggableStudent
                team_member={student}
                onDragStart={handleDragStart}
                onDeleteStudent={() => {
                  handleDeletingStudent(student);
                }}
              />
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <OrgForm
        title="Registration Form"
        bind:org={organizationDetails}
        {event_id}
        {org_id}
      />
    {/if}
  {/if}
  
  <div class="modalExterior">
    <Modal bind:open={isTeamModalOpen} size="md" autoclose={false}>
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">
        {editingTeamId ? "Edit Team" : "Add a New Team"}
      </h3>
      <TeamForm
        title=""
        {event_id}
        {org_id}
        team={editingTeamId
          ? organizationDetails.teams.find((t) => t.team_id === editingTeamId)
          : null}
        afterSubmit={async (team) => {
          await handleChangeTeam(team);
        }}
      />
    </Modal>
  </div>
  <br />
  <br />
  
  <div class="modalExterior">
    <Modal bind:open={isPurchaseModalOpen} size="md" autoclose={false}>
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">
        Purchase Tickets
      </h3>
      <CustomForm
        fields={[
          {
            name: "quantity",
            label: "Quantity",
            required: true,
            regex: /^\d+$/,
            editable: true,
            value: 1,
          },
        ]}
        bind:newResponses
        handleSubmit={async (_: any) => {
          await purchase_ticket((newResponses as any)["quantity"]);
        }}
      />
    </Modal>
  </div>
  
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
  
    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      grid-auto-rows: min-content;
      gap: 20px;
    }
  
    .border-box {
      padding: 20px;
      border-radius: 15px;
      border: 2px solid var(--primary-tint);
    }
  </style>
  