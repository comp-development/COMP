<script lang="ts">
  import { handleError } from "$lib/handleError";
  import { getUser, transferUser, editUser } from "$lib/supabase";
  import { page } from "$app/stores";
  import Loading from "$lib/components/Loading.svelte";
  import toast from "$lib/toast.svelte";
  import CustomForm from "$lib/components/CustomForm.svelte";
  import { Button, Tabs, TabItem, ButtonGroup } from "flowbite-svelte";

  let userId = $page.params.id;
  let user = $state({});
  let loading = $state(true);
  let newResponses = $state({});
  let validationErrors = $state({});
  let selectedConversion = $state("student");

  let studentFields = $state([]);
  let coachFields = $state([]);
  let adminFields = $state([]);

  async function fetchUser() {
    try {
      user = await getUser(userId);
      newResponses = { ...user };

      studentFields = [
        {
          name: "first_name",
          label: "First Name",
          required: true,
          editable: true,
          custom_field_type: "text",
          value: user.first_name,
        },
        {
          name: "last_name",
          label: "Last Name",
          required: true,
          editable: true,
          custom_field_type: "text",
          value: user.last_name,
        },
        {
          name: "email",
          label: "Email",
          required: true,
          editable: false,
          custom_field_type: "email",
          value: user.email,
        },
        {
          name: "grade",
          label: "Grade",
          required: true,
          editable: true,
          custom_field_type: "number",
          value: user.grade,
        },
      ];

      coachFields = [
        {
          name: "first_name",
          label: "First Name",
          required: true,
          editable: true,
          custom_field_type: "text",
          value: user.first_name,
        },
        {
          name: "last_name",
          label: "Last Name",
          required: true,
          editable: true,
          custom_field_type: "text",
          value: user.last_name,
        },
        {
          name: "email",
          label: "Email",
          required: true,
          editable: false,
          custom_field_type: "email",
          value: user.email,
        },
      ];

      adminFields = [
        {
          name: "first_name",
          label: "First Name",
          required: true,
          editable: false,
          custom_field_type: "text",
          value: user.first_name,
        },
        {
          name: "last_name",
          label: "Last Name",
          required: true,
          editable: false,
          custom_field_type: "text",
          value: user.last_name,
        },
        {
          name: "email",
          label: "Email",
          required: true,
          editable: false,
          custom_field_type: "email",
          value: user.email,
        },
      ];

      loading = false;
    } catch (error) {
      handleError(error);
    }
  }

  async function handleTransfer() {
    try {
      // Remove from current table and add to selected table
      await transferUser(userId, user.userType, selectedConversion);
      toast.success(`User successfully converted to ${selectedConversion}`);
      // Refresh user data
      await fetchUser();
    } catch (error) {
      handleError(error);
    }
  }

  async function handleUpdate() {
    try {
      await editUser(userId, user.userType, newResponses);
      toast.success("User information updated successfully");
      await fetchUser();
    } catch (error) {
      handleError(error);
    }
  }

  fetchUser();
</script>

{#if loading}
  <Loading />
{:else}
  <div class="p-4">
    <h1>
      {user.first_name}
      {user.last_name}
    </h1>
    <h2>
      {user.userType === "student"
        ? "Student"
        : user.userType === "coach"
          ? "Coach"
          : "Admin"}
    </h2>
    <br />

    <!-- User Type Conversion Section -->
    <div>
      <h2>Convert User Type</h2>
      <br />
      <ButtonGroup>
        {#if user.userType !== "student"}
          <Button
            pill
            outline
            color="primary"
            onclick={() => {
              selectedConversion = "student";
              handleTransfer();
            }}
          >
            Convert to Student
          </Button>
        {/if}
        {#if user.userType !== "coach"}
          <Button
            pill
            outline
            color="primary"
            onclick={() => {
              selectedConversion = "coach";
              handleTransfer();
            }}
          >
            Convert to Coach
          </Button>
        {/if}
        {#if user.userType !== "admin"}
          <Button
            pill
            outline
            color="primary"
            onclick={() => {
              selectedConversion = "admin";
              handleTransfer();
            }}
          >
            Convert to Admin
          </Button>
        {/if}
      </ButtonGroup>
    </div>

    <CustomForm
      title="User Information"
      fields={user.userType === "student"
        ? studentFields
        : user.userType === "coach"
          ? coachFields
          : adminFields}
      bind:newResponses
      bind:validationErrors
      handleSubmit={handleUpdate}
      showBorder={true}
    />
  </div>
{/if}

<style>
  :global(.tabs [role="tabpanel"]) {
    padding: 0px;
    background: transparent;
  }
</style>
