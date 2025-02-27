export * from "./users";
export * from "./tests";
export * from "./events";
export * from "./teams";
export * from "./problems";
export * from "./guts";
export * from "./scores";
export * from "./hosts";
export * from "./orgs";
export * from "./settings"

export function getUserTypeDatabase(type: "student" | "coach" | "admin") {
  return type === "coach" ? "coaches" : type + "s";
}
