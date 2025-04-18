<script lang="ts">
  import {
    Button,
    Input,
    Helper,
    Select,
    Label,
    Datepicker,
    Textarea,
    Radio,
    Checkbox,
    ButtonGroup,
    InputAddon,
    Toggle,
  } from "flowbite-svelte";
  import {
    EnvelopeSolid,
    EyeOutline,
    EyeSlashOutline,
    PhoneSolid,
  } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import CustomDatePicker from "./CustomDatePicker.svelte";

  let {
    title = null,
    fields = [],
    custom_fields = [],
    showBorder = true,
    validationErrors = $bindable({}),
    newResponses = $bindable({}),
    handleSubmit,
    buttonText = "Submit",
  } = $props();

  let initialResponses: any = $state({});
  let show = $state(false);
  let telephoneValues: any = $state({});
  let dateValues: any = $state({});
  
  // Initialize default values for required fields
  function initializeResponses() {
    const allFields = [...fields, ...custom_fields];
    
    for (let field of allFields) {
      const key = field.event_custom_field_id ?? field.name;
      
      if (field.custom_field_type === "date") {
        // Pre-initialize all date fields with a value to avoid binding undefined
        if (!dateValues[key]) {
          const now = new Date();
          const [formattedDate, _] = format_date(now);
          dateValues[key] = now;
          newResponses[key] = formattedDate;
        }
      }
    }
  }
  
  // Run initialization once at component startup
  onMount(() => {
    initializeResponses();
  });

  // Then process the actual field values
  $effect(() => {
    for (var field of [...fields, ...custom_fields]) {
      const key = field.event_custom_field_id ?? field.name;
      
      if (field.custom_field_type == "phone") {
        telephoneValues[key] = format_phone(field?.value)[1];
      } else if (field.custom_field_type == "date") {
        if (field.value) {
          // If the field has a value, it will be in MM/DD/YYYY format from the database
          const [rawValue, dateObj] = format_date(field.value);
          initialResponses[key] = rawValue;
          newResponses[key] = rawValue;
          dateValues[key] = dateObj;
        }
        continue;
      }
      
      initialResponses[key] = field?.value;
      newResponses[key] = field?.value;
    }
  });
  const typePatterns = {
    date: /^\d{2}\/\d{2}\/\d{4}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    tel: /^\d{10}$/,
  };

  const validationMessages = {
    date: "Please select a date of the form MM/DD/YYYY",
    email: "Please follow the format: username@domain.com",
    tel: "Please follow the format: NNN-NNN-NNNN",
  };

  function format_date(input: Date | string | null | undefined): [string | null, Date | null] {
    if (!input) {
      return [null, null];
    }
    
    try {
      // If input is a string in MM/DD/YYYY format, convert to Date
      if (typeof input === 'string') {
        const [month, day, year] = input.split('/').map(Number);
        if (isNaN(month) || isNaN(day) || isNaN(year)) {
          return [null, null];
        }
        const dateObj = new Date(year, month - 1, day);
        if (isNaN(dateObj.getTime())) {
          return [null, null];
        }
        return [input, dateObj];
      }
      
      // If input is a Date, convert to MM/DD/YYYY string
      if (input instanceof Date) {
        if (isNaN(input.getTime())) {
          return [null, null];
        }
        const month = String(input.getMonth() + 1).padStart(2, '0');
        const day = String(input.getDate()).padStart(2, '0');
        const year = input.getFullYear();
        const formattedString = `${month}/${day}/${year}`;
        return [formattedString, input];
      }
      
      return [null, null];
    } catch (e) {
      console.error('Error formatting date:', e);
      return [null, null];
    }
  }

  function format_phone(input: string): [string | null, string | null] {
    if (!input) {
      return [null, null];
    }
    let rawValue = input.replace(/\D/g, "").slice(0, 10);
    let formattedValue = rawValue;

    const areaCode = formattedValue.substring(0, 3);
    const prefix = formattedValue.substring(3, 6);
    const suffix = formattedValue.substring(6, 10);

    if (formattedValue.length > 6) {
      formattedValue = `(${areaCode}) ${prefix} - ${suffix}`;
    } else if (formattedValue.length > 3) {
      formattedValue = `(${areaCode}) ${prefix}`;
    } else if (formattedValue.length > 0) {
      formattedValue = `(${areaCode}`;
    }
    return [rawValue, formattedValue];
  }

  function validateInput(
    key: string,
    value: any,
    regex: string | RegExp | null,
    error_message: string | null,
  ) {
    console.log(regex, value);
    if (regex && value) {
      const pattern = new RegExp(regex);
      validationErrors[key] = !pattern.test(value)
        ? (error_message ?? `Please follow the format: ${regex}`)
        : null;
    } else {
      validationErrors[key] = null;
    }
  }

  function validateForm() {
    for (let field of [...fields, ...custom_fields]) {
      const key = field.event_custom_field_id ?? field.name;

      if (field.required) {
        if (field.custom_field_type === "checkboxes") {
          if (!newResponses[key] || newResponses[key].length === 0) {
            validationErrors[key] =
              `Please select at least one option for "${field.label}"`;
          } else {
            validationErrors[key] = null;
          }
        } else if (field.custom_field_type === "multiple_choice") {
          if (!newResponses[key]) {
            validationErrors[key] =
              `Please select an option for "${field.label}"`;
          } else {
            validationErrors[key] = null;
          }
        }
      }
    }

    return !Object.values(validationErrors).some((error) => error !== null);
  }

  async function handleFormSubmit(event: Event) {
    event.preventDefault();

    if (validateForm()) {
      await handleSubmit(event);
    }
  }

  function handleCheckboxChange(key: string, value: string) {
    let selectedValues = (newResponses[key] || "")
      .split(";")
      .map((v: string) => v.trim())
      .filter((v: string) => v);

    value = value.trim();

    if (selectedValues.includes(value)) {
      selectedValues = selectedValues.filter((v: string) => v !== value);
    } else {
      selectedValues.push(value);
    }

    newResponses[key] = selectedValues.join(";");
  }
</script>

<div class="registrationForm">
  {#if title}
    <h2>{title}</h2>
  {/if}
  <br />
  <form onsubmit={handleFormSubmit} class:bordered={showBorder}>
    {#each [...fields, ...custom_fields] as field}
      {@const key = field.event_custom_field_id ?? field.name}
      {#if !field.hidden}
        <div class="text-left mb-6">
          {#if field.custom_field_type !== "toggle"}
            <Label
              for={key}
              class="block mb-2"
              color={validationErrors[key]
                ? "red"
                : !field.editable && field?.value != null
                  ? "disabled"
                  : "gray"}
            >
              {field.label}
              {#if field.required}
                <span class="text-red-600">*</span>
              {/if}
            </Label>
          {/if}

          {#if field.help_text !== null}
            <Helper class="mb-3">{field.help_text}</Helper>
          {/if}

          {#if field.custom_field_type === "dropdown"}
            <Select
              class="mt-2"
              required={field.required}
              disabled={!field.editable && field?.value != null}
              items={[
                ...(field.required ? [] : [{ value: null, name: "None" }]),
                ...field.choices.map((choice: string) => ({
                  value: choice,
                  name: choice,
                })),
              ]}
              bind:value={newResponses[key]}
            />
          {:else if field.custom_field_type === "date"}
            <CustomDatePicker
              bind:value={dateValues[key]}
              required={field.required}
              placeholder={field.placeholder}
              disabled={!field.editable && field?.value != null}
              showLabel={false}
              on:blur={() =>
                validateInput(
                  key,
                  newResponses[key],
                  typePatterns.date,
                  validationMessages.date,
                )}
              on:dateChange={(e) => {
                const [formattedDate, dateObj] = format_date(e.detail.date);
                newResponses[key] = formattedDate;
              }}
            />
          {:else if field.custom_field_type === "email"}
            <Input
              type="email"
              id={key}
              placeholder={field.placeholder ?? "handle@domain.com"}
              bind:value={newResponses[key]}
              disabled={!field.editable && field.value != null}
              required={field.required}
              on:blur={() =>
                validateInput(
                  key,
                  newResponses[key],
                  typePatterns.email,
                  validationMessages.email,
                )}
            >
              <EnvelopeSolid
                slot="left"
                class="w-5 h-5 text-gray-500 dark:text-gray-400"
              />
            </Input>
          {:else if field.custom_field_type === "phone"}
            <Input
              id={key}
              type="tel"
              placeholder={field.placeholder ?? "123-456-7890"}
              bind:value={telephoneValues[key]}
              on:input={(e) => {
                const [rawValue, formattedValue] = format_phone(
                  (e.target as any).value,
                );
                newResponses[key] = rawValue;
                telephoneValues[key] = formattedValue;
              }}
              required={field.required}
              disabled={!field.editable && field.value != null}
              on:blur={() =>
                validateInput(
                  key,
                  newResponses[key],
                  typePatterns.tel,
                  validationMessages.tel,
                )}
            >
              <PhoneSolid
                slot="left"
                class="w-5 h-5 text-gray-500 dark:text-gray-400"
              />
            </Input>
          {:else if field.custom_field_type?.includes("password")}
            <ButtonGroup class="w-full">
              <Input
                id={key}
                disabled={!field.editable && field.value != null}
                required={field.required}
                bind:value={newResponses[key]}
                type={show ? "text" : "password"}
                placeholder="Password"
                autocomplete={field.custom_field_type === "new-password"
                  ? "new-password"
                  : "current-password"}
              />
              <InputAddon>
                <button type="button" onclick={() => (show = !show)}>
                  {#if show}
                    <EyeOutline class="w-4 h-4" />
                  {:else}
                    <EyeSlashOutline class="w-4 h-4" />
                  {/if}
                </button>
              </InputAddon>
            </ButtonGroup>
          {:else if field.custom_field_type === "multiple_choice"}
            {#each field.choices as choice}
              <div class="checkbox">
                <Radio
                  bind:group={newResponses[key]}
                  value={choice}
                  disabled={!field.editable && field.value != null}
                >
                  <p>{choice}</p>
                </Radio>
              </div>
            {/each}
          {:else if field.custom_field_type === "checkboxes"}
            {#each field.choices as choice}
              <div class="checkbox">
                <Checkbox
                  disabled={!field.editable && field.value != null}
                  checked={(newResponses[key] || "")
                    .split(";")
                    .map((x: string) => x.trim())
                    .filter((v: string) => v)
                    .includes(choice)}
                  on:change={() => handleCheckboxChange(key, choice)}
                >
                  <p>{choice}</p>
                </Checkbox>
              </div>
            {/each}
          {:else if field.custom_field_type === "toggle"}
            <div class="toggle">
              <Toggle
                disabled={!field.editable && field.value != null}
                checked={newResponses[key]}
                on:change={() => {
                  newResponses[key] = !newResponses[key];
                }}
              >
                <svelte:fragment slot="offLabel">
                  <span>
                    {field.label}
                    {#if field.required}
                      <span class="text-red-600">*</span>
                    {/if}
                  </span>
                </svelte:fragment>
              </Toggle>
            </div>
          {:else if field.custom_field_type === "paragraph"}
            <Textarea
              bind:value={newResponses[key]}
              placeholder={field.placeholder}
              required={field.required}
              disabled={!field.editable && field?.value != null}
              rows={5}
            />
          {:else}
            <Input
              id={key}
              bind:value={newResponses[key]}
              type="text"
              required={field.required}
              disabled={!field.editable && field?.value != null}
              placeholder={field.placeholder}
              color={validationErrors[key] ? "red" : "base"}
              on:blur={() => {
                newResponses[key] = newResponses[key]
                  ? newResponses[key].trim()
                  : newResponses[key];
                validateInput(
                  key,
                  newResponses[key],
                  field.regex,
                  field.regex_error_message,
                );
              }}
            />
          {/if}

          {#if validationErrors[key]}
            <Helper class="mb-3" color="red">
              Error: {validationErrors[key]}
            </Helper>
          {/if}
        </div>
      {/if}
    {/each}

    <Button type="submit" pill>{buttonText}</Button>
  </form>
</div>

<style>
  .registrationForm {
    padding: 30px;
  }

  form {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    border-radius: 20px;
  }

  /* Only apply the border when showBorder is true */
  form.bordered {
    border: 3px solid var(--primary-light);
  }

  .checkbox {
    margin-bottom: 5px;
    display: flex;
    justify-content: left;
  }

  :global(.checkbox label) {
    display: flex;
    align-items: flex-start;
  }

  :global(.toggle label) {
    padding: 0;
  }

  :global(.checkbox label p) {
    padding: 0;
    margin: 0;
    line-height: 1;
    font-size: 14px;
  }

  :global(#datepicker-dropdown) {
    min-width: 320px !important; /* Adjust as needed */
    max-width: 400px !important;
  }

  /* Expand the internal calendar layout */
  :global(#datepicker-dropdown .grid) {
    display: grid !important;
    grid-template-columns: repeat(7, minmax(40px, 1fr)) !important;
    gap: 4px !important; /* Adds spacing between days */
  }

  /* Ensure individual date buttons fit properly */
  :global(#datepicker-dropdown button[role="gridcell"]) {
    width: 100% !important;
    height: 40px !important; /* Adjust height */
    text-align: center;
  }
</style>
