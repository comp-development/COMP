<script>
    import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Dropdown, DropdownItem, Avatar, DropdownHeader, DropdownDivider } from 'flowbite-svelte';
    import { ChevronDownOutline } from 'flowbite-svelte-icons';
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import { getAllHosts, getHostEvents } from '$lib/supabase'; // Import the functions to fetch hosts and events

    const activeUrl = page.url.pathname;
    let hostId;
    let eventId;
    let hosts = [];
    let events = [];

    onMount(async () => {
        const paths = activeUrl.split('/'); // Filter out empty strings
        if (paths[1] === 'admin') {
            hosts = await getAllHosts();
            if (paths.length > 2) {
                hostId = paths[2]; // Get host_id
                events = await getHostEvents(hostId);
            }
            if (paths.length > 3) {
                eventId = paths[3]; // Get event_id
            }
        }
        console.log(hosts, events)
    });
</script>

<Navbar rounded color="green">
    <NavBrand href="/">
        <img src="/COMP_White.png" class="me-3 h-6 sm:h-9" alt="COMP Logo" />
    </NavBrand>
    <div class="flex items-center md:order-2">
        <Avatar id="avatar-menu" src="/favicon.png" />
        <NavHamburger class1="w-full md:flex md:w-auto md:order-1" />
    </div>
    <Dropdown placement="bottom" triggeredBy="#avatar-menu">
        <DropdownHeader>
            <span class="block text-sm">Bonnie Green</span>
            <span class="block truncate text-sm font-medium">name@flowbite.com</span>
        </DropdownHeader>
        <DropdownItem>Dashboard</DropdownItem>
        <DropdownItem>Settings</DropdownItem>
        <DropdownItem>Earnings</DropdownItem>
        <DropdownDivider />
        <DropdownItem>Sign out</DropdownItem>
    </Dropdown>
    <NavUl {activeUrl}>
        <NavLi class="cursor-pointer">
            {#if hostId}Host: {hostId}{:else}Choose Host{/if}<ChevronDownOutline class="w-6 h-6 ms-2 text-primary-800 dark:text-white inline" />
        </NavLi>
        <Dropdown class="w-44 z-20">
            {#each hosts as host}
                <DropdownItem on:click={() => {  window.location.href = `/admin/${host.host_id}`; }}>{host.host_name}</DropdownItem>
            {/each}
        </Dropdown>
        {#if hostId}
            <NavLi class="cursor-pointer">
                {#if eventId}Event: {eventId}{:else}Choose Event{/if}<ChevronDownOutline class="w-6 h-6 ms-2 text-primary-800 dark:text-white inline" />
            </NavLi>
            <Dropdown class="w-44 z-20">
                {#each events as event}
                    <DropdownItem on:click={() => { window.location.href = `/admin/${hostId}/${event.event_id}`; }}>{event.event_name}</DropdownItem>
                {/each}
            </Dropdown>
            {#if eventId}
                <NavLi href="/admin/{hostId}/{eventId}/students">Students</NavLi>
                <NavLi href="/admin/{hostId}/{eventId}/teams">Teams</NavLi>
                <NavLi href="//admin/{hostId}/{eventId}/orgs">Organizations</NavLi>
                <NavLi href="/admin/{hostId}/{eventId}/tests">Tests</NavLi>
                <NavLi href="/admin/{hostId}/{eventId}/settings">Settings</NavLi>
            {/if}
        {/if}
    </NavUl>
</Navbar>