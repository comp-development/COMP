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
        title,
        fields = [],
        custom_fields = [],
        initialResponses = $bindable(),
        validationErrors = $bindable(),
        newResponses = $bindable(),
        handleSubmit,
    } = $props();

    const typePatterns = {
        date: /^\d{4}-\d{2}-\d{2}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        tel: /^\d{3}-\d{3}-\d{4}$/,
    };

    $effect(() => {
        console.log("INITIAL RESPONSES", initialResponses);
        console.log("Fields", fields);
        console.log("custom_fields_form", custom_fields);

        for (var field of [...fields, ...custom_fields]) {
            console.log("FIELD", field);
            initialResponses[field?.custom_field_id] = field?.value;
            newResponses[field?.custom_field_id] = field?.value;
        }
        console.log("INITIAL RESPONSES", initialResponses);
        console.log("NEW RESPONSES", newResponses);
    });

    function validateInput(key, value, regex) {
        console.log("custom_fields_form", custom_fields);
        console.log();
        if (regex) {
            const pattern = new RegExp(regex);
            validationErrors[key] = !pattern.test(value)
                ? `Please follow the format: ${regex}`
                : null;
        } else {
            validationErrors[key] = null;
        }
    }
</script>

<div class="registrationForm">
    {#if title}
        <h2>{title}</h2>
    {/if}
    <form onsubmit={handleSubmit}>
        {#each [...fields, ...custom_fields] as field}
            {#if !field.hidden}
                <div class="text-left mb-6">
                    <Label
                        for={field.custom_field_id}
                        class="block mb-2"
                        color={validationErrors[field.custom_field_id]
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
                                initialResponses[field.custom_field_id]}
                            items={[
                                ...(field.required
                                    ? []
                                    : [{ value: null, name: "None" }]),
                                ...field.choices.map((choice) => ({
                                    value: choice,
                                    name: choice,
                                })),
                            ]}
                            bind:value={newResponses[field.custom_field_id]}
                        />
                    {:else if field.custom_field_type === "date"}
                        <Datepicker
                            bind:value={newResponses[field.custom_field_id]}
                            required={field.required}
                            disabled={!field.editable}
                            on:blur={() =>
                                validateInput(
                                    field.custom_field_id,
                                    newResponses[field.custom_field_id],
                                    typePatterns.date,
                                )}
                        />
                    {:else if field.custom_field_type === "paragraph"}
                        <Textarea
                            bind:value={newResponses[field.custom_field_id]}
                            placeholder={field.placeholder}
                            required={field.required}
                            disabled={!field.editable}
                            rows={5}
                        />
                    {:else if field.custom_field_type === "email"}
                        <Input
                            type="email"
                            id={field.custom_field_id}
                            placeholder={field.placeholder}
                            bind:value={newResponses[field.custom_field_id]}
                            required={field.required}
                            on:blur={() =>
                                validateInput(
                                    field.custom_field_id,
                                    newResponses[field.custom_field_id],
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
                            id={field.custom_field_id}
                            type="tel"
                            placeholder={field.placeholder}
                            bind:value={newResponses[field.custom_field_id]}
                            required={field.required}
                            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                            on:blur={() =>
                                validateInput(
                                    field.custom_field_id,
                                    newResponses[field.custom_field_id],
                                    typePatterns.tel,
                                )}
                        >
                            <PhoneSolid
                                slot="left"
                                class="w-5 h-5 text-gray-500 dark:text-gray-400"
                            />
                        </Input>
                    {:else if field.custom_field_type === "multiple_choice"}
                        <div
                            style="display: block; align-items: left; justify-content: left;"
                        >
                            {#each field.choices as choice}
                                <Radio
                                    bind:group={newResponses[
                                        field.custom_field_id
                                    ]}
                                    value={choice}
                                    label={choice}>{choice}</Radio
                                >
                            {/each}
                        </div>
                    {:else if field.custom_field_type === "checkboxes"}
                        <div
                            style="display: block; align-items: left; justify-content: left;"
                        >
                            {#each field.choices as choice}
                                <Checkbox
                                    bind:group={newResponses[
                                        field.custom_field_id
                                    ]}
                                    value={choice}>{choice}</Checkbox
                                >
                            {/each}
                        </div>
                    {:else}
                        <Input
                            id={field.custom_field_id}
                            bind:value={newResponses[field.custom_field_id]}
                            type="text"
                            required={field.required}
                            disabled={!field.editable}
                            placeholder={field.placeholder}
                            color={validationErrors[field.custom_field_id]
                                ? "red"
                                : "base"}
                            on:blur={() =>
                                validateInput(
                                    field.custom_field_id,
                                    newResponses[field.custom_field_id],
                                    field.regex,
                                )}
                        />
                    {/if}

                    {#if validationErrors[field.custom_field_id]}
                        <Helper class="mb-3" color="red">
                            Error: {validationErrors[field.custom_field_id]}
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
