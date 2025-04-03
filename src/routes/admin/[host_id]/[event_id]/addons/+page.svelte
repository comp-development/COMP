<script lang="ts">
  import { Tabs, TabItem, Alert } from "flowbite-svelte";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import Loading from "$lib/components/Loading.svelte";
  import AddonManager from "$lib/components/AddonManager.svelte";
  import { getEventAddons, upsertEventAddon, deleteEventAddon } from "$lib/supabase";
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";

  type Addon = {
    addon_id?: string;
    key: string;
    label: string;
    price_cents: number;
    description?: string;
    enabled: boolean;
    visible: boolean;
    addon_table?: string;
    event_id?: number;
  };

  // Get the event_id and host_id from the URL
  const event_id = parseInt($page.params.event_id);
  const host_id = parseInt($page.params.host_id);

  let selectedTab = "students";
  let studentAddons = $state<Addon[]>([]);
  let teamAddons = $state<Addon[]>([]);
  let orgAddons = $state<Addon[]>([]);
  let loading = $state(true);

  async function loadAddons() {
    try {
      studentAddons = await getEventAddons(event_id, "students");
      teamAddons = await getEventAddons(event_id, "teams");
      orgAddons = await getEventAddons(event_id, "orgs");
      loading = false;
    } catch (error) {
      handleError(error as Error);
      loading = false;
    }
  }

  onMount(() => {
    loadAddons();
  });

  async function handleStudentAddonsUpdate(addons: Addon[]) {
    try {
      await Promise.all(addons.map(addon => 
        upsertEventAddon({...addon, event_id, addon_table: "students"})
      ));
      studentAddons = await getEventAddons(event_id, "students");
      toast.success("Student addons updated successfully");
    } catch (error) {
      handleError(error as Error);
    }
  }

  async function handleTeamAddonsUpdate(addons: Addon[]) {
    try {
      await Promise.all(addons.map(addon => 
        upsertEventAddon({...addon, event_id, addon_table: "teams"})
      ));
      teamAddons = await getEventAddons(event_id, "teams");
      toast.success("Team addons updated successfully");
    } catch (error) {
      handleError(error as Error);
    }
  }

  async function handleOrgAddonsUpdate(addons: Addon[]) {
    try {
      await Promise.all(addons.map(addon => 
        upsertEventAddon({...addon, event_id, addon_table: "orgs"})
      ));
      orgAddons = await getEventAddons(event_id, "orgs");
      toast.success("Organization addons updated successfully");
    } catch (error) {
      handleError(error as Error);
    }
  }

  async function handleStudentAddonDelete(addon_id: string) {
    try {
      await deleteEventAddon(addon_id);
      studentAddons = studentAddons.filter(addon => addon.addon_id !== addon_id);
      toast.success("Student addon deleted successfully");
    } catch (error) {
      handleError(error as Error);
    }
  }

  async function handleTeamAddonDelete(addon_id: string) {
    try {
      await deleteEventAddon(addon_id);
      teamAddons = teamAddons.filter(addon => addon.addon_id !== addon_id);
      toast.success("Team addon deleted successfully");
    } catch (error) {
      handleError(error as Error);
    }
  }

  async function handleOrgAddonDelete(addon_id: string) {
    try {
      await deleteEventAddon(addon_id);
      orgAddons = orgAddons.filter(addon => addon.addon_id !== addon_id);
      toast.success("Organization addon deleted successfully");
    } catch (error) {
      handleError(error as Error);
    }
  }
</script>

<h1 class="text-2xl font-bold mb-4">Addons Management</h1>

{#if loading}
  <Loading />
{:else}
  <Tabs tabStyle="pill">
    <TabItem
      open={selectedTab === "students"}
      title="Student Addons"
      onclick={() => (selectedTab = "students")}
    >
      <AddonManager 
        addons={studentAddons} 
        onUpdate={handleStudentAddonsUpdate}
        onDelete={handleStudentAddonDelete}
        entityType="students"
      />
    </TabItem>
    <TabItem
      open={selectedTab === "teams"}
      title="Team Addons"
      onclick={() => (selectedTab = "teams")}
    >
      <AddonManager 
        addons={teamAddons} 
        onUpdate={handleTeamAddonsUpdate}
        onDelete={handleTeamAddonDelete}
        entityType="teams"
      />
    </TabItem>
    <TabItem
      open={selectedTab === "organizations"}
      title="Organization Addons"
      onclick={() => (selectedTab = "organizations")}
    >
      <AddonManager 
        addons={orgAddons} 
        onUpdate={handleOrgAddonsUpdate}
        onDelete={handleOrgAddonDelete}
        entityType="orgs"
      />
    </TabItem>
  </Tabs>
{/if}