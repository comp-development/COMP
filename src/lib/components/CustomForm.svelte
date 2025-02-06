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
    } from "flowbite-svelte";
    import { EnvelopeSolid, PhoneSolid } from "flowbite-svelte-icons";

    let {
        title = null,
        fields = [],
        custom_fields = [],

        validationErrors = $bindable({}),
        newResponses = $bindable({}),
        handleSubmit,
    } = $props();

    let initialResponses = $state({});

    $effect(() => {
        for (var field of [...fields, ...custom_fields]) {
            const key = field.event_custom_field_id ?? field.name;
            initialResponses[key] =
                field?.value;
            newResponses[key] = field?.value;
        }
    });
    const typePatterns = {
        date: /^\d{4}-\d{2}-\d{2}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        tel: /^\d{3}-\d{3}-\d{4}$/,
    };

    function validateInput(key, value, regex) {
        if (regex) {
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
                        validationErrors[key] = `Please select at least one option for "${field.label}"`;
                    } else {
                        validationErrors[key] = null;
                    }
                } else if (field.custom_field_type === "multiple_choice") {
                    if (!newResponses[key]) {
                        validationErrors[key] = `Please select an option for "${field.label}"`;
                    } else {
                        validationErrors[key] = null;
                    }
                }
            }
        }

        return !Object.values(validationErrors).some(error => error !== null);
    }

    function handleFormSubmit(event) {
        event.preventDefault();

        if (validateForm()) {
            handleSubmit(event);
        }
    }

    function handleCheckboxChange(key, value) {
        let selectedValues = (newResponses[key] || "").split(",").map(v => v.trim()).filter(v => v);
        
        if (selectedValues.includes(value)) {
            selectedValues = selectedValues.filter(v => v !== value);
        } else {
            selectedValues.push(value);
        }

        newResponses[key] = selectedValues.length === 1 
            ? selectedValues[0] 
            : selectedValues.join(", ");
    }
</script>

<div class="registrationForm">
    {#if title}
        <h2>{title}</h2>
    {/if}
    <form onsubmit={handleFormSubmit}>
        {#each [...fields, ...custom_fields] as field}
            {@const key = field.event_custom_field_id ?? field.name}
            {#if !field.hidden}
                <div class="text-left mb-6">
                    <Label
                        for={key}
                        class="block mb-2"
                        color={validationErrors[key]
                            ? "red"
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
                            disabled={!field.editable &&
                                initialResponses[key] !== null}
                            items={[
                                ...(field.required
                                    ? []
                                    : [{ value: null, name: "None" }]),
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
                            disabled={!field.editable}
                            on:blur={() =>
                                validateInput(
                                    key,
                                    newResponses[key],
                                    typePatterns.date,
                                )}
                        />
                    
                    {:else if field.custom_field_type === "email"}
                        <Input
                            type="email"
                            id={key}
                            placeholder={field.placeholder}
                            bind:value={newResponses[key]}
                            required={field.required}
                            on:blur={() =>
                                validateInput(
                                    key,
                                    newResponses[key],
                                    typePatterns.email,
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
                            placeholder={field.placeholder}
                            bind:value={newResponses[key]}
                            required={field.required}
                            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                            on:blur={() =>
                                validateInput(
                                    key,
                                    newResponses[key],
                                    typePatterns.tel,
                                )}
                        >
                            <PhoneSolid
                                slot="left"
                                class="w-5 h-5 text-gray-500 dark:text-gray-400"
                            />
                        </Input>
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
                                    checked={(newResponses[key] || "").split(",").includes(choice)}
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
                            disabled={!field.editable}
                            rows={5}
                        />
                    {:else}
                        <Input
                            id={key}
                            bind:value={newResponses[key]}
                            type="text"
                            required={field.required}
                            disabled={!field.editable}
                            placeholder={field.placeholder}
                            color={validationErrors[key] ? "red" : "base"}
                            on:blur={() => {
                                newResponses[key] = newResponses[key] ? newResponses[key].trim() : newResponses[key];
                                validateInput(
                                    key,
                                    newResponses[key],
                                    field.regex,
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

        <Button type="submit" pill>Submit</Button>
    </form>
</div>

<style>
    .registrationForm {
        padding: 30px;
    }

    form {
        border: 3px solid var(--primary-tint);
        padding: 20px;
        max-width: 800px;
        margin: 0 auto;
        border-radius: 20px;
    }
</style>
