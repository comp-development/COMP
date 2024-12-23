import { SeedClient, Store, createSeedClient } from "@snaplet/seed";
import { copycat } from "@snaplet/copycat";

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

async function main() {
  const seed = await createSeedClient({ dryRun: true });
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
  (await create_user(
    seed,
    UserType.Student,
    "Addison",
    "Addition",
    "student@gmail.com",
    "$2a$10$GPaPWd5mKl5ivBV/7uZmm.f.hwgGxbz6R2KS8.QfK4sNrJ.yEr/AG",
    {},
  )) as Store;

  await seed.hosts([
    {
      host_name: "Sample Host",
      events: (x) =>
        x(3, ({ index, store }) => {
          if (index === 0) {
            return {
              event_name: "Sample Event",
              event_date: new Date(),
              published: true,
              tests: [
                {
                  test_name: "Sample Test",
                  buffer_time: 20,
                  instructions: "This is a sample test.",
                  opening_time: new Date(),
                  length: 60 * 60,
                  is_team: false,
                  visible: true,
                  test_mode: "Standard",
                  test_problems: (x) => x(5),
                },
              ],
              student_events: [
                {
                  student_id: store.students.find(
                    (s) => s.email == "student@gmail.com",
                  )?.student_id,
                },
              ],
            };
          } else {
            return {
              tests: (x) => x(3),
              student_events: (x) => x(5),
            };
          }
        }),
    },
  ]);

  process.exit();
}

main();
