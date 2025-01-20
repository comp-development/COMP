import { SeedClient, createSeedClient } from "@snaplet/seed";
import { copycat, Input } from "@snaplet/copycat";

async function create_style(seed: SeedClient) {
  await seed.settings([
    {
      settings: {
        styles: {
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
        },
      },
    },
  ]);
}

enum UserType {
  Admin = 1,
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
  const data = {
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
    ...other_fields,
  };
  if (type == UserType.Admin) {
    return await seed.admins([data]);
  } else if (type == UserType.Student) {
    return await seed.students([data]);
  }
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

async function main() {
  const seed = await createSeedClient({
    dryRun: true,
    models: {
      users: {
        data: {
          email: (ctx) => copycat.email(ctx.seed),
        },
      },
      admins: {
        data: {
          first_name: (ctx) => copycat.firstName(ctx.seed),
          last_name: (ctx) => copycat.lastName(ctx.seed),
        },
      },
      coaches: {
        data: {
          first_name: (ctx) => copycat.firstName(ctx.seed),
          last_name: (ctx) => copycat.lastName(ctx.seed),
        },
      },
      events: {
        data: {
          event_name: (ctx) =>
            "Tournament " +
            copycat.words(ctx.seed, { min: 1, max: 2, capitalize: "all" }),
          ticket_price_cents: (ctx) =>
            copycat.int(ctx.seed, { min: 5, max: 20 }) * 100,
        },
      },
      hosts: {
        data: {
          host_name: (ctx) =>
            "Host " + copycat.word(ctx.seed, { capitalize: true }),
        },
      },
      org_events: {
        data: {
          join_code: (ctx) => "org-" + copycat.uuid(ctx.seed),
        },
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
          grade: (ctx) =>
            "Grade " + copycat.int(ctx.seed, { min: 6, max: 12 }).toString(),
        },
      },
      teams: {
        data: {
          team_name: (ctx) => "Team " + copycat.word(ctx.seed),
          division: null,
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
    },
  });
  await seed.$resetDatabase();

  await create_style(seed);

  await create_user(
    seed,
    UserType.Admin,
    "Thomas",
    "Anderson",
    "admin@gmail.com",
    "$2a$10$.KWPj66/5wCO1C5c2w98wexdaZm4rwWWA0VPjz2mErXmOhKRnv9/e",
    {},
  );
  await create_user(
    seed,
    UserType.Student,
    "Addison",
    "Addition",
    "student@gmail.com",
    "$2a$10$GPaPWd5mKl5ivBV/7uZmm.f.hwgGxbz6R2KS8.QfK4sNrJ.yEr/AG",
    {},
  );
  const debug_student = seed.$store.students[0];

  // TODO: coaches

  let { students } = await seed.students((x) => x(30));
  students.push(debug_student);

  const { hosts } = await seed.hosts((x) => x(3));
  const { events } = await seed.events(
    (x) =>
      x(hosts.length * 4, () => ({
        tests: (x) => x(3),
      })),
    {
      connect: { hosts },
    },
  );
  const { orgs } = await seed.orgs((x) => x(3));
  for (const [i, event] of events.entries()) {
    // Choose some organizations to join event.
    const org_choices = copycat.someOf(
      [1, orgs.length],
      orgs,
    )(["org_events", i]);
    const { org_events } = await seed.org_events(
      org_choices.map((o) => ({ org_id: o.org_id })),
      {
        connect: { events: [event] },
      },
    );

    // Choose some students to join event.
    const s = copycat.someOf([1, students.length], students)(["students", i]);

    // Permute and split the students to join with an organization or as individual teams.
    const scrambled_s = permute(["permute", i], s, copycat.int);
    const split = <T,>(a: T[], i: number) => [a.slice(0, i), a.slice(i)];
    const [org_s, indiv_s] = split(
      scrambled_s,
      copycat.int(["organization or individual", i], {
        min: 0,
        max: scrambled_s.length,
      }),
    );
    const { student_org_events } = await seed.student_org_events(
      (x) =>
        x(org_s.length, ({ index }) => ({
          student_id: org_s[index].student_id,
        })),
      { connect: { org_events } },
    );

    // Have organizations purchase at least sufficient tickets for their students.
    // Map from org ids to student ids.
    let org_to_s: Map<number, string[]> = new Map();
    student_org_events.map((e) => {
      const key = org_events.find((oe) => oe.id == e.org_event_id)!.org_id!;
      org_to_s.set(key, (org_to_s.get(key) ?? []).concat([e.student_id]));
    });
    const { ticket_orders: org_ticket_orders } = await seed.ticket_orders(
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

    // Group org students and indiv students into teams.
    // Note that the grouping implementation may result in anywhere from 1 to
    // max_group_size members in a team (for the final team).
    let team_store = new Set();
    const team_letters = "ABCDE";
    // TODO: don't use assign ALL students to a team. choose [0, 5 or so] to omit.
    await seed.teams(
      [...org_to_s.entries()]
        .flatMap(([o, s]) =>
          chunks(["team_orgs", o, i], s, 2, 4, copycat.int).map(
            (s) => [o, s] as [number, string[]],
          ),
        )
        .map(([org_id, student_ids], t_i) => {
          const team_id = copycat.unique(
            ["org team #", i, t_i],
            (i) => copycat.int(i, { max: 999 }),
            team_store,
          ) as number;
          return {
            org_id,
            join_code: null,
            student_teams: student_ids.map((student_id, s_i) => ({
              student_id,
              // TODO: these (quadratic) array finds can be turned into (linear) map lookups
              // but performance may not matter much
              ticket_order_id: org_ticket_orders.find(
                (oto) => oto.org_id == org_id,
              )!.id,
              front_id: team_id.toString().padStart(3, "0") + team_letters[s_i],
            })),
          };
        }),
      { connect: { events: [event] } },
    );

    const indiv_teams_s = chunks(["indiv org", i], indiv_s, 2, 4, copycat.int);
    await seed.teams(
      indiv_teams_s.map((s, t_i) => {
        const team_id = copycat.unique(
          ["indiv team #", i, t_i],
          (i) => copycat.int(i, { max: 999 }),
          team_store,
        ) as number;
        return {
          org_id: null,
          join_code: (ctx) => "team-" + copycat.uuid(ctx.seed),
          student_teams: s.map((s, s_i) => ({
            student_id: s.student_id,
            ticket_orders: {
              org_id: null,
              student_id: s.student_id,
              quantity: 1,
            },
            front_id: team_id.toString().padStart(3, "0") + team_letters[s_i],
          })),
        };
      }),
      { connect: { events: [event] } },
    );
  }

  process.exit();
}

main();
