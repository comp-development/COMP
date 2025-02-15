<script lang="ts">
  import {
    Navbar,
    NavBrand,
    NavLi,
    NavUl,
    NavHamburger,
    Dropdown,
    DropdownItem,
    Button,
  } from "flowbite-svelte";
  import {
    BuildingSolid,
    CalendarWeekSolid,
    ChevronDownOutline,
    CodeForkSolid,
  } from "flowbite-svelte-icons";
  import { page } from "$app/stores";
  import {
    getAllHostEvents,
    getAllHosts,
    getCoachOrganizations,
    signOut,
    getAdminHosts,
    getCoachHosts,
    getStudentHosts,
    getCoachHostEvents,
    getStudentHostEvents,
  } from "$lib/supabase";
  import { user } from "$lib/sessionStore";
  import { handleError } from "$lib/handleError";

  let hostId: number | null = null;
  let eventId: number | null = null;
  let orgId: number | null = null;

  let hosts = [];
  let events = [];
  let organizations = [];
  let paths = [];

  let selectedOrg = null;
  let selectedHost = null;
  let selectedEvent = null;

  const adminFeatures = [
    { name: "Users", href: "/admin/users" },
    { name: "Import Problems", href: "/admin/import-problems" },
    { name: "New Problem", href: "/admin/problems/new" },
  ];

  async function initializeNavbar() {
    paths = $page.route.id?.split("/").filter(Boolean);

    const allHosts = await getAllHosts();
    let allEvents;

    if (paths[0] === "admin") {
      hosts = await getAdminHosts($user!.id);
    } else if (paths[0] === "student") {
      hosts = await getStudentHosts($user!.id);
    } else if (paths[0] === "coach") {
      organizations = await getCoachOrganizations($user.id);

      if ($page.params.org_id) {
        orgId = parseInt($page.params.org_id);
        selectedOrg = organizations.find((o) => o.org_id === orgId)?.orgs;

        hosts = await getCoachHosts(orgId);
      }

      if ($page.params.host_id) {
        hostId = parseInt($page.params.host_id);
        selectedHost = allHosts.find((h) => h.host_id === hostId);

        let data = await getCoachHostEvents($user!.id, hostId, orgId);
        events = data.map((e) => e.event);
      }
    }

    if ($page.params.host_id) {
      hostId = parseInt($page.params.host_id);
      selectedHost = allHosts.find((h) => h.host_id === hostId);
      allEvents = await getAllHostEvents(hostId);

      if (paths[0] === "student") {
        events = await getStudentHostEvents($user!.id, hostId);
      } else if (paths[0] === "admin") {
        events = allEvents;
      }
    }

    if ($page.params.event_id) {
      eventId = parseInt($page.params.event_id);
      selectedEvent = allEvents.find((e) => e.event_id === eventId);
    }
  }

  $: $page.route.id && initializeNavbar();

  const handleSignout = async (e) => {
    e.preventDefault();
    try {
      await signOut();
    } catch (error) {
      handleError(error);
    }
  };
</script>

<div style="background-color: var(--primary-dark);">
  <Navbar rounded color="transparent">
    <NavBrand href="/">
      <img src="/favicon.png" class="me-3 h-10 sm:h-9 logo" alt="COMP Logo" />
    </NavBrand>
    <div class="md:order-2">
      <Button size="sm" onclick={handleSignout} pill color="primary"
        >Sign Out</Button
      >
      <NavHamburger />
    </div>
    <NavUl>
      {#if $page.route.id?.includes("/coach")}
        <NavLi class="cursor-pointer">
          <BuildingSolid class="h-6 text-primary-800 dark:text-white inline" />
          {#if selectedOrg}{selectedOrg.name}{:else}Choose Organization{/if}
          <ChevronDownOutline
            class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
          />
        </NavLi>
        <Dropdown class="w-44 z-20">
          {#each organizations as org}
            <DropdownItem
              class={orgId === org.org_id ? "active" : ""}
              on:click={() => {
                window.location.href = `/coach/${org.org_id}`;
              }}
            >
              {org.orgs.name}
            </DropdownItem>
          {/each}
        </Dropdown>

        {#if orgId}
          <NavLi class="cursor-pointer">
            <CodeForkSolid
              class="h-6 text-primary-800 dark:text-white inline"
            />
            {#if selectedHost}{selectedHost.host_name}{:else}Choose Host{/if}
            <ChevronDownOutline
              class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
            />
          </NavLi>
          <Dropdown class="w-44 z-20">
            {#each hosts as host}
              <DropdownItem
                class={hostId === host.host_id ? "active" : ""}
                on:click={() => {
                  window.location.href = `/coach/${orgId}/${host.host_id}`;
                }}
              >
                {host.host_name}
              </DropdownItem>
            {/each}
          </Dropdown>

          {#if hostId}
            <NavLi class="cursor-pointer">
              <CalendarWeekSolid
                class="h-6 text-primary-800 dark:text-white inline"
              />
              {#if selectedEvent}{selectedEvent.event_name}{:else}Choose Event{/if}
              <ChevronDownOutline
                class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
              />
            </NavLi>
            <Dropdown class="w-44 z-20">
              {#each events as event}
                <DropdownItem
                  class={eventId === event.event_id ? "active" : ""}
                  on:click={() => {
                    window.location.href = `/coach/${orgId}/${hostId}/${event.event_id}`;
                  }}
                >
                  {event.event_name}
                </DropdownItem>
              {/each}
            </Dropdown>
          {/if}
        {/if}
      {:else if $page.route.id?.includes("/student")}
        <NavLi class="cursor-pointer">
          <CodeForkSolid class="h-6 text-primary-800 dark:text-white inline" />
          {#if selectedHost}{selectedHost.host_name}{:else}Choose Host{/if}
          <ChevronDownOutline
            class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
          />
        </NavLi>
        <Dropdown class="w-44 z-20">
          {#each hosts as host}
            <DropdownItem
              class={hostId === host.host_id ? "active" : ""}
              on:click={() => {
                window.location.href = `/student/${host.host_id}`;
              }}
            >
              {host.host_name}
            </DropdownItem>
          {/each}
        </Dropdown>

        {#if hostId}
          <NavLi class="cursor-pointer">
            <CalendarWeekSolid
              class="h-6 text-primary-800 dark:text-white inline"
            />
            {#if selectedEvent}{selectedEvent.event_name}{:else}Choose Event{/if}
            <ChevronDownOutline
              class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
            />
          </NavLi>
          <Dropdown class="w-44 z-20">
            {#each events as event}
              <DropdownItem
                class={eventId === event.event_id ? "active" : ""}
                on:click={() => {
                  window.location.href = `/student/${hostId}/${event.event_id}`;
                }}
              >
                {event.event_name}
              </DropdownItem>
            {/each}
          </Dropdown>
          {#if eventId && false}
            <NavLi
              class="cursor-pointer {paths[3] === 'tests' ? '' : 'non-active'}"
              href="/student/{hostId}/{eventId}/tests">Tests</NavLi
            >
          {/if}
        {/if}
      {:else}
        <NavLi class="cursor-pointer">
          Admin Features
          <ChevronDownOutline
            class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
          />
        </NavLi>
        <Dropdown class="w-44 z-20">
          {#each adminFeatures as feature}
            <DropdownItem
              on:click={() => {
                window.location.href = feature.href;
              }}
              class={$page.route.id?.includes(feature.href) ? "active" : ""}
            >
              {feature.name}
            </DropdownItem>
          {/each}
        </Dropdown>

        <NavLi class="cursor-pointer">
          <CodeForkSolid class="h-6 text-primary-800 dark:text-white inline" />
          {#if selectedHost}{selectedHost.host_name}{:else}Choose Host{/if}
          <ChevronDownOutline
            class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
          />
        </NavLi>
        <Dropdown class="w-44 z-20">
          {#each hosts as host}
            <DropdownItem
              class={hostId === host.host_id ? "active" : ""}
              on:click={() => {
                window.location.href = `/admin/${host.host_id}`;
              }}
            >
              {host.host_name}
            </DropdownItem>
          {/each}
        </Dropdown>

        {#if hostId}
          <NavLi class="cursor-pointer">
            <CalendarWeekSolid
              class="h-6 text-primary-800 dark:text-white inline"
            />
            {#if selectedEvent}{selectedEvent.event_name}{:else}Choose Event{/if}
            <ChevronDownOutline
              class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
            />
          </NavLi>
          <Dropdown class="w-44 z-20">
            {#each events as event}
              <DropdownItem
                class={eventId == event.event_id ? "active" : ""}
                on:click={() => {
                  window.location.href = `/admin/${hostId}/${event.event_id}`;
                }}
              >
                {event.event_name}
              </DropdownItem>
            {/each}
          </Dropdown>
          {#if eventId}
            <NavLi
              class="cursor-pointer navli {$page.route.id?.includes('/tests')
                ? 'active'
                : ''}"
              href="/admin/{hostId}/{eventId}/tests">Tests</NavLi
            >
            <NavLi
              class="cursor-pointer navli {$page.route.id?.includes(
                '/registration',
              )
                ? 'active'
                : ''}"
              href="/admin/{hostId}/{eventId}/registration">Registration</NavLi
            >
          {/if}
        {/if}
      {/if}
    </NavUl>
  </Navbar>
</div>

<style>
  :global(nav div.flex) {
    justify-content: space-between;
    margin: 0;
    min-width: 100% !important;
  }

  :global(.cursor-pointer) {
    padding: 2px 10px;
    background-color: white;
  }

  .logo {
    background-color: black;
    border-radius: 50px;
  }

  :global([role="link"]:hover) {
    background-color: rgb(221, 221, 221) !important;
  }

  :global(.active) {
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 4px;
  }

  :global(.navli) {
    background-color: transparent;
    color: white;
  }
</style>
