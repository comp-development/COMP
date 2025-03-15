import {
  SeedClient,
  createSeedClient,
  type studentsScalars,
} from "@snaplet/seed";
import { copycat, type Input } from "@snaplet/copycat";
import "dotenv/config";
import { env } from "process";
import type { Tables } from "./database.types";

enum UserType {
  Superadmin = 1,
  Admin,
  Coach,
  Student,
}

async function create_user(
  seed: SeedClient,
  type: UserType,
  first_name: string,
  last_name: string,
  email: string,
  encrypted_password: string,
  other_fields: Object = {},
) {
  const data: any = {
    users: {
      instance_id: "00000000-0000-0000-0000-000000000000",
      aud: "authenticated",
      role: "authenticated",
      email,
      encrypted_password,
      raw_app_meta_data: {
        provider: "email",
        providers: ["email"],
      },
      raw_user_meta_data: {
        email_verified: false,
        phone_verified: false,
      },
    },
    first_name,
    last_name,
    email,
    ...other_fields,
  };

  if (type == UserType.Superadmin) {
    return await seed.superadmins([data]);
  } else if (type == UserType.Admin) {
    return await seed.admins([data]);
  } else if (type == UserType.Coach) {
    return await seed.coaches([data]);
  } else if (type == UserType.Student) {
    return await seed.students([data]);
  }
}

// Seed an event and test with explicit parameters for ease of testing.
async function seed_debug_student(seed: SeedClient, student: studentsScalars) {
  // Put the student in an event with a test that opens now.
  const {
    events: [event],
  } = await seed.events([
    {
      event_name: "Example Event",
      event_date: new Date(),
      published: true,
      summary: "debug event for testing",
      eventbrite_event_id: null,
      tests: [
        {
          test_name: "Example Test",
          buffer_time: 60 * 60 * 24,
          opening_time: new Date(),
          division: null,
          settings: null,
          is_team: true,
          visible: true,
          test_mode: "Standard",
          access_rules: null,
        },
      ],
      ticket_orders: [
        {
          ticket_service: "stripe",
          student_id: student.student_id,
          quantity: 1,
        },
      ],
    },
  ]);
  await seed.teams([
    {
      event_id: event.event_id,
      student_events: [{ event_id: event.event_id, ...student }],
    },
  ]);
}

function permute<T>(
  input: Input,
  array: T[],
  index: (i: Input, { min, max }: { min: number; max: number }) => number,
): T[] {
  const left = 0;
  for (let right = array.length - 1; right > left; right--) {
    // Select random index in range left to right
    const swap_index = index([input, right], { min: 0, max: right });
    const temp = array[swap_index];
    array[swap_index] = array[right];
    array[right] = temp;
  }
  return array;
}

function chunks<T>(
  input: Input,
  array: T[],
  attempted_min: number,
  max_chunk_size: number,
  size: (i: Input, range: { min: number; max: number }) => number,
): T[][] {
  let index = 0;
  let output: T[][] = [];
  while (true) {
    let next_index = Math.min(
      index + size([input, index], { min: attempted_min, max: max_chunk_size }),
      array.length,
    );
    output.push(array.slice(index, next_index));
    if (next_index == array.length) {
      break;
    }
    index = next_index;
  }
  return output;
}

async function reset_db(params: { eventbrite_sample_event_id?: string }) {
  // TODO: take args for clear, dry run false, dry run true
  const dryRun = false;
  if (!dryRun) {
    console.log("Clearing database tables ...");
  }
  const seed = await createSeedClient({
    dryRun,
    models: {
      users: {
        data: {
          email: (ctx) => copycat.email(ctx.seed),
        },
      },
      superadmins: {
        data: {
          first_name: (ctx) => copycat.firstName(ctx.seed),
          last_name: (ctx) => copycat.lastName(ctx.seed),
          email: (ctx) => copycat.email(ctx.seed),
        },
      },
      admins: {
        data: {
          first_name: (ctx) => copycat.firstName(ctx.seed),
          last_name: (ctx) => copycat.lastName(ctx.seed),
          email: (ctx) => copycat.email(ctx.seed),
        },
      },
      coaches: {
        data: {
          first_name: (ctx) => copycat.firstName(ctx.seed),
          last_name: (ctx) => copycat.lastName(ctx.seed),
          email: (ctx) => copycat.email(ctx.seed),
        },
      },
      events: {
        data: {
          event_name: (ctx) =>
            "Tournament " +
            copycat.words(ctx.seed, { min: 1, max: 2, capitalize: "all" }),
          ticket_price_cents: (ctx) =>
            copycat.int(ctx.seed, { min: 5, max: 20 }) * 100,
          // See https://picsum.photos/ (image generator)
          logo: (ctx) =>
            `https://picsum.photos/seed/${copycat.word(ctx.seed)}/200`,
          eventbrite_event_id: (ctx) =>
            copycat.bool(ctx.seed) && params.eventbrite_sample_event_id
              ? params.eventbrite_sample_event_id
              : null,
        },
      },
      hosts: {
        data: {
          host_name: (ctx) =>
            "Host " + copycat.word(ctx.seed, { capitalize: true }),
          styles: (_ctx) => {
            return {
              primary: "#201c98",
              secondary: "#81706d",
              background: "#FFFBF0",
              "primary-dark": "#0f1865",
              "primary-tint": "#d9d8e9",
              "primary-light": "#72ccdc",
              "secondary-dark": "#544545",
              "secondary-tint": "#f2dfdf",
              "background-dark": "#ffd7d7",
              "secondary-light": "#cfaeae",
              "text-color-dark": "#000",
              "text-color-light": "#fff",
              "error-dark": "#ff3636",
              "error-tint": "#ffe0e0",
              "error-light": "#ff8a8a",
              "font-family": "Ubuntu",
            };
          },
          email: (ctx) => copycat.email(ctx.seed),
          summary: `**Are you ready to test your skills in the ultimate _Math Tournament_?** Compete with **teams from all over the world** in events like: \n
          - **Algebra Blitz**: Solve \(x^2 + 5x + 6 = 0\) faster than your opponents!
          - _Geometry Dash_: Prove theorems and calculate areas of **complex polygons**.
          - **Team Relays**: Work collaboratively to solve multi-step problems.

          Participants will have access to **exclusive study materials**, including:
          1. _Sample problems_ with solutions.
          2. A **leaderboard** updated in real-time.
          3. The chance to win **prizes**, from scholarships to cool gadgets.

          Check out our [official guide](https://math-tournament.example.com) for preparation tips, and don't forget to register by **March 1st, 2025**! 🚀`,
          logo: "https://www.mustangmath.com/logo.png",
        },
      },
      host_admins: {
        data: {},
      },
      org_events: {
        data: {},
      },
      student_events: {
        data: {},
      },
      orgs: {
        data: {
          name: (ctx) =>
            "Organization " + copycat.word(ctx.seed, { capitalize: true }),
          address: (ctx) => copycat.postalAddress(ctx.seed),
        },
      },
      students: {
        data: {
          first_name: (ctx) => copycat.firstName(ctx.seed),
          last_name: (ctx) => copycat.lastName(ctx.seed),
          // Use the provided email if available, otherwise default to a generated email.
          email: (ctx) => ctx.data?.email || copycat.email(ctx.seed),
          grade: (ctx) =>
            "Grade " + copycat.int(ctx.seed, { min: 6, max: 12 }).toString(),
        },
      },
      teams: {
        data: {
          team_name: (ctx) => "Team " + copycat.word(ctx.seed),
        },
      },
      tests: {
        data: {
          test_name: (ctx) => "Test " + copycat.word(ctx.seed),
          buffer_time: (ctx) => copycat.int(ctx.seed, { min: 0, max: 10 }) * 60,
          length: (ctx) => copycat.int(ctx.seed, { min: 10, max: 60 }) * 60,
          division: null,
          access_rules: {},
        },
      },
      ticket_orders: {
        data: {
          order_id: (ctx) =>
            "cs_test_" + copycat.times(ctx.seed, 20, copycat.char).join(""),
        },
      },
      custom_fields: {
        data: {
          regex_error_message: null,
        },
      },
    },
  });

  // Clear out database except for extension tables.
  // (the postgres seed client has no permission over those tables and errors
  // if trying to clear them out.)
  await seed.$resetDatabase([
    "!_realtime.*",
    "!net.*",
    "!pgsodium.*",
    "!realtime.*",
  ]);

  await create_user(
    seed,
    UserType.Admin,
    "Test",
    "Admin",
    "admin@gmail.com",
    "$2a$10$.KWPj66/5wCO1C5c2w98wexdaZm4rwWWA0VPjz2mErXmOhKRnv9/e",
    {},
  );
  await create_user(
    seed,
    UserType.Coach,
    "Test",
    "Coach",
    "coach@gmail.com",
    "$2a$10$GWQTX.UReCTi/mS7DzfcQ.8u4VsPhIPMJHVZce1ION/2AiaVOhy.W",
    {},
  );
  await create_user(
    seed,
    UserType.Student,
    "Test",
    "Student",
    "student@gmail.com",
    "$2a$10$GPaPWd5mKl5ivBV/7uZmm.f.hwgGxbz6R2KS8.QfK4sNrJ.yEr/AG",
    {},
  );
  await create_user(
    seed,
    UserType.Superadmin,
    "Test",
    "Superadmin",
    "superadmin@gmail.com",
    "$2a$10$t6.Am0kQrbW8d669u1Upwe5XW8jqOI3hFFWiE0EpNi4ipD3wmX1wW",
    {},
  );
  const debug_student = seed.$store.students[0];
  await seed_debug_student(seed, debug_student);
  const debug_coach = seed.$store.coaches[0];
  const debug_admin = seed.$store.admins[0];
  const debug_superadmin = seed.$store.superadmins[0];

  let { students } = await seed.students((x) =>
    x(30, ({ seed }) => {
      const email = copycat.email(seed);
      return {
        email,
        users: {
          email,
        },
      };
    }),
  );
  students.push(debug_student);

  const { superadmins } = await seed.superadmins((x) => x(10));
  superadmins.push(debug_superadmin);
  const { admins } = await seed.admins((x) => x(10));
  admins.push(debug_admin);
  const { coaches } = await seed.coaches((x) =>
    x(10, ({ seed }) => {
      const email = copycat.email(seed);
      return {
        email,
        users: { email },
      };
    }),
  );
  coaches.push(debug_coach);
  const { hosts } = await seed.hosts((x) => x(3));

  await seed.host_admins(
    admins.flatMap((a) => [{ admin_id: a.admin_id }, { admin_id: a.admin_id }]),
    {
      connect: { hosts },
    },
  );

  const { events } = await seed.events(
    (x) =>
      x(hosts.length * 4, ({ seed }) => ({
        tests: (x) => x(3),
        // Make most events published.
        published: copycat.int(seed, { min: 0, max: 9 }) < 9,
      })),
    {
      connect: { hosts },
    },
  );
  const { orgs } = await seed.orgs((x) => x(3));
  await seed.org_coaches(
    coaches.map((a) => ({ coach_id: a.coach_id })),
    {
      connect: { orgs },
    },
  );

  for (const [i, event] of events.entries()) {
    // No one could have joined if event weren't published.
    if (!event.published) continue;

    // Add custom fields.
    const custom_fields = [
      {
        key: "height",
        label: "Height (in)",
        regex: "^\\d+(\\.\\d+)?$",
        required: true,
        editable: true,
        hidden: false,
        custom_field_type: "text",
        custom_field_table: "students",
      },
      {
        key: "cat_count",
        label: "# Cats",
        regex: "^\\d+$",
        required: true,
        editable: true,
        hidden: false,
        custom_field_type: "text",
        custom_field_table: "students",
        regex_error_message: "must be an integer number of cats",
      },
      {
        key: "parent_email",
        label: "Parent/Guardian Email",
        required: true,
        editable: true,
        hidden: false,
        custom_field_type: "email",
        custom_field_table: "students",
        placeholder: "minty@gmail.com",
      },
    ] satisfies Partial<Tables<"custom_fields">>[];
    await seed.event_custom_fields(
      custom_fields.map((v, i) => ({
        // TODO: check 1 indexed?
        ordering: i + 1,
        custom_fields: v,
      })),
      {
        connect: { events: [event] },
      },
    );

    // Choose some organizations to join event.
    const org_choices = copycat.someOf(
      [1, orgs.length],
      orgs,
    )(["org_events", i]);
    await seed.org_events(
      org_choices.map((o) => ({ org_id: o.org_id })),
      {
        connect: { events: [event] },
      },
    );

    // Choose some students to join event.
    const chosen_students = copycat.someOf(
      [1, students.length],
      students,
    )(["students", i]);

    // Permute and split the students to join with an organization or as individual teams.
    const scrambled_students = permute(
      ["permute", i],
      chosen_students,
      copycat.int,
    );
    const split = <T,>(a: T[], i: number) => [a.slice(0, i), a.slice(i)];
    const [org_s, indiv_s] = split(
      scrambled_students,
      copycat.int(["organization or individual", i], {
        min: 0,
        max: scrambled_students.length,
      }),
    );

    let team_store = new Set();
    const team_letters = "ABCDE";
    // Have organizations purchase at least sufficient tickets for their students.
    // Map from org ids to student ids.
    let org_to_s: Map<number, string[]> = new Map();
    org_s.map((e, j) => {
      const key = copycat.oneOf(["student org", i, j], org_choices).org_id!;
      org_to_s.set(key, (org_to_s.get(key) ?? []).concat([e.student_id]));
    });
    // Have orgs purchase sufficient tickets (greater or equal to assigned student count).
    await seed.ticket_orders(
      (x) =>
        x(
          org_to_s.size,
          ({ index }) =>
            [...org_to_s.entries()].map(([e, s]) => ({
              student_id: null,
              org_id: e,
              quantity:
                s.length +
                copycat.int(["extra tickets", i], { min: 0, max: 3 }),
            }))[index],
        ),
      { connect: { events: [event] } },
    );

    // Have individual students purchase their tickets.
    await seed.ticket_orders(
      indiv_s.map((s) => ({
        student_id: s.student_id,
        org_id: null,
        quantity: 1,
      })),
      { connect: { events: [event] } },
    );

    // Group org students and indiv students into teams.
    // Note that the grouping implementation may result in anywhere from 1 to
    // max_group_size members in a team (for the final team).

    // TODO: don't use assign ALL students to a team. choose [0, 5 or so] to omit.
    await seed.teams(
      [...org_to_s.entries()]
        .flatMap(([o, s]) =>
          chunks(["team_orgs", o, i], s, 2, 4, copycat.int).map(
            (s) => [o, s] as [number, string[]],
          ),
        )
        .map(([org_id, student_ids], t_i) => {
          const team_id = (
            copycat.unique(
              ["org team #", i, t_i],
              (i) => copycat.int(i, { max: 999 }),
              team_store,
            ) as number
          )
            .toString()
            .padStart(3, "0");
          return {
            org_id,
            event_id: event.event_id,
            front_id: team_id,
            student_events: student_ids.map((student_id, s_i) => ({
              student_id,
              front_id: team_id + team_letters[s_i],
              event_id: event.event_id,
              org_id,
            })),
          };
        }),
      { connect: { events: [event] } },
    );

    const indiv_teams_s = chunks(["indiv org", i], indiv_s, 2, 4, copycat.int);
    await seed.teams(
      indiv_teams_s.map((s, t_i) => {
        const team_id = (
          copycat.unique(
            ["indiv team #", i, t_i],
            (i) => copycat.int(i, { max: 999 }),
            team_store,
          ) as number
        )
          .toString()
          .padStart(3, "0");
        return {
          org_id: null,
          event_id: event.event_id,
          front_id: team_id,
          student_events: s.map((s, s_i) => ({
            student_id: s.student_id,
            event_id: event.event_id,
            front_id: team_id + team_letters[s_i],
          })),
        };
      }),
      { connect: { events: [event] } },
    );
  }
  if (!dryRun) {
    console.log("Successfully seeded database!");
  }
}

// If called from command line, execute once.
if (require.main === module) {
  (async () => {
    const eventbrite_sample_event_id = env.EVENTBRITE_SAMPLE_EVENT_ID;
    if (!eventbrite_sample_event_id) {
      console.warn("missing eventbrite sample event id");
    }
    await reset_db({ eventbrite_sample_event_id });
    process.exit();
  })();
}

export default reset_db;
module.exports = reset_db;
