# Contest Organization Management Platform (COMP)

## Project Overview


To generate (a superset of) this diagram, run `tree -d --gitignore`.

```bash
├── db # local database scripts and schema
│      # for seed scripts, migrations
├── src
│   ├── lib # shared code should live here
│   │   ├── components # svelte components
│   │   │              # (small snippets of HTML + functionality)
│   │   └── supabase # database queries
│   └── routes # web server routes (mostly front-facing pages)
│       ├── admin # pages for admins
│       ├── api # backend routes (not front-facing, server logic)
│       ├── coach # pages for coaches
│       └── student # pages for students
├── static # files that aren't code (small images, data files)
└── tests # scripts to test our frontend pages and database logic
```

## Developing

### Install

First, install dependencies with
```bash
npm install
```

If developing against a local database instance (recommended), run through the
steps in [db/README.md](./db/README.md). Notably, you should have some way to
run Docker containers, the supabase CLI, and the dependencies installed.

```bash
cd db
# run the commands in db/README.md
# then return to the COMP directory
cd ..
```

Make sure to run `npx patch-package` and to fill out the `.env` file in the
**root** directory (the same directory as where this README is located) as
directed. If not using a local database instance, fill out the env variables
with the ones from your hosted instance.

If you don't know which workflow to use, you should probably use the
[develop and update workflow](./db/README.md#devupdate-workflow)

### Develop

Start on a branch! Run the below command.
```
git checkout -b your-feature-name-here
```

Make sure supabase is running and has data (seeded or pre-existing), then start
the COMP web server:

```bash
npm run dev # and visit the printed URL
# or start the server and open the app in a new browser tab
npm run dev -- --open
```

When saving a file, vite will automatically hot reload pages (reloads just the
scripting portion for a faster feedback loop). If this leaves the page in a
broken state, just manually refresh the page.


On the database side, run `supabase status` inside the `db` folder and open
the studio link. This page shows the state of that local database instance
and lets you modify the data or schema contained therein.

If you want to reset your data, run `npx tsx seed.ts` inside the `db` folder.
If you made schema modifications and want to discard them, run
`supabase db reset` in the `db` folder.

### Testing

After making database changes, please extend the `db/seed.ts` script to capture
the changes. For example, if adding an email column to a users table, add some
code to generated sample emails in that table. Verify the script works with
`npx tsx seed.ts`.

After making either database or webpage changes, please extend the `tests/node.ts`
file to cover success and failure cases. 

To verify tests pass after developing, run the below:
```bash
cd tests
npx tsx node.ts
```

### Merge

Commit your changes, push them to Github on your fork or the COMP repository,
and open a pull request. 


<!--
## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
-->
