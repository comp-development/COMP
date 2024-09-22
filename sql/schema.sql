create table if not exists admins (
    admin_id uuid primary key not null references auth.users on delete cascade,
    first_name text,
    last_name text
);

create table if not exists students (
    student_id uuid primary key not null references auth.users on delete cascade,
    contest_dojo_id text,
    first_name text,
    last_name text,
    grade int2,
    email text,
    division text,
    last_log_in timestamptz
);

create table if not exists events (
    event_id int8 generated by default as identity primary key,
    event_name text,
    event_date date
);

create table if not exists teams (
    team_id int8 generated by default as identity primary key,
    team_name text,
    event_id int8 not null references events on delete cascade,
    division text
);

create table if not exists student_events (
    relation_id int8 generated by default as identity primary key,
    student_id uuid not null references students on delete cascade,
    team_id int8 not null references teams on delete cascade,
    event_id int8 not null references events on delete cascade
);

create table if not exists tests (
    test_id int8 generated by default as identity primary key,
    event_id int8 not null references events on delete cascade,
    test_name text,
    buffer_time int4,
    instructions text,
    opening_time timestamptz,
    division text,
    settings jsonb
);

create table if not exists problems (
    problem_id int8 generated by default as identity primary key,
    problem_latex text,
    answer_latex text,
    solution_latex text
);

create table if not exists test_problems (
    test_problem_id int8 generated by default as identity primary key,
    problem_id int8 not null references problems on delete cascade,
    test_id int8 not null references tests on delete cascade,
    problem_number int2
);

create table if not exists test_takers (
    test_taker_id int8 generated by default as identity primary key,
    student_id uuid references students on delete cascade,
    team_id int8 references teams on delete cascade,
    test_id int8 not null references tests on delete cascade,
    start_time timestamptz,
    end_time timestamptz,

    constraint one_null check (
        (student_id is null and team_id is not null) or
        (student_id is not null and team_id is null)
    )
);

create table if not exists test_answers (
    relation_id int8 generated by default as identity primary key,
    test_taker_id int8 not null references test_takers on delete cascade,
    test_problem_id int8 not null references test_problems on delete cascade,
    answer_latex text,
    last_edited_time timestamptz
);

create table if not exists answer_correct (
    relation_id int8 primary key references test_answers on delete cascade,
    correct boolean
);

create table if not exists problem_clarifications (
    clarification_id int8 generated by default as identity primary key,
    test_problem_id int8 not null references test_problems on delete cascade,
    clarification_latex text
);

alter table admins enable row level security;
alter table students enable row level security;
alter table events enable row level security;
alter table teams enable row level security;
alter table student_events enable row level security;
alter table tests enable row level security;
alter table problems enable row level security;
alter table test_problems enable row level security;
alter table test_takers enable row level security;
alter table test_answers enable row level security;
alter table answer_correct enable row level security;
alter table problem_clarifications enable row level security;

alter publication supabase_realtime add table test_answers;
alter publication supabase_realtime add table problem_clarifications;