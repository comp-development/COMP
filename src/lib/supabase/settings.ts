import { supabase } from "$lib/supabaseClient";

export const defaultSettings = {
  logo: "/logo.png",
  title: "",
  description: "",
  styles: {
    "text-color-light": "#fff",
    "text-color-dark": "#000",
    background: "#FAFAFA",
    "background-dark": "#EDEDED",
    primary: "#414141",
    "primary-light": "#929292",
    "primary-dark": "#6D6D6D",
    "primary-tint": "#E7E7E7",
    "error-tint": "#ffe0e0",
    "success-light": "#00ff00",
    "success-dark": "#00cc00",
    "warning-light": "#ffcc00",
    "warning-dark": "#ff9900",
    "error-light": "#ff8a8a",
    "error-dark": "#ff3636",
    secondary: "#213d44",
    "secondary-light": "#1b9aaa",
    "secondary-dark": "#061333",
    "secondary-tint": "#b9c6d2",
  },
};

let requested_from_db = false;

function parse_json(text: string): Object | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// This function should only run on the client.
// It may return stale settings if there exist
export async function fetchSettings() {
  let output: any = defaultSettings;

  // Send a request to DB to update local storage's copy for next time.
  const request = (async () => {
    requested_from_db = true;

    const { data, error } = await supabase
      .from("settings")
      .select("settings")
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      return {};
    }

    localStorage.setItem("settingStore", JSON.stringify(data?.settings));
    return data?.settings;
  })();

  const cached = parse_json(localStorage.getItem("settingStore") ?? "");
  if (cached) {
    Object.entries(cached).forEach(([key, value]) => {
      output[key] = value;
    });
  } else {
    // If there was no cache entry, wait for the DB fetch to run.
    const fetched = await request;
    Object.entries(fetched).forEach(([key, value]) => {
      output[key] = value;
    });
  }
  return output;
}
