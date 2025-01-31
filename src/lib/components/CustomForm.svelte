<script lang="ts">
    import {
        Button,
        Input,
        InputAddon,
        ButtonGroup,
        Tabs,
        TabItem,
        Helper,
        Select,
        Label,
        Tooltip
    } from "flowbite-svelte";

    let { 
        title,
        fields = [],
        custom_fields = [],
        initialResponses = $bindable(),
        validationErrors = $bindable(),
        newResponses = $bindable(),
        handleSubmit
    } = $props();
    

    $effect(() => {
        console.log("INITIAL RESPONSES", initialResponses)
        console.log("Fields", fields)
        console.log("custom_fields_form", custom_fields)

        for (var field of [...fields, ...custom_fields]) {
            console.log("FIELD", field)
            initialResponses[field?.custom_field_id] = field?.value;
            newResponses[field?.custom_field_id] = field?.value;
        }
        console.log("INITIAL RESPONSES", initialResponses)
        console.log("NEW RESPONSES", newResponses)

    });

    function validateInput(key, value, regex) {
        console.log("custom_fields_form", custom_fields)
        console.log()
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
                    color={validationErrors[field.custom_field_id] ? "red" : "base"}
                >
                    {field.label}
                    {#if field.required}
                    <span class="text-red-600">*</span>
                    {/if}
                </Label>

                {#if field.help_text !== null}
                    <Helper class="mb-3">{field.help_text}</Helper>
                {/if}

                {#if field.choices !== null}
                    <Select
                    class="mt-2"
                    required={field.required}
                    disabled={!field.editable && initialResponses[field.custom_field_id]}
                    items={field.choices.map((choice) => ({
                        value: choice,
                        name: choice,
                    }))}
                    bind:value={newResponses[field.custom_field_id]}
                    />
                {:else}
                    <Input
                        id={field.custom_field_id}
                        bind:value={newResponses[field.custom_field_id]}
                        type="text"
                        required={field.required}
                        disabled={!field.editable && initialResponses[field.custom_field_id]}
                        pattern={field.regex || undefined}
                        placeholder={field.placeholder ?? field.label}
                        color={validationErrors[field.custom_field_id] ? "red" : "base"}
                        on:blur={() =>
                        validateInput(
                            field.custom_field_id,
                            newResponses[field.custom_field_id],
                            field.regex,
                        )}
                    />
                {/if}
                {#if validationErrors[field.custom_field_id]}
                    <Helper class="mb-3" color="red"
                    >Error: {validationErrors[field.custom_field_id]}</Helper
                    >
                {/if}
                </div>
            {/if}
        {/each}

        <Button type="submit" pill>Submit</Button>
    </form>
</div>