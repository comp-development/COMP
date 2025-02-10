<script lang="ts">
    import { Button, Toggle, Input, Popover, Label } from 'flowbite-svelte';
    import {
        CalendarMonthOutline,
        TextSizeOutline,
        ParagraphOutline,
        CheckCircleOutline,
        ListOutline,
        EnvelopeOutline,
        PhoneOutline,
        TrashBinOutline,
        CaretDownOutline
    } from 'flowbite-svelte-icons';
    import ConfirmationModal from './ConfirmationModal.svelte';

    export let custom_fields: any[] = [];

    const inputTypes = [
        { icon: TextSizeOutline, type: 'text', tooltip: 'Text' },
        { icon: CalendarMonthOutline, type: 'date', tooltip: 'Date' },
        { icon: ParagraphOutline, type: 'paragraph', tooltip: 'Paragraph' },
        { icon: CheckCircleOutline, type: 'checkboxes', tooltip: 'Checkboxes' },
        { icon: ListOutline, type: 'multiple_choice', tooltip: 'Multiple Choice' },
        { icon: CaretDownOutline, type: 'dropdown', tooltip: 'Dropdown' },
        { icon: EnvelopeOutline, type: 'email', tooltip: 'Email' },
        { icon: PhoneOutline, type: 'number', tooltip: 'Number' }
    ];

    // Generate unique IDs for each button
    const buttonIds = inputTypes.map(() => `button-${Math.random().toString(36).substr(2, 9)}`);

    let showDeleteModal = false;
    let fieldToDelete: number | null = null;

    function addField(type: string) {
        const newField = {
            event_custom_field_id: crypto.randomUUID(),
            key: '',
            label: '',
            required: false,
            regex: null,
            placeholder: '',
            value: null,
            choices: ['checkboxes', 'multiple_choice', 'dropdown'].includes(type) ? [] : null,
            editable: true,
            hidden: false,
            custom_field_type: type
        };
        custom_fields = [...custom_fields, newField];
    }

    function confirmDelete(index: number) {
        fieldToDelete = index;
        showDeleteModal = true;
    }

    function removeField() {
        if (fieldToDelete !== null) {
            custom_fields = custom_fields.filter((_, i) => i !== fieldToDelete);
            showDeleteModal = false;
            fieldToDelete = null;
        }
    }

    function addChoice(fieldIndex: number) {
        if (custom_fields[fieldIndex].choices) {
            custom_fields[fieldIndex].choices = [...custom_fields[fieldIndex].choices, ''];
            custom_fields = [...custom_fields];
        }
    }

    function removeChoice(fieldIndex: number, choiceIndex: number) {
        if (custom_fields[fieldIndex].choices) {
            custom_fields[fieldIndex].choices = custom_fields[fieldIndex].choices.filter((_, i) => i !== choiceIndex);
            custom_fields = [...custom_fields];
        }
    }

    // Add a function to get the icon component based on type
    function getIconForType(type: string) {
        return inputTypes.find(t => t.type === type)?.icon;
    }

    // Add a function to get a formatted title for the type
    function getTypeTitle(type: string) {
        return type.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') + ' Field';
    }
</script>

<div class="space-y-6">
    <!-- Input Type Selection Bar -->
    <div class="flex gap-2 p-4 bg-gray-50 rounded-lg">
        {#each inputTypes as {icon: Icon, type, tooltip}, i}
            <div class="relative">
                <Button
                    id={buttonIds[i]}
                    size="sm"
                    color="light"
                    class="p-2.5"
                    on:click={() => addField(type)}
                >
                    <svelte:component this={Icon} class="w-4 h-4" />
                </Button>
                <Popover
                    triggeredBy="#{buttonIds[i]}"
                    class="w-36 text-sm bg-white font-normal"
                >
                    <div class="p-2">
                        {tooltip}
                    </div>
                </Popover>
            </div>
        {/each}
    </div>

    <div class="space-y-4">
        {#each custom_fields as field, index}
            <div class="p-4 border rounded-lg relative editable-field">
                <Button
                    class="absolute top-2 right-2"
                    color="red"
                    size="xs"
                    on:click={() => confirmDelete(index)}
                >
                    <TrashBinOutline class="w-4 h-4" />
                </Button>

                <!-- Type header -->
                <div class="flex items-center gap-2 mb-6">
                    <svelte:component 
                        this={getIconForType(field.custom_field_type)} 
                        class="w-5 h-5"
                    />
                    <h3 class="text-lg font-semibold">
                        {getTypeTitle(field.custom_field_type)}
                    </h3>
                </div>

                <div class="mt-8 space-y-4">
                    <!-- Field Label and Key in two columns -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <Label for="label-{index}" class="mb-2 text-left">Field Label</Label>
                            <Input
                                id="label-{index}"
                                type="text"
                                bind:value={field.label}
                                placeholder="Enter field label"
                            />
                        </div>
                        <div>
                            <Label for="key-{index}" class="mb-2 text-left">Field Key</Label>
                            <Input
                                id="key-{index}"
                                type="text"
                                bind:value={field.key}
                                placeholder="Enter field key"
                            />
                        </div>
                    </div>

                    <!-- Toggles stacked vertically -->
                    <div class="flex-content">
                        <div class="flex-content max-w-[200px]">
                            <Label class="mb-0">Required</Label>
                            <Toggle bind:checked={field.required} />
                        </div>
                        <div class="flex-content max-w-[200px]">
                            <Label class="mb-0">Hidden</Label>
                            <Toggle bind:checked={field.hidden} />
                        </div>
                        <div class="flex-content max-w-[200px]">
                            <Label class="mb-0">Editable</Label>
                            <Toggle bind:checked={field.editable} />
                        </div>
                    </div>

                    {#if ['multiple_choice', 'checkboxes', 'dropdown'].includes(field.custom_field_type)}
                        <div class="space-y-2">
                            <div>
                                <Label>Choices</Label>
                                <Button
                                    size="xs"
                                    pill
                                    outline
                                    on:click={() => addChoice(index)}
                                >
                                    Add Choice
                                </Button>
                            </div>
                            {#each field.choices as choice, choiceIndex}
                                <div class="flex gap-2">
                                    <Input
                                        type="text"
                                        bind:value={field.choices[choiceIndex]}
                                        placeholder={`Choice ${choiceIndex + 1}`}
                                    />
                                    <Button
                                        color="red"
                                        size="xs"
                                        on:click={() => removeChoice(index, choiceIndex)}
                                    >
                                        <TrashBinOutline class="w-4 h-4" />
                                    </Button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</div>

<ConfirmationModal
    bind:isShown={showDeleteModal}
    text="Are you sure you want to delete this field?"
    onCancel={() => {
        showDeleteModal = false;
        fieldToDelete = null;
    }}
    onConfirm={removeField}
/>

<style>
    .editable-field {
        border: 3px solid var(--primary-tint);
        border-radius: 10px;
    }

    :global(.text-left) {
        text-align: left !important;
    }

    .grid {
        grid-template-columns: 65% 32%;
    }

    .flex-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    :global(.flex-content .cursor-pointer) {
        background-color: transparent;
    }
</style>