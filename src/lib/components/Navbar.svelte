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
    import { page } from "$app/state";
    import { onMount } from "svelte";
    import {
        getAllHosts,
        getHostEvents,
        getCoachOrganizations,
        getStudentHostEvents,
        signOut,
        getAllPublicHosts,
    } from "$lib/supabase";
    import { user } from "$lib/sessionStore";
    import { handleError } from "$lib/handleError";

    const activeUrl = page.url.pathname;
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
        { name: "Events", href: "/admin/events" },
        { name: "Import Problems", href: "/admin/import-problems" },
        { name: "Problems", href: "/admin/problems" },
        { name: "New Problem", href: "/admin/problems/new" },
        { name: "Registration", href: "/admin/registration" },
    ];


    onMount(async () => {
        paths = activeUrl.split("/").filter(Boolean);

        if (paths[0] === "admin") {
            hosts = await getAllHosts();
            if (paths.length > 1) {
                hostId = parseInt(paths[1]);
                selectedHost = hosts.find((h) => h.host_id === hostId);
                events = await getHostEvents(hostId);
            }
            if (paths.length > 2) {
                eventId = parseInt(paths[2]);
                selectedEvent = events.find((e) => e.event_id === eventId);
            }
        } else if (paths[0] === "coach") {
            organizations = await getCoachOrganizations($user.id);
            hosts = await getAllPublicHosts();

            if (paths.length > 1) {
                orgId = parseInt(paths[1]);
                selectedOrg = organizations.find(
                    (o) => o.org_id === orgId,
                )?.orgs;
            }
            if (paths.length > 2) {
                hostId = parseInt(paths[2]);
                selectedHost = hosts.find((h) => h.host_id === hostId);
                if (orgId) {
                    events = await getHostEvents(hostId);
                }
            }
            if (paths.length > 3) {
                eventId = parseInt(paths[3]);
                selectedEvent = events.find((e) => e.event_id === eventId);
            }
        } else if (paths[0] === "student") {
            hosts = await getAllPublicHosts();
            if (paths.length > 1) {
                hostId = parseInt(paths[1]);
                selectedHost = hosts.find((h) => h.host_id === hostId);
                events = await getHostEvents(hostId);
            }
            if (paths.length > 2) {
                eventId = parseInt(paths[2]);
                selectedEvent = events.find((e) => e.event_id === eventId);
            }
        }
    });

    const handleSignout = async (e) => {
        e.preventDefault();
        try {
            await signOut();
        } catch (error) {
            handleError(error);
        }
    };
</script>

<div style="background-color: var(--primary-tint);">
    <Navbar rounded color="transparent">
        <NavBrand href="/">
            <img
                src="/favicon.png"
                class="me-3 h-10 sm:h-9 logo"
                alt="COMP Logo"
            />
        </NavBrand>
        <div class="md:order-2">
            <Button size="sm" onclick={handleSignout} pill color="primary"
                >Sign Out</Button
            >
            <NavHamburger />
        </div>
        <NavUl {activeUrl}>
            {#if activeUrl.includes("/coach")}
                <NavLi class="cursor-pointer">
                    <BuildingSolid
                        class="h-6 text-primary-800 dark:text-white inline"
                    />
                    {#if selectedOrg}{selectedOrg.name}{:else}Choose
                        Organization{/if}
                    <ChevronDownOutline
                        class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
                    />
                </NavLi>
                <Dropdown class="w-44 z-20">
                    {#each organizations as org}
                        <DropdownItem
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
                        {#if selectedHost}{selectedHost.host_name}{:else}Choose
                            Host{/if}
                        <ChevronDownOutline
                            class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
                        />
                    </NavLi>
                    <Dropdown class="w-44 z-20">
                        {#each hosts as host}
                            <DropdownItem
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
                            {#if selectedEvent}{selectedEvent.event_name}{:else}Choose
                                Event{/if}
                            <ChevronDownOutline
                                class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
                            />
                        </NavLi>
                        <Dropdown class="w-44 z-20">
                            {#each events as event}
                                <DropdownItem
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
            {:else if activeUrl.includes("/student")}
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
                        {#if selectedEvent}{selectedEvent.event_name}{:else}Choose
                            Event{/if}
                        <ChevronDownOutline
                            class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
                        />
                    </NavLi>
                    <Dropdown class="w-44 z-20">
                        {#each events as event}
                            <DropdownItem
                                on:click={() => {
                                    window.location.href = `/student/${hostId}/${event.event_id}`;
                                }}
                            >
                                {event.event_name}
                            </DropdownItem>
                        {/each}
                    </Dropdown>
                    {#if eventId}
                        <NavLi class="cursor-pointer {paths[3] === "tests" ? '' : 'non-active'}" href="/student/{hostId}/{eventId}/tests">Tests</NavLi>
                    {/if}
                {/if}
            {:else}
                <NavLi class="cursor-pointer">
                    Admin Features
                    <ChevronDownOutline class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"/>
                </NavLi>
                <Dropdown class="w-44 z-20">
                    {#each adminFeatures as feature}
                        <DropdownItem on:click={() => { window.location.href = feature.href; }}>
                            {feature.name}
                        </DropdownItem>
                    {/each}
                </Dropdown>
            
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
                        {#if selectedEvent}{selectedEvent.event_name}{:else}Choose
                            Event{/if}
                        <ChevronDownOutline
                            class="w-6 h-6 m-0 p-0 text-primary-800 dark:text-white inline"
                        />
                    </NavLi>
                    <Dropdown class="w-44 z-20">
                        {#each events as event}
                            <DropdownItem
                                on:click={() => {
                                    window.location.href = `/admin/${hostId}/${event.event_id}`;
                                }}
                            >
                                {event.event_name}
                            </DropdownItem>
                        {/each}
                    </Dropdown>
                    {#if eventId}
                        <NavLi class="cursor-pointer {paths[3] === "students" ? '' : 'non-active'}"  href="/admin/{hostId}/{eventId}/students">Students</NavLi>
                        <NavLi class="cursor-pointer {paths[3] === "teams" ? '' : 'non-active'}"  href="/admin/{hostId}/{eventId}/teams">Teams</NavLi>
                        <NavLi class="cursor-pointer {paths[3] === "tests" ? '' : 'non-active'}"  href="/admin/{hostId}/{eventId}/tests">Tests</NavLi>
                    {/if}
                {/if}
            {/if}
        </NavUl>
    </Navbar>
</div>

<style>
    :global(nav div.flex) {
        justify-content: space-between;
    }

    :global(.cursor-pointer) {
        padding: 2px 10px;
        background-color: white;
    }

    :global(.non-active) {
        background-color: transparent;
    }

    .logo {
        background-color: white;
        border-radius: 50px;
    }

</style>
