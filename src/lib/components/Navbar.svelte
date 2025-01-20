<script>
    import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';
    import { ChevronDownOutline } from 'flowbite-svelte-icons';
    import { page } from '$app/stores';
    $: activeUrl = $page.url.pathname;
</script>

<Navbar rounded color="form">
    <NavBrand href="/">
        <img src="/COMP_White.png" class="me-3 h-6 sm:h-9" alt="COMP Logo" />
    </NavBrand>
    <NavHamburger />
    <NavUl {activeUrl}>
        <NavLi href="/" active={true}>Home</NavLi>
        <NavLi class="cursor-pointer">
            Host Dropdown<ChevronDownOutline class="w-6 h-6 ms-2 text-primary-800 dark:text-white inline" />
        </NavLi>
        <Dropdown class="w-44 z-20">
            <DropdownItem href="/">Dashboard</DropdownItem>
            <DropdownItem href="/docs/components/navbar">Settings</DropdownItem>
            <DropdownItem href="/">Earnings</DropdownItem>
            <DropdownDivider />
            <DropdownItem href="/">Sign out</DropdownItem>
        </Dropdown>
        <NavLi class="cursor-pointer">
            Event Dropdown<ChevronDownOutline class="w-6 h-6 ms-2 text-primary-800 dark:text-white inline" />
        </NavLi>
        <Dropdown class="w-44 z-20">
            <DropdownItem href="/">Dashboard</DropdownItem>
            <DropdownItem href="/docs/components/navbar">Settings</DropdownItem>
            <DropdownItem href="/">Earnings</DropdownItem>
            <DropdownDivider />
            <DropdownItem href="/">Sign out</DropdownItem>
        </Dropdown>
        <NavLi href="/about">Students</NavLi>
        <NavLi href="/docs/components/navbar">Teams</NavLi>
        <NavLi href="/pricing">Organizations</NavLi>
        <NavLi href="/contact">Tests</NavLi>
        <NavLi href="/contact">Settings</NavLi>
    </NavUl>
</Navbar>