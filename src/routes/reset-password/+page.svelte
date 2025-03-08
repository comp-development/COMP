<script>
  import CustomForm from "$lib/components/CustomForm.svelte";
  import { handleError } from "$lib/handleError";
  import { updateUserAuth } from "$lib/supabase";
  import toast from "$lib/toast.svelte";

  let newResponses = $state({});
  let validationErrors = $state({});

  const fields = [
    {
      name: "password",
      label: "Password",
      required: true,
      custom_field_type: "new-password",
      placeholder: "Password",
    },
    {
      name: "retypePassword",
      label: "Retype Password",
      required: true,
      custom_field_type: "new-password",
      placeholder: "Retype Password",
    },
  ];

  async function updateUser() {
    try {
      await updateUserAuth(newResponses.password);
      toast.success("Successfully changed password.");
      window.location.href = "/";
    } catch (error) {
      handleError(error);
    }
  }
</script>

<CustomForm
  title="Reset Password"
  {fields}
  bind:newResponses
  bind:validationErrors
  handleSubmit={updateUser}
  showBorder={false}
/>
