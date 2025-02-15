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
  } from "flowbite-svelte";
  import {
    EnvelopeSolid,
    EyeOutline,
    EyeSlashOutline,
    PhoneSolid,
  } from "flowbite-svelte-icons";
  import toast from "$lib/toast.svelte";

  let {
    title = null,
    fields = [],
    custom_fields = [],
    showBorder = true,
    validationErrors = $bindable({}),
    newResponses = $bindable({}),
    handleSubmit,
  } = $props();

  let initialResponses = $state({});
  let show = $state(false);

  $effect(() => {
    for (var field of [...fields, ...custom_fields]) {
      const key = field.event_custom_field_id ?? field.name;
      initialResponses[key] = field?.value;
      newResponses[key] = field?.value;
    }
    console.log(fields, custom_fields);
  });
  const typePatterns = {
    date: /^\d{4}-\d{2}-\d{2}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    tel: /^\d{10}$/,
  };

  function validateInput(key, value, regex) {
    if (regex && value) {
      const pattern = new RegExp(regex);
      validationErrors[key] = !pattern.test(value)
        ? `Please follow the format: ${regex}`
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

  async function handleFormSubmit(event) {
    event.preventDefault();

    if (validateForm()) {
      await handleSubmit(event);
    }
  }

  function handleCheckboxChange(key, value) {
    let selectedValues = (newResponses[key] || "")
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v);

    if (selectedValues.includes(value)) {
      selectedValues = selectedValues.filter((v) => v !== value);
    } else {
      selectedValues.push(value);
    }

    newResponses[key] =
      selectedValues.length === 1
        ? selectedValues[0]
        : selectedValues.join(", ");
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
          <Label
            for={key}
            class="block mb-2"
            color={validationErrors[key]
              ? "red"
              : !field.editable && field?.value !== null
                ? "disabled"
                : "base"}
          >
            {field.label}
            {#if field.required}
              <span class="text-red-600">*</span>
            {/if}
          </Label>

          {#if field.help_text !== null}
            <Helper class="mb-3">{field.help_text}</Helper>
          {/if}

          {#if field.custom_field_type === "dropdown"}
            <Select
              class="mt-2"
              required={field.required}
              disabled={!field.editable && field?.value !== null}
              items={[
                ...(field.required ? [] : [{ value: null, name: "None" }]),
                ...field.choices.map((choice) => ({
                  value: choice,
                  name: choice,
                })),
              ]}
              bind:value={newResponses[key]}
            />
          {:else if field.custom_field_type === "date"}
            <Datepicker
              bind:value={newResponses[key]}
              required={field.required}
              placeholder={field.placeholder}
              disabled={!field.editable && field?.value !== null}
              on:blur={() =>
                validateInput(key, newResponses[key], typePatterns.date)}
            />
          {:else if field.custom_field_type === "email"}
            <Input
              type="email"
              id={key}
              placeholder={field.placeholder ?? "handle@domain.com"}
              bind:value={newResponses[key]}
              disabled={field.disabled}
              required={field.required}
              on:blur={() =>
                validateInput(key, newResponses[key], typePatterns.email)}
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
              bind:value={newResponses[key]}
              on:input={(e) => {
                let rawValue = e.target.value.replace(/\D/g, "").slice(0, 10);

                let formattedValue = rawValue;
                if (rawValue.length > 6) {
                  formattedValue = `${rawValue.slice(0, 3)}-${rawValue.slice(3, 6)}-${rawValue.slice(6)}`;
                } else if (rawValue.length > 3) {
                  formattedValue = `${rawValue.slice(0, 3)}-${rawValue.slice(3)}`;
                }

                e.target.value = formattedValue;
                newResponses[key] = rawValue;
              }}
              required={field.required}
              disabled={field.disabled}
              on:blur={() =>
                validateInput(key, newResponses[key], typePatterns.tel)}
            >
              <PhoneSolid
                slot="left"
                class="w-5 h-5 text-gray-500 dark:text-gray-400"
              />
            </Input>
          {:else if field.custom_field_type === "password"}
            <ButtonGroup class="w-full">
              <Input
                id={key}
                disabled={field.disabled}
                required={field.required}
                bind:value={newResponses[key]}
                type={show ? "text" : "password"}
                placeholder="Password"
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
              <div style="display: flex; align-items: left">
                <Radio
                  bind:group={newResponses[key]}
                  value={choice}
                  label={choice}>{choice}</Radio
                >
              </div>
            {/each}
          {:else if field.custom_field_type === "checkboxes"}
            {#each field.choices as choice}
              <div style="display: flex; align-items: left">
                <Checkbox
                  disabled={!field.editable && field?.value !== null}
                  checked={(newResponses[key] || "")
                    .split(",")
                    .includes(choice)}
                  on:change={() => handleCheckboxChange(key, choice)}
                >
                  {choice}
                </Checkbox>
              </div>
            {/each}
          {:else if field.custom_field_type === "paragraph"}
            <Textarea
              bind:value={newResponses[key]}
              placeholder={field.placeholder}
              required={field.required}
              disabled={!field.editable && field?.value !== null}
              rows={5}
            />
          {:else}
            <Input
              id={key}
              bind:value={newResponses[key]}
              type="text"
              required={field.required}
              disabled={!field.editable && field?.value !== null}
              placeholder={field.placeholder}
              color={validationErrors[key] ? "red" : "base"}
              on:blur={() => {
                newResponses[key] = newResponses[key]
                  ? newResponses[key].trim()
                  : newResponses[key];
                validateInput(key, newResponses[key], field.regex);
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

    <Button type="submit" pill>Submit</Button>
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
    border: 3px solid var(--primary-tint);
  }
</style>
