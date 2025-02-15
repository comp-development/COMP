<script>
  import { handleError } from "$lib/handleError";
  import { resetUserPassword } from "$lib/supabase";
  import toast from "$lib/toast.svelte";
  import CustomForm from "$lib/components/CustomForm.svelte";

  let newResponses = $state({});
  let validationErrors = $state({});

  const fields = [
    {
      name: "email",
      label: "Email",
      required: true,
      custom_field_type: "email",
      placeholder: "Email",
    },
  ];

  async function resetPassword() {
    try {
      await resetUserPassword(newResponses.email);
      toast.success(
        `A reset password email has been sent to ${newResponses.email}.`,
      );
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
  handleSubmit={resetPassword}
  showBorder={false}
/>
