<script lang="ts">
  import { handleError } from "$lib/handleError";
  import {
    createAccount,
    signIntoAccount,
    addStudent,
    addCoach,
  } from "$lib/supabase";
  import { supabase } from "$lib/supabaseClient";
  import toast from "$lib/toast.svelte";
  import CustomForm from "$lib/components/CustomForm.svelte";
  import { Tabs, TabItem, Alert } from "flowbite-svelte";
  import { InfoCircleSolid } from "flowbite-svelte-icons";
  import Logo from "$lib/components/Logo.svelte";
  import { page } from '$app/stores';

  // Instead of using an enum for login state, we'll just use string literals.
  // Define the allowed login states.
  type LogInState = "LOGIN" | "SIGNUP" | "RESET";

  // Update props interface to use the string union type
  interface Props {
    logInState: LogInState;
  }

  // Regex for name validation
  // Allows English letters, spaces, hyphens, apostrophes, and periods
  // First letter should be uppercase (Pascal Casing)
  const nameRegex = /^(?=.{1,30}$)[\p{Lu}][\p{Ll}\p{M}]*(?:(?:[\p{Ll}\p{M}]*[\p{Lu}][\p{Ll}\p{M}]+)|(?:[ '-][\p{Lu}][\p{Ll}\p{M}]+))*$/u;
  const NAME_ERROR_MESSAGE = "Name should be in typical capitalization, and contain only English letters, spaces, hyphens, apostrophes, accents, and periods. Maximum 30 characters.";

  // Destructure the prop (if not provided, you can set a default value)
  let { logInState = "LOGIN" }: Props = $props();
  let newResponses = $state({});
  let validationErrors = $state({});
  let selectedOption = $state("");

  const handleLogin = async () => {
    try {
      console.log(newResponses);
      const email = newResponses.email.trim();
      const password = newResponses.password.trim();
      if (!email || !password || email == "" || password == "") {
        console.log("error");
        throw new Error("Not all of the fields are complete");
      }
      await signIntoAccount(email, password);
    } catch (error) {
      handleError(error);
    }
  };

  const handleSignUp = async () => {
    try {
      if (newResponses.password === newResponses.retypePassword) {
        try {
          const user = await createAccount(
            newResponses.email,
            newResponses.password,
            $page.url.pathname
          );

          console.log("USER", user)

          if (selectedOption === "student") {
            await addStudent(user.id, newResponses);
          } else {
            await addCoach(user.id, newResponses);
          }

          toast.success(
            "Successfully signed up, check your email to confirm your account. Make sure to check your junk/spam folders as well.",
          );
          logInState = "LOGIN";
        } catch (error) {
          if (error.code === "weak_password"){
            error.message = "Password must contain at least 6 characters, a letter, and a number.";
          }
          throw error;
        }
      } else {
        throw new Error("Passwords do not match");
      }
    } catch (error) {
      if (error.code === "23505" || error.code === "23503"){
        error.message = "An account with this email already exists";
      }
      handleError(error);
    }
  };

  const handleResetPassword = async () => {
    try {
      // Implement your reset password logic here (e.g., calling a reset service)
      console.log(newResponses);
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        newResponses.email,
        {
          redirectTo: "https://comp.mt/reset-password",
        },
      );
      toast.success("Reset password link sent. Please check your email. Don't forget to check junk/spam folders as well.");
    } catch (error) {
      handleError(error);
    }
  };

  const loginFields = [
    {
      name: "email",
      label: "Email",
      required: true,
      editable: true,
      custom_field_type: "email",
      placeholder: "Email",
    },
    {
      name: "password",
      label: "Password",
      editable: true,
      required: true,
      custom_field_type: "current-password",
      placeholder: "Password",
    },
  ];

  const commonSignupFields = [
    {
      name: "first_name",
      label: "First Name",
      required: true,
      editable: true,
      hidden: false,
      custom_field_type: "text",
      placeholder: "First Name",
      regex: nameRegex,
      regex_error_message: NAME_ERROR_MESSAGE
      },
    {
      name: "last_name",
      label: "Last Name",
      required: true,
      editable: true,
      hidden: false,
      custom_field_type: "text",
      placeholder: "Last Name",
      regex: nameRegex,
      regex_error_message: NAME_ERROR_MESSAGE
    },
    {
      name: "email",
      label: "Email",
      required: true,
      editable: true,
      custom_field_type: "email",
      placeholder: "Email",
    },
    {
      name: "password",
      label: "Password",
      editable: true,
      required: true,
      custom_field_type: "new-password",
      placeholder: "Password",
    },
    {
      name: "retypePassword",
      label: "Retype Password",
      editable: true,
      required: true,
      custom_field_type: "new-password",
      placeholder: "Retype Password",
    },
  ];

  const resetPasswordFields = [
    {
      name: "email",
      label: "Email",
      required: true,
      custom_field_type: "email",
      placeholder: "Email",
    },
  ];

  const studentSignupFields = [
    ...commonSignupFields,
  ];
  const coachSignupFields = commonSignupFields;
</script>

<div class="center-vertical">
  <div
    style="background-color: var(--primary-tint); border-radius: 10px; width: 90%; max-width: 400px; padding: 20px; margin: 50px"
  >
    <div>
      <div style="display: flex; justify-content: center; align-items: center; border-radius: 5px; padding: 5px">
        <Logo class="logo" height="90px" text_color="#000" light_color="var(--primary-light)" dark_color="var(--primary)"/>
      </div>
      <br>
      <hr style="border: none; border-top: 1px solid black;" /><br><br>

      <!-- Change header based on login state -->
      <h3 id="headerText">
        {#if logInState === "LOGIN"}
          Log In
        {:else if logInState === "SIGNUP"}
          Sign Up
        {:else if logInState === "RESET"}
          Reset Password
        {/if}
      </h3>

      <!-- Display the appropriate form based on state -->
      {#if logInState === "LOGIN"}
        <div class="no-padding">
          <CustomForm
            fields={loginFields}
            bind:newResponses
            bind:validationErrors
            handleSubmit={handleLogin}
            showBorder={false}
          />
        </div>
      {:else if logInState === "SIGNUP"}
        <br />
        <!--<Alert color="yellow">
          <span class="font-medium">Confirmation emails to hotmail, live, outlook, and msn are currently unreliable.</span><br>
           If you sign up with one of these and don't receive a confirmation email, try signing up with another service.
        </Alert>
        <br>-->
        <Alert color="light">
          <InfoCircleSolid slot="icon" class="w-5 h-5" />
          If you are a coach of a school team or organization, please sign up as a <b class="font-bold">Coach</b>. If you are a student that needs to join a team, please sign up as a <b class="font-bold">Student</b>.
        </Alert><br>
        <div class="tabs">
          <Tabs tabStyle="pill">
            <TabItem
              onclick={() => (selectedOption = "student")}
              open={selectedOption === "student"}
              title="Student"
              style="border: 2px solid var(--primary); padding: 10px 16px;"
            >
              <div class="no-padding">
                <CustomForm
                  fields={studentSignupFields}
                  bind:newResponses
                  bind:validationErrors
                  handleSubmit={handleSignUp}
                  showBorder={false}
                />
              </div>
            </TabItem>
            <TabItem
              onclick={() => (selectedOption = "coach")}
              open={selectedOption === "coach"}
              title="Coach"
              style="border: 2px solid var(--primary); padding: 10px 16px;"
            >
              <div class="no-padding">
                <CustomForm
                  fields={coachSignupFields}
                  bind:newResponses
                  bind:validationErrors
                  handleSubmit={handleSignUp}
                  showBorder={false}
                />
              </div>
            </TabItem>
          </Tabs>
        </div>
      {:else if logInState === "RESET"}
        <div class="no-padding">
          <CustomForm
            fields={resetPasswordFields}
            bind:newResponses
            bind:validationErrors
            handleSubmit={handleResetPassword}
            showBorder={false}
          />
        </div>
      {/if}
      <br />
      <!-- Footer buttons to toggle states -->
      <div class="bottomSection" style="color: white;">
        <button
          size="lg"
          class="link"
          id="leftButton"
          onclick={() => {
            // Toggle between LOGIN and SIGNUP (if in RESET, switch back to LOGIN)
            if (logInState === "LOGIN") {
              logInState = "SIGNUP";
            } else {
              logInState = "LOGIN";
            }
          }}><u>{logInState === "LOGIN" ? "Sign Up" : "Log In"}</u></button
        >
        <button
          size="lg"
          class="link"
          id="rightButton"
          onclick={() => {
            if (logInState === "RESET") {
              logInState = "SIGNUP";
            } else {
              logInState = "RESET";
            }
          }}
          ><u>{logInState === "RESET" ? "Sign Up" : "Forgot Password"}</u
          ></button
        >
      </div>
    </div>
  </div>
</div>

<style>
  #headerText {
    font-size: 40px;
  }

  :global(.no-padding .registrationForm),
  :global(.no-padding .registrationForm form) {
    padding: 0px;
  }

  :global(.tabs [role="tabpanel"]) {
    padding: 0px;
    background: transparent;
  }

  @media only screen and (max-width: 700px) {
    .bottomSection {
      width: 100vw;
    }
  }

  /* Remove the float rules */
  #leftButton,
  #rightButton {
    float: none;
  }

  /* Use flex styling to align the buttons to the edges */
  .bottomSection {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .center-vertical {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  .logo {
    width: 100%;
    max-width: 200px; /* Adjust as needed */
  }
</style>
