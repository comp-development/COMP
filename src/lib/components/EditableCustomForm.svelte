<script lang="ts">
    import {
        Button,
        Input,
        Popover,
        Label,
        Modal,
        Checkbox,
    } from "flowbite-svelte";
    import {
        CalendarMonthOutline,
        TextSizeOutline,
        ParagraphOutline,
        CheckCircleOutline,
        ListOutline,
        EnvelopeOutline,
        PhoneOutline,
        TrashBinOutline,
        CaretDownOutline,
        ChevronDownOutline,
        CaretSortOutline,
        CirclePlusSolid,
    } from "flowbite-svelte-icons";
    import ConfirmationModal from "$lib/components/ConfirmationModal.svelte";
    import TableName from "$lib/components/TableName.svelte";
    import { getCustomFields } from "$lib/supabase";
    import toast from "$lib/toast.svelte";
    import { handleError } from "$lib/handleError";

    let { custom_fields = $bindable(), action, host_id, table, editableHostFields } = $props();
    let showCustomFieldModal = $state(false);
    let availableCustomFields = $state([]);
    let originalCustomFields = $state("");

    async function onLoad() {
        availableCustomFields = await getCustomFields(host_id, table);
        originalCustomFields = JSON.stringify(custom_fields);
    }

    onLoad();

    // Fetch custom fields when modal opens
    async function openCustomFieldModal() {
        try {
            showCustomFieldModal = true;
            console.log("AVAILABLE CUSTOM FIELDS", availableCustomFields);
        } catch (error) {
            handleError(error);
        }
    }

    const inputTypes = [
        { icon: TextSizeOutline, type: "text", tooltip: "Text" },
        { icon: CalendarMonthOutline, type: "date", tooltip: "Date" },
        { icon: ParagraphOutline, type: "paragraph", tooltip: "Paragraph" },
        { icon: CheckCircleOutline, type: "checkboxes", tooltip: "Checkboxes" },
        {
            icon: ListOutline,
            type: "multiple_choice",
            tooltip: "Multiple Choice",
        },
        { icon: CaretDownOutline, type: "dropdown", tooltip: "Dropdown" },
        { icon: EnvelopeOutline, type: "email", tooltip: "Email" },
        { icon: PhoneOutline, type: "phone", tooltip: "Number" },
        {
            icon: CirclePlusSolid,
            type: "add_existing",
            tooltip: "Add Existing Field",
            onClick: openCustomFieldModal,
        },
    ];

    // Generate unique IDs for each button
    const buttonIds = inputTypes.map(
        () => `button-${Math.random().toString(36).substr(2, 9)}`,
    );

    let showDeleteModal = $state(false);
    let fieldToDelete: number | null = $state(null);

    // Track which sections are expanded using a simple object
    let expandedSections = $state({});
    let draggedIndex: number | null = null;

    // Simplified toggle function
    function toggleSection(index: number) {
        expandedSections[index] = !expandedSections[index];
    }

    // Drag and Drop handlers
    function handleDragStart(e: DragEvent, index: number) {
        draggedIndex = index;
        if (e.target instanceof HTMLElement) {
            e.target.style.opacity = "0.4";
        }
    }

    function handleDragEnd(e: DragEvent) {
        if (e.target instanceof HTMLElement) {
            e.target.style.opacity = "1";
        }
        draggedIndex = null;
    }

    function handleDragOver(e: DragEvent, index: number) {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const items = [...custom_fields];
        const draggedItem = items[draggedIndex];

        items.splice(draggedIndex, 1);
        items.splice(index, 0, draggedItem);

        custom_fields = items;
        draggedIndex = index;
    }

    function addField(type: string) {
        const newField = {
            key: "",
            label: "",
            required: false,
            regex: null,
            placeholder: "",
            value: null,
            choices: ["checkboxes", "multiple_choice", "dropdown"].includes(
                type,
            )
                ? ""
                : null,
            editable: true,
            hidden: false,
            custom_field_type: type,
        };
        custom_fields = [...custom_fields, newField];
        expandedSections[custom_fields.length - 1] = true;
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

    // Add a function to get the icon component based on type
    function getIconForType(type: string) {
        return inputTypes.find((t) => t.type === type)?.icon;
    }

    // Add a function to get a formatted title for the type
    function getTypeTitle(type: string) {
        return (
            type
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ") + " Field"
        );
    }

    function selectCustomField(_, field) {
        custom_fields = [...custom_fields, field];
        showCustomFieldModal = false;
    }

    function isFieldEditable(field) {
        return editableHostFields !== false || !field.host_id;
    }

    async function handleSubmit() {
        try {
            const invalidFields = custom_fields.filter(
                (field) => !field.label?.trim() || !field.key?.trim(),
            );

            if (invalidFields.length > 0) {
                const fieldTypes = invalidFields
                    .map((field) => getTypeTitle(field.custom_field_type))
                    .join(", ");
                throw new Error(
                    `All fields must have both a label and key. Please check: ${fieldTypes}`,
                );
            }

            console.log("custom_fields", custom_fields);

            await action();

            toast.success("Custom fields saved successfully");
        } catch (error) {
            handleError(error);
        }
    }
</script>

<div class="space-y-2">
    <h2>Custom Field Builder</h2>
    {#if JSON.stringify(custom_fields) !== originalCustomFields}
        <Button pill on:click={handleSubmit}>Submit</Button>
    {/if}

    <div class="flex gap-2 rounded-lg">
        {#each inputTypes as { icon: Icon, type, tooltip, onClick }, i}
            <div class="relative">
                <Button
                    id={buttonIds[i]}
                    size="sm"
                    color="light"
                    class="p-2.5"
                    on:click={onClick || (() => addField(type))}
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

    <!-- Draggable Fields -->
    <div class="space-y-4">
        {#each custom_fields as field, index}
            <div
                class="p-4 border rounded-lg relative editable-field"
                draggable="true"
                on:dragstart={(e) => handleDragStart(e, index)}
                on:dragend={handleDragEnd}
                on:dragover={(e) => handleDragOver(e, index)}
            >
                <Button
                    class="absolute top-2 right-2"
                    color="red"
                    size="xs"
                    onclick={(e) => {
                        e.preventDefault();
                        confirmDelete(index);
                    }}
                >
                    <TrashBinOutline class="w-4 h-4" />
                </Button>

                <div class="absolute top-2 left-2 flex">
                    <div class="cursor-move">
                        <CaretSortOutline class="w-4 h-4 text-gray-500" />
                    </div>
                    <div class:rotate-180={expandedSections[index]}>
                        <ChevronDownOutline
                            class="w-4 h-4 text-gray-500"
                            onclick={() => toggleSection(index)}
                        />
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <Button size="xs" color="light" class="p-1.5">
                        <svelte:component
                            this={getIconForType(field.custom_field_type)}
                            class="w-4 h-4"
                        />
                    </Button>
                    <h3 class="text-lg font-semibold">
                        {field.key}
                    </h3>
                </div>

                {#if expandedSections[index]}
                    <div class="mt-8 space-y-4">
                        <!-- Field Label and Key -->
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <Label for="key-{index}" class="mb-2 text-left"
                                    >Field Key<span class="text-red-600 ml-1"
                                        >*</span
                                    ></Label
                                >
                                <Input
                                    id="key-{index}"
                                    type="text"
                                    required
                                    disabled={!isFieldEditable(field)}
                                    bind:value={field.key}
                                />
                            </div>
                            <div>
                                <Label
                                    for="label-{index}"
                                    class="mb-2 text-left"
                                    >Field Label<span class="text-red-600 ml-1"
                                        >*</span
                                    ></Label
                                >
                                <Input
                                    id="label-{index}"
                                    type="text"
                                    required
                                    disabled={!isFieldEditable(field)}
                                    bind:value={field.label}
                                />
                            </div>
                            <div>
                                <Label
                                    for="label-{index}"
                                    class="mb-2 text-left">Help Text</Label
                                >
                                <Input
                                    id="label-{index}"
                                    type="text"
                                    disabled={!isFieldEditable(field)}
                                    bind:value={field.help_text}
                                />
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-4">
                            {#if !["email", "phone"].includes(field.custom_field_type)}
                                <div>
                                    <Label
                                        for="label-{index}"
                                        class="mb-2 text-left">Regex</Label
                                    >
                                    <Input
                                        id="label-{index}"
                                        type="text"
                                        disabled={!isFieldEditable(field)}
                                        bind:value={field.regex}
                                    />
                                </div>
                            {/if}

                            {#if !["multiple_choice", "checkboxes", "dropdown"].includes(field.custom_field_type)}
                                <div>
                                    <Label
                                        for="label-{index}"
                                        class="mb-2 text-left"
                                        >Placeholder</Label
                                    >
                                    <Input
                                        id="label-{index}"
                                        type="text"
                                        disabled={!isFieldEditable(field)}
                                        bind:value={field.placeholder}
                                    />
                                </div>
                            {:else}
                                <div>
                                    <Label
                                        for="label-{index}"
                                        class="mb-2 text-left">Choices</Label
                                    >
                                    <Input
                                        id="label-{index}"
                                        type="text"
                                        disabled={!isFieldEditable(field)}
                                        placeholder="Separate with a comma"
                                        value={Array.isArray(field.choices)
                                            ? field.choices.join(", ")
                                            : field.choices}
                                        on:input={(e) => {
                                            const choicesArray =
                                                e.currentTarget.value
                                                    .split(",")
                                                    .map((choice) =>
                                                        choice.trim(),
                                                    )
                                                    .filter(Boolean);
                                            field.choices = choicesArray;
                                        }}
                                    />
                                </div>
                            {/if}
                            <div>
                                <div class="flex-content max-w-[200px] mt-1">
                                    <Checkbox bind:checked={field.required} disabled={!isFieldEditable(field)}>
                                        Required
                                    </Checkbox>
                                </div>
                                <div class="flex-content max-w-[200px]">
                                    <Checkbox bind:checked={field.hidden} disabled={!isFieldEditable(field)}>
                                        Hidden
                                    </Checkbox>
                                </div>
                                <div class="flex-content max-w-[200px]">
                                    <Checkbox bind:checked={field.editable} disabled={!isFieldEditable(field)}>
                                        Editable
                                    </Checkbox>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>

<!-- Custom Fields Modal -->
<Modal bind:open={showCustomFieldModal} size="xl">
    <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-4">
        Select Custom Field
    </h3>
    <TableName
        items={availableCustomFields}
        columns={[
            {
                label: "Label",
                value: (item) => item.label,
                sortable: true,
            },
            {
                label: "Key",
                value: (item) => item.key,
                sortable: true,
            },
            {
                label: "Type",
                value: (item) => item.custom_field_type,
                sortable: true,
            },
            {
                label: "Recipient",
                value: (item) => item.custom_field_table,
                sortable: true,
            },
        ]}
        actionType="select"
        action={selectCustomField}
    />
</Modal>

<ConfirmationModal
    isShown={showDeleteModal}
    actionName="delete this custom field"
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
        grid-template-columns: 31% 31% 31%;
    }

    .rotate-180 {
        transform: rotate(180deg);
    }

    .cursor-move {
        cursor: move;
    }

    .flex-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    :global(.flex-content .cursor-pointer) {
        background-color: transparent;
    }

    :global(div[role="tabpanel"]) {
        background: transparent;
    }
</style>
