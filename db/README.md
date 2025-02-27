# Database Notes

For general instructions / notes, go up to [README.md](../README.md).

# Prereqs

requires Orbstack/colima/docker, supabase CLI.
see https://supabase.com/docs/guides/local-development/cli/getting-started for info on starting supabase.

tested one-time admin setup with colima on arm mac, all workflows with Orbstack
on arm mac with few issues. works (with occasional Docker issues) on Windows.

# Workflows

All of the below require Orbstack/Docker/Colima and Supabase to be running.

```
cd COMP/db
npm ci install
npx patch-package # applies our patch to the seed package
```

```
supabase start
touch ../.env
```

Fill in the below variables in the `COMP/.env` file using the output of `supabase status`
(same as initial output of `supabase start`). Note that there should be no spaces
between the `=` and the value.

```
VITE_SUPABASE_URL=API_URL
VITE_SUPABASE_ANON_KEY=anon_key
SUPABASE_SERVICE_KEY=service_role_key
```

See [Supabase docs](https://supabase.com/docs/guides/local-development/cli/getting-started) for more info.


For eventbrite seeding, you need to create an event to which the
`EVENTBRITE_TOKEN` in the root `.env` has access. On the publish page, choose
"Is your event public or private?" to be "private." 
If you choose the event to be online, there are less steps to create the event.

Under `Add tickets`, rename the general admission to
`Org Order (only purchase if you're a coach)` and add a ticket named
`Student Order (only purchase if you're a student)` with a minimum and maximum
quantity of `1` in `advanced settings > tickets per order`.

Edit both tickets and set `advanced settings > visibility` to be Hidden.
In the `Promotions` tab, add two promotions named `org` and `student`
(note that case probably matters). The ticket limit should be `unlimited`.
Use `only certain hidden tickets > Org Order ...` and
`only certain tickets > Student Order ...` for the `apply code to` field.

Ensure your API key private token is in the root `.env`.

Add to the `db/.env` file the following. Note that if you do not fill this
entry out, then seeding will succeed with no events using the eventbrite
payment system. The tests for eventbrite payments, however, will not work.
```
EVENTBRITE_SAMPLE_EVENT_ID=event_id
```


## Dev+Update Workflow:

1. start supabase. run `supabase db reset` to get remote changes applied locally.
2. fill out seed data with `npx @snaplet/seed sync`, `npx tsx seed.ts`
3. edit the db via UI or SQL commands
4. run `supabase db diff`, put diff in new migration: `supabase migration new migration_name`
5. sync the db `npx @snaplet/seed sync`, add new sample seed data to `seed.ts`, and reseed with `npx tsx seed.ts`
6. run `supabase db reset` and `npx tsx seed.ts` to test running the migrations and adding seed data in sequence
7. run `supabase gen types typescript --local --schema public,auth > database.types.ts` for DB types
8. test against COMP `cd tests; npx tsx node.ts`
9. TODO: add automated tests (UI mockup for each user action + DB assertions)
10. commit to VCS
11. notify admin

## One-time Admin Setup (only if the db folder doesn't already exist):

1. download current schema via `supabase login`, `supabase init`, `supabase link`,
   `supabase db pull`, `supabase db pull --schema auth`, etc. make the start
   migration as minimal as possible
2. prep seed data: `npx @snaplet/seed init` (choose node-postgres), `npx @snaplet/seed sync`,
   edit `seed.config.ts` and `seed.ts`
3. run `npx tsx seed.ts`
4. test against COMP and commit to VCS

## Admin Migration Workflow:

1. get notified by dev, pull latest
2. start supabase. run `supabase db reset` and `npx tsx seed.ts`
3. test against COMP
4. maybe add more automated tests or seed data, then commit to VCS
5. run `supabase link --project-ref <project-id>` or `supabase link` with selection
6. run `supabase db push --dry-run`
7. confirm with other admins, then run `supabase db push` (execute on latest only)

# Known Errors

If on Windows, using powershell, and using the seed script with `dryRun: true`,
the content of the `supabase/seed.sql` file may be in UTF-16 encoding. VSCode makes
it pretty convenient to switch back to UTF-8 (there's a button in the bottom right
to switch encodings).

Again, if using the seed script with `dryRun: true` and saving in the `supabase/seed.sql`
file, if there're errors saying there was an error using the `seed.sql` file, that
may be because the database schema is mismatched with the seed script. A (somewhat)
nuclear option is to delete the `supabase/seed.sql` file, run `supabase db reset`
to get the schema in a good state, run `npx @snaplet/seed sync` to ensure the
seeding data model matches the schema, run `npx tsx seed.ts > supabase/seed.sql`
again, then finally `supabase db reset`.

# COMP Dev DB

Use the pre-authenticated email and password pairs below to sign in.

```
admin@gmail.com
admin123
student@gmail.com
student123
coach@gmail.com
coach123
superadmin@gmail.com
superadmin123
```

## DB Seed Data

To add a user account as seed data, bring up the DB locally. Then, start up the project.

Sign up as a new user, then look in the `auth.users` table. Copy the encrypted password, and add a call to the
`create_user` function (see `seed.ts`). Run `npx tsx seed.ts` as described above in the dev+update workflow.
