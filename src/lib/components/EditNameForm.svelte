<script lang="ts">
  import { user } from "$lib/sessionStore";
  import { updateUserName } from "$lib/supabase/users";
  import { handleError } from "$lib/handleError";
  import { Button, Modal, Label, Input, Helper } from "flowbite-svelte";
  import { PenSolid } from "flowbite-svelte-icons";
  import toast from "$lib/toast.svelte";

  export let firstName: string;
  export let lastName: string;
  export let userType: "admin" | "student" | "coach";
  export let onUpdate: () => Promise<void> = async () => {};

  let showModal = false;
  let isSubmitting = false;
  let newFirstName = "";
  let newLastName = "";
  let firstNameError = "";
  let lastNameError = "";

  // Regex for name validation
  // Allows English letters, spaces, hyphens, apostrophes, and periods
  // First letter should be uppercase (Pascal Casing)
  const nameRegex = /^[\p{Lu}][\p{Ll}\p{M}]*(?:(?:[\p{Ll}\p{M}]*[\p{Lu}][\p{Ll}\p{M}]+)|(?:[ '-][\p{Lu}][\p{Ll}\p{M}]+))*$/u;
  const MAX_NAME_LENGTH = 30;

  function openModal() {
    newFirstName = firstName;
    newLastName = lastName;
    firstNameError = "";
    lastNameError = "";
    showModal = true;
  }

  function validateName(name: string, fieldName: string): string {
    if (!name) {
      return `${fieldName} is required`;
    }
    
    if (name.length > MAX_NAME_LENGTH) {
      return `${fieldName} must be ${MAX_NAME_LENGTH} characters or less`;
    }

    if (!nameRegex.test(name)) {
      return `${fieldName} should be in typical capitalization, and contain only English letters, spaces, hyphens, apostrophes, accents, and periods`;
    }

    return "";
  }

  function validateForm(): boolean {
    firstNameError = validateName(newFirstName, "First name");
    lastNameError = validateName(newLastName, "Last name");
    
    return !firstNameError && !lastNameError;
  }

  function handleFirstNameInput() {
    firstNameError = validateName(newFirstName, "First name");
  }
  
  function handleLastNameInput() {
    lastNameError = validateName(newLastName, "Last name");
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!validateForm()) {
      // Show error messages if validation fails
      toast.error("Please fix the validation errors");
      return;
    }
    
    try {
      isSubmitting = true;
      await updateUserName($user!.id, newFirstName, newLastName, userType);
      toast.success("Name updated successfully");
      showModal = false;
      await onUpdate();
    } catch (error: unknown) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error(String(error)));
      }
    } finally {
      isSubmitting = false;
    }
  }
</script>

<button 
  class="text-gray-700 hover:text-black dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none ml-2" 
  onclick={openModal} 
  aria-label="Edit name"
  title="Edit name"
>
  <PenSolid size="md" class="w-5 h-5" />
</button>

<Modal bind:open={showModal} size="xs" autoclose={false} title="Edit Your Name">
  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <Label for="firstName" class="mb-2" color={firstNameError ? "red" : "gray"}>First Name</Label>
      <Input 
        id="firstName" 
        placeholder="First Name" 
        bind:value={newFirstName}
        color={firstNameError ? "red" : "base"}
        on:input={handleFirstNameInput}
        required 
      />
      {#if firstNameError}
        <Helper class="mt-2" color="red">{firstNameError}</Helper>
      {/if}
    </div>
    
    <div>
      <Label for="lastName" class="mb-2" color={lastNameError ? "red" : "gray"}>Last Name</Label>
      <Input 
        id="lastName" 
        placeholder="Last Name" 
        bind:value={newLastName}
        color={lastNameError ? "red" : "base"} 
        on:input={handleLastNameInput}
        required 
      />
      {#if lastNameError}
        <Helper class="mt-2" color="red">{lastNameError}</Helper>
      {/if}
    </div>
    
    <div class="flex justify-end space-x-2">
      <Button color="alternative" type="button" onclick={() => showModal = false}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting || !!firstNameError || !!lastNameError}>
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </div>
  </form>
</Modal> 