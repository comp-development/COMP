create or replace function verify_auth (
    tt_id bigint,
    stud_id uuid
) returns boolean language plpgsql security definer as $$
    declare
        stud_res uuid;
        team_res bigint;
        num_res bigint;
    begin
        select student_id, team_id
        into stud_res, team_res
        from test_takers
        where test_taker_id = tt_id;
        
        if stud_res is null then
            select count(*)
            into num_res
            from student_events
            where student_id = stud_id and team_id = team_res;

            return (num_res = 1);
        else
            return (stud_res = stud_id);
        end if;
    end;
$$;

create or replace function change_test_answer (
    rel_id bigint,
    new_ans text
) returns void language plpgsql security definer as $$
    declare
        tt_id bigint;
        
$$;