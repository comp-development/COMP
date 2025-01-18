# Prereqs

requires colima/docker, supabase CLI. see https://supabase.com/docs/guides/local-development/cli/getting-started for info on starting supabase.

tested one-time admin setup with colima on arm mac. 

# Workflows

All of the below require Docker/Colima and Supabase to be running.

```
cd COMP/db
npm ci install
npx patch-package # applies our patch to the seed package
supabase start 
touch ../.env
```
Fill in the below variables in the `../.env` file using the output of `supabase status or supabase start`
```
VITE_SUPABASE_URL= # API URL
VITE_SUPABASE_ANON_KEY= # anon key
VITE_SUPABASE_SERVICE_KEY= # service_role key
```

See [Supabase docs](https://supabase.com/docs/guides/local-development/cli/getting-started) for more info.

Dev+Update Workflow:
1. start supabase. run `supabase db reset` to get remote changes applied locally.
2. fill out seed data with `npx @snaplet/seed sync`, `npx tsx seed.ts > supabase/seed.sql`, `supabase db reset`
3. edit the db via UI or SQL commands
4. run `supabase db diff --schema public`, put diff in new migration: `supabase migration new migration_name`
5. sync the db `npx @snaplet/seed sync`, add new sample seed data to `seed.ts`,  `npx tsx seed.ts > supabase/seed.sql`
6. run `supabase db reset` to test running the migrations and adding seed data
7. run `supabase gen types typescript --local --schema public,auth > database.types.ts` for DB types
8. test against COMP
9. TODO: add automated tests (UI mockup for each user action + DB assertions)
10. commit to VCS
11. notify admin

One-time Admin Setup (only if the `db` folder doesn't already exist):
1. download current schema via `supabase login`, `supabase init`, `supabase link`, `supabase db pull`, `supabase db pull --schema auth`, etc. make the start migration as minimal as possible
2. prep seed data: `npx @snaplet/seed init` (choose node-postgres), `npx @snaplet/seed sync`, edit `seed.config.ts` and `seed.ts`
3. run `npx tsx seed.ts > supabase/seed.sql` and `supabase db reset`
4. test against COMP and commit to VCS

Admin Migration Workflow:
1. get notified, pull latest
2. start supabase. run `supabase db reset`
3. test against COMP
4. maybe add more automated tests or seed data, then commit to VCS
5. run `supabase link --project-ref <project-id>`
6. run `supabase db push --dry-run`
7. confirm with other admins, then run `supabase db push` (execute on latest only)

# COMP Dev DB

Use the pre-authenticated email and password pairs below to sign in.
```
admin@gmail.com
admin123
```
Problem Writer:
```
student@gmail.com
student123
```

## DB Seed Data

To add a user account as seed data, bring up the DB locally. Then, start up the project.

Sign up as a new user, then look in the `auth.users` table. Copy the encrypted password, and add a call to the
`create_user` function (see `seed.ts`). Run `npx tsx seed.ts > supabase/seed.sql` and `supabase db reset`
as described above in the dev+update workflow.

# TODO

- add an organizer table
- add an organizer account
- add a coach account
- create pool of students (see copycat)
- hand code structureone host, one event, one test, three or so problems, event has one team, made up of three hand coded students.

