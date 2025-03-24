import { supabase, type AsyncReturnType } from "../supabaseClient";

export async function getAllEvents(select: string = "*") {
  const { data, error } = await supabase.from("events").select(select);
  if (error) throw error;
  return data;
}

export async function getAllHostEvents(
  host_id: number,
  customSelect: string = "*",
) {
  const { data, error } = await supabase
    .from("events")
    .select(customSelect)
    .eq("host_id", host_id);
  if (error) throw error;
  return data;
}

export async function getHostEvents(
  host_id: number,
  published: boolean = true,
  customSelect: string = "*",
) {
  const { data, error } = await supabase
    .from("events")
    .select(customSelect)
    .eq("host_id", host_id)
    .eq("published", published)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getEventInformation(event_id: number) {
  const { data, error } = await supabase
    .from("events")
    .select("*, host:hosts(*)")
    .eq("event_id", event_id)
    .single();
  if (error) throw error;
  return data;
}

export async function getEventTests(
  event_id: number,
  isAdmin: boolean = false,
) {
  let query = supabase.from("tests").select("*").eq("event_id", event_id);

  // Only filter by visibility if the user is not an admin
  if (!isAdmin) {
    query = query.eq("visible", true);
  }

  let { data, error } = await query.order("test_name");
  if (error) throw error;
  return data;
}

export async function getEventTeams(event_id: number) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("event_id", event_id);
  if (error) throw error;
  return data;
}

export async function getEventStudents(event_id: number) {
  const { data, error } = await supabase
    .from("student_events")
    .select("*, person:students(*)")
    .eq("event_id", event_id);
  if (error) throw error;
  return data;
}

export async function getCustomFields(
  host_id: number,
  table: "orgs" | "students" | "teams",
) {
  const { data, error } = await supabase
    .from("custom_fields")
    .select("*")
    .eq("host_id", host_id)
    .eq("custom_field_table", table);
  if (error) throw error;
  return data;
}

export async function getEventCustomFields(
  event_id: number,
  custom_field_table: "orgs" | "students" | "teams" = "students",
) {
  console.log("EVENT ID", event_id);
  const { data, error } = await supabase
    .from("event_custom_fields")
    .select("*, custom_fields!inner(*)") // join the custom_fields table using the foreign key
    .eq("event_id", event_id)
    .eq("custom_fields.custom_field_table", custom_field_table)
    .order("ordering");

  if (error) throw error;
  console.log("GET EVENT CUSTOM FIELDS", custom_field_table, data);

  const flattenedData = (data || []).map((record: any) => {
    if (record.custom_fields) {
      // Merge all properties from custom_fields into the parent record
      record = { ...record, ...record.custom_fields };
      delete record.custom_fields; // Remove the nested object
    }
    return record;
  });

  return flattenedData;
}

export async function getCustomFieldResponses(
  event_custom_fields: any,
  table_id: number,
  custom_field_table: "orgs" | "students" | "teams" = "students",
) {
  console.log(
    "getCustomFieldResponses",
    event_custom_fields,
    table_id,
    custom_field_table,
  );
  // Determine the column to filter by based on the custom_field_table
  const tableColumn =
    custom_field_table === "students"
      ? "student_event_id"
      : custom_field_table === "teams"
        ? "team_id"
        : "org_event_id";

  // Get the list of custom field IDs to fetch
  const eventCustomFieldIds = event_custom_fields.map(
    (field: any) => field.event_custom_field_id,
  );

  // Declare customFieldValues outside the if block
  let customFieldValues = [];

  // Fetch all relevant custom field values in one query
  if (table_id) {
    console.log("table_id", table_id);
    const { data, error } = await supabase
      .from("custom_field_values")
      .select("event_custom_field_id, value")
      .in("event_custom_field_id", eventCustomFieldIds)
      .eq(tableColumn, table_id);

    if (error) {
      throw error;
    }
    customFieldValues = data;
  }

  console.log("customFieldValues", customFieldValues);
  // Create a mapping of custom_field_id to value for quick lookup
  const valueMap = (customFieldValues || []).reduce(
    (map, row) => ({
      ...map,
      [row.event_custom_field_id]: row.value,
    }),
    {},
  );

  // Map the input fields with their corresponding values
  const fieldsWithValues = event_custom_fields.map((field: any) => ({
    ...field,
    value: valueMap[field.event_custom_field_id] || null,
  }));

  console.log("fieldsWithValues", fieldsWithValues);

  return fieldsWithValues ?? [];
}

export async function upsertCustomFieldResponses(
  custom_field_dict: Record<number, any>,
  table_id: number,
  custom_field_table: "orgs" | "students" | "teams" = "students",
) {
  // Determine the column to filter by based on the custom_field_table
  const tableColumn =
    custom_field_table === "students"
      ? "student_event_id"
      : custom_field_table === "teams"
        ? "team_id"
        : "org_event_id";

  // Prepare the data for upsert
  console.log("customFieldDict", custom_field_dict);
  const upsertData = Object.entries(custom_field_dict).map(
    ([event_custom_field_id, value]) => ({
      [tableColumn]: table_id,
      event_custom_field_id: parseInt(event_custom_field_id),
      value: value,
    }),
  );

  console.log("upsertData", upsertData);

  // Perform the upsert operation
  const { data, error } = await supabase
    .from("custom_field_values")
    .upsert(upsertData, {
      onConflict: ["event_custom_field_id", tableColumn],
    });

  if (error) {
    throw error;
  }

  return data;
}

/**
 *
 * @param student_id
 * @param event_id
 * @param options
 * @returns
 *
 * This function is used to upsert student events
 * this is useful for initially creating student_events,
 * as well as modifying the teams/orgs of existing student_events
 */

export async function upsertStudentEvent(
  student_id: string,
  event_id: number,
  options?: {
    team_id?: number | null;
    org_id?: number | null;
  },
) {
  const upsertData: any = { student_id, event_id };
  if (options?.team_id !== undefined) upsertData.team_id = options.team_id;
  if (options?.org_id !== undefined) upsertData.org_id = options.org_id;

  const { data, error } = await supabase
    .from("student_events")
    .upsert(upsertData, {
      onConflict: "student_id,event_id", // Specify the unique constraint
    })
    .select("*, teams(*, student_events(*, students(*))), org_events(*)")
    .single();
  if (error) throw error;
  console.log("upsertStudentEvent", data);
  return data;
}

export async function getStudentTeams(student_id: string) {
  const { data, error } = await supabase
    .from("student_events")
    .select("*, teams!inner(*, events!inner(*))")
    .eq("student_id", student_id);
  if (error) throw error;
  return data;
}

export async function resetStudentWaivers(event_id: number) {
  const { data, error } = await supabase
    .from("student_events")
    .update({ waiver: null })
    .eq("event_id", event_id);

  if (error) throw error;
  return data;
}

export async function getStudentEvents(student_id: string) {
  const { data, error } = await supabase
    .from("student_events")
    .select("*, event:events(*)")
    .eq("student_id", student_id);
  if (error) throw error;
  return data;
}

export async function getStudentHostEvents(
  student_id: string,
  host_id: number,
) {
  const { data, error } = await supabase
    .from("student_events")
    .select("*, event:events!inner(*)")
    .eq("student_id", student_id)
    .eq("event.host_id", host_id);
  if (error) throw error;
  return data;
}

export async function getCoachHostEvents(
  coach_id: string,
  host_id: number,
  org_id: number,
  published: boolean = true,
) {
  const { data: orgEventsData, error: orgEventsError } = await supabase
    .from("org_events")
    .select("event:events!inner(*)")
    .eq("org_id", org_id)
    .eq("event.host_id", host_id)
    .eq("event.published", published);
  if (orgEventsError) throw orgEventsError;

  return orgEventsData;
}

export type StudentEvent = AsyncReturnType<typeof getStudentEvent>;

export async function getStudentEvent(student_id: string, event_id: number) {
  const { data, error } = await supabase
    .from("student_events")
    .select(
      "*, student:students(*), team:teams(*, student_event:student_events(*, student:students(*))), org_event:org_events(*, org:orgs(*))",
    )
    .eq("student_id", student_id)
    .eq("event_id", event_id)
    .maybeSingle();
  console.log("getStudentEvent", data);
  if (error) throw error;
  return data;
}

export async function updateStudentEvent(
  student_event_id: number,
  studentEventData: {},
) {
  const { data, error } = await supabase
    .from("student_events")
    .update(studentEventData)
    .select("*")
    .eq("student_event_id", student_event_id);
  if (error) throw error;

  return data;
}

export async function getStudentTicketOrder(
  student_id: string,
  event_id: number,
) {
  const { data, error } = await supabase
    .from("ticket_orders")
    .select("*")
    .eq("student_id", student_id)
    .eq("event_id", event_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function isEventPublished(event_id: number, host_id: number) {
  const { data, error } = await supabase
    .from("events")
    .select("published")
    .eq("event_id", event_id)
    .eq("host_id", host_id)
    .single();
  if (error) throw error;

  return data?.published ?? false;
}

export async function updateEvent(event_id: number, eventData: any) {
  const { data, error } = await supabase
    .from("events")
    .update(eventData)
    .select("*")
    .eq("event_id", event_id);
  if (error) throw error;

  return data;
}

export async function getEventOrganizations(event_id: number) {
  const { data, error } = await supabase
    .from("org_events")
    .select(
      `
            *,
            org:orgs(
              *,
              coaches:org_coaches(
                *,
                person:coaches(*)
              )
            )
        `,
    )
    .eq("event_id", event_id);
  if (error) throw error;

  return data;
}

export async function getEventIndependentTeams(event_id: number) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("event_id", event_id)
    .is("org_id", null);
  if (error) throw error;
  return data;
}

export async function getSingularEventTeam(team_id: number, event_id: number) {
  const { data, error } = await supabase
    .from("teams")
    .select(`*`)
    .eq("team_id", team_id)
    .eq("event_id", event_id)
    .is("org_id", null);
  if (error) throw error;

  return data;
}

export async function createEvent(eventData: {
  event_name: string;
  event_date: string;
  ticket_price_cents: number;
  max_team_size: number;
  email: string;
  logo: string;
  summary: string;
  host_id: number;
  published?: boolean;
}) {
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...eventData,
      published: eventData.published ?? false,
      waivers: { type: "none" },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertEventCustomFields(
  custom_fields: any[],
  table: "orgs" | "students" | "teams",
  event_id: number,
) {
  console.log("upsertEventCustomFields", custom_fields);

  // Ensure custom_fields is an array
  const fieldsArray = Array.isArray(custom_fields)
    ? custom_fields
    : [custom_fields];

  // First, get all existing custom fields and event_custom_fields for this event
  const { data: existingEventFields, error: fetchError } = await supabase
    .from("event_custom_fields")
    .select("*, custom_fields(*)")
    .eq("event_id", event_id);

  if (fetchError) throw fetchError;

  // Create sets of IDs that currently exist in the database
  const existingEventCustomFieldIds = new Set(
    existingEventFields?.map((f) => f.event_custom_field_id),
  );
  const existingCustomFieldIds = new Set(
    existingEventFields?.map((f) => f.custom_field_id),
  );

  // Create sets of IDs that should remain after the update
  const remainingEventCustomFieldIds = new Set(
    fieldsArray
      .filter((f) => f.event_custom_field_id)
      .map((f) => f.event_custom_field_id),
  );
  const remainingCustomFieldIds = new Set(
    fieldsArray
      .filter((f) => f.custom_field_id && !f.host_id)
      .map((f) => f.custom_field_id),
  );

  // Delete event_custom_fields that are no longer present
  const eventCustomFieldsToDelete = [...existingEventCustomFieldIds].filter(
    (id) => !remainingEventCustomFieldIds.has(id),
  );

  if (eventCustomFieldsToDelete.length > 0) {
    const { error: deleteEventFieldsError0 } = await supabase
      .from("custom_field_values")
      .delete()
      .in("event_custom_field_id", eventCustomFieldsToDelete);

    if (deleteEventFieldsError0) throw deleteEventFieldsError0;

    const { error: deleteEventFieldsError } = await supabase
      .from("event_custom_fields")
      .delete()
      .in("event_custom_field_id", eventCustomFieldsToDelete);

    if (deleteEventFieldsError) throw deleteEventFieldsError;
  }

  // Delete custom_fields that are no longer present and don't have a host_id
  const customFieldsToDelete = [...existingCustomFieldIds]
    .filter((id) => !remainingCustomFieldIds.has(id))
    .filter((id) => {
      const field = existingEventFields?.find(
        (f) => f.custom_field_id === id,
      )?.custom_fields;
      return field && !field.host_id;
    });

  if (customFieldsToDelete.length > 0) {
    const { error: deleteCustomFieldsError } = await supabase
      .from("custom_fields")
      .delete()
      .in("custom_field_id", customFieldsToDelete);

    if (deleteCustomFieldsError) throw deleteCustomFieldsError;
  }

  // Continue with the existing upsert logic
  const formatFieldData = (field) => ({
    key: field.key,
    label: field.label,
    custom_field_type: field.custom_field_type,
    custom_field_table: table,
    choices: ["multiple_choice", "checkboxes", "dropdown"].includes(
      field.custom_field_type,
    )
      ? field.choices || []
      : null,
    help_text: field.help_text || null,
    regex: field.regex || null,
    required: field.required ?? false,
    editable: field.editable ?? true,
    hidden: field.hidden ?? false,
    ...(field.host_id ? { host_id: field.host_id } : { event_id: event_id }),
    placeholder: field.placeholder || null,
  });

  // Handle new and existing fields
  const newFields = fieldsArray.filter((field) => !field.custom_field_id);
  const existingFields = fieldsArray.filter((field) => field.custom_field_id);

  // Insert new custom fields
  let insertedCustomFields = [];
  if (newFields.length > 0) {
    const { data, error } = await supabase
      .from("custom_fields")
      .insert(newFields.map(formatFieldData))
      .select();
    if (error) throw error;
    insertedCustomFields = data || [];
  }

  // Update existing custom fields
  let updatedCustomFields = [];
  if (existingFields.length > 0) {
    const { data, error } = await supabase
      .from("custom_fields")
      .upsert(
        existingFields.map((field) => ({
          custom_field_id: field.custom_field_id,
          ...formatFieldData(field),
        })),
      )
      .select();
    if (error) throw error;
    updatedCustomFields = data || [];
  }

  // Update the mapping
  const customFieldIdMap = new Map(
    fieldsArray.map((field, index) => {
      if (field.custom_field_id) {
        return [index, field.custom_field_id];
      }
      const newField = insertedCustomFields[newFields.indexOf(field)];
      return [index, newField.custom_field_id];
    }),
  );

  const existingEventFields2 = fieldsArray.filter(
    (field) => field.event_custom_field_id,
  );
  const newEventFields = fieldsArray.filter(
    (field) => !field.event_custom_field_id,
  );

  // Handle event_custom_fields relationships
  let insertedEventFields = [];
  if (newEventFields.length > 0) {
    const { data, error } = await supabase
      .from("event_custom_fields")
      .insert(
        newEventFields.map((field, index) => ({
          custom_field_id: customFieldIdMap.get(fieldsArray.indexOf(field)),
          event_id: event_id,
          ordering: fieldsArray.indexOf(field) + 1,
        })),
      )
      .select();
    if (error) throw error;
    insertedEventFields = data || [];
  }

  let updatedEventFields = [];
  if (existingEventFields2.length > 0) {
    const { data, error } = await supabase
      .from("event_custom_fields")
      .upsert(
        existingEventFields2.map((field) => ({
          event_custom_field_id: field.event_custom_field_id,
          custom_field_id: customFieldIdMap.get(fieldsArray.indexOf(field)),
          event_id: event_id,
          ordering: fieldsArray.indexOf(field) + 1,
        })),
      )
      .select();
    if (error) throw error;
    updatedEventFields = data || [];
  }

  return [...insertedEventFields, ...updatedEventFields];
}

export async function upsertHostCustomFields(
  custom_fields: any[],
  table: "orgs" | "students" | "teams" | "waivers",
  host_id: number,
) {
  console.log("upsertHostCustomFields", custom_fields);

  // Ensure custom_fields is an array
  const fieldsArray = Array.isArray(custom_fields)
    ? custom_fields
    : [custom_fields];

  // First, get all existing custom fields and event_custom_fields for this event
  const { data: existingEventFields, error: fetchError } = await supabase
    .from("custom_fields")
    .select("*")
    .eq("host_id", host_id);

  if (fetchError) throw fetchError;

  const existingCustomFieldIds = new Set(
    existingEventFields?.map((f) => f.custom_field_id),
  );

  const remainingCustomFieldIds = new Set(
    fieldsArray
      .filter((f) => f.custom_field_id && !f.host_id)
      .map((f) => f.custom_field_id),
  );

  // Delete custom_fields that are no longer present and don't have a host_id
  const customFieldsToDelete = [...existingCustomFieldIds]
    .filter((id) => !remainingCustomFieldIds.has(id))
    .filter((id) => {
      const field = existingEventFields?.find(
        (f) => f.custom_field_id === id,
      )?.custom_fields;
      return field && !field.host_id;
    });

  if (customFieldsToDelete.length > 0) {
    const { error: deleteCustomFieldsError } = await supabase
      .from("custom_fields")
      .delete()
      .in("custom_field_id", customFieldsToDelete);

    if (deleteCustomFieldsError) throw deleteCustomFieldsError;
  }

  // Continue with the existing upsert logic
  const formatFieldData = (field) => ({
    key: field.key,
    label: field.label,
    custom_field_type: field.custom_field_type,
    custom_field_table: table,
    choices: ["multiple_choice", "checkboxes", "dropdown"].includes(
      field.custom_field_type,
    )
      ? field.choices || []
      : null,
    help_text: field.help_text || null,
    regex: field.regex || null,
    required: field.required ?? false,
    editable: field.editable ?? true,
    hidden: field.hidden ?? false,
    host_id: field.host_id ?? host_id,
    placeholder: field.placeholder || null,
  });

  // Handle new and existing fields
  const newFields = fieldsArray.filter((field) => !field.custom_field_id);
  const existingFields = fieldsArray.filter((field) => field.custom_field_id);

  // Insert new custom fields
  let insertedCustomFields = [];
  if (newFields.length > 0) {
    const { data, error } = await supabase
      .from("custom_fields")
      .insert(newFields.map(formatFieldData))
      .select();
    if (error) throw error;
    insertedCustomFields = data || [];
  }

  // Update existing custom fields
  let updatedCustomFields = [];
  if (existingFields.length > 0) {
    const { data, error } = await supabase
      .from("custom_fields")
      .upsert(
        existingFields.map((field) => ({
          custom_field_id: field.custom_field_id,
          ...formatFieldData(field),
        })),
      )
      .select();
    if (error) throw error;
    updatedCustomFields = data || [];
  }

  return [...insertedCustomFields, ...updatedCustomFields];
}

export async function getCustomFieldResponsesBatch(
  event_custom_fields: any[],
  entity_ids: number[],
  custom_field_table: "orgs" | "students" | "teams" = "students",
) {
  if (!entity_ids.length || !event_custom_fields.length) {
    return {};
  }

  // Determine the column to filter by based on the custom_field_table
  const tableColumn =
    custom_field_table === "students"
      ? "student_event_id"
      : custom_field_table === "teams"
        ? "team_id"
        : "org_event_id";

  // Get the list of event custom field IDs to fetch
  const eventCustomFieldIds = event_custom_fields.map(
    (field) => field.event_custom_field_id,
  );

  // Fetch all relevant custom field values in one query for all entities
  const { data, error } = await supabase
    .from("custom_field_values")
    .select(`${tableColumn}, event_custom_field_id, value`)
    .in("event_custom_field_id", eventCustomFieldIds)
    .in(tableColumn, entity_ids);

  if (error) {
    console.error("Error fetching custom field values:", error);
    return {};
  }

  // Create a mapping of entity_id -> field_id -> value
  const valueMap: Record<string, string> = {};

  if (data) {
    data.forEach((row) => {
      const entityId = row[tableColumn];
      const fieldId = row.event_custom_field_id;

      // Find the corresponding custom field
      const customField = event_custom_fields.find(
        (field) => field.event_custom_field_id === fieldId,
      );

      if (customField) {
        const key = `${custom_field_table.slice(0, -1)}_${entityId}_${customField.custom_field_id}`;
        valueMap[key] = row.value || "-";
      }
    });
  }

  return valueMap;
}

export async function getEventTicketCount(event_id: number) {
  // Query to get the sum of ticket quantities for the event
  const { data, error } = await supabase
    .from("ticket_orders")
    .select("quantity")
    .eq("event_id", event_id);

  if (error) throw error;

  // Calculate total by summing the quantities
  const totalTickets = data.reduce((sum, order) => sum + order.quantity, 0);

  return totalTickets;
}

export async function insertCoordinates(org_id : number, lat : number, lng: number){
  const { error } = await supabase
    .from("orgs")
    .update({address_latitude: lat, address_longitude: lng})
    .eq("org_id", org_id);
  if (error) throw error; 
}
