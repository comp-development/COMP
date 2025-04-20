// src/lib/cheating.ts

import { supabase } from "$lib/supabaseClient";

export interface Taker {
  test_taker_id: number;
  student_id: number;
  student: { first_name: string; last_name: string };
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  registrations: {
    team_id: number;
    front_id: string; // “001A”, etc
    student_event_id: number;
    teams: {
      team_name: string;
      front_id: string; // “001”, etc
    };
  }[];
}

export interface Answer {
  test_answer_id: number;
  test_taker_id: number;
  answer_latex: string;
  last_updated: string; // ISO timestamp
  test_problem_id: number;
}

export interface PasteEvent {
  test_taker_id: number;
  event_type: string;
  created_at: string; // ISO timestamp
}

export interface CheatMetrics {
  test_taker_id: number;
  student_id: number;
  student_event_id: number;
  fullName: string;
  team_id: number;
  teamFrontId: string;
  p_speed: number;
  p_globalTiming: number;
  teamRapidFlag: boolean;
  teamMIAflag: boolean;
  p_globalMIA: number;
  testDuration: number; // seconds
  pasteCount: number;
}

/**
 * 1) Fetch all test‐takers for a given event + test.
 */
export async function fetchTestTakers(event_id: number, test_id: number) {
  const { data, error } = await supabase
    .from("test_takers")
    .select("test_taker_id, student_id, start_time, end_time")
    .eq("test_id", test_id);

  if (error) throw error;
  return data as {
    test_taker_id: number;
    student_id: number;
    start_time: string;
    end_time: string;
  }[];
}

const CHUNK_SIZE = 100;


/**
 * 2) Fetch those students’ names in one go.
 */
export async function fetchStudentsByIds(student_ids: string[]) {
    const validIds = student_ids.filter((id): id is string => id != null)
    if (validIds.length === 0) return []
  
    const chunks: string[][] = []
    for (let i = 0; i < validIds.length; i += CHUNK_SIZE) {
      chunks.push(validIds.slice(i, i + CHUNK_SIZE))
    }
  
    const allStudents: { student_id: string; first_name: string; last_name: string }[] = []
  
    for (const chunk of chunks) {
         console.log(chunk)
      const { data, error } = await supabase
        .from('students')
        .select('student_id, first_name, last_name')
        .in('student_id', chunk)
  
      if (error) throw error
      allStudents.push(...(data ?? []))
    }
    return allStudents
  }

/**
 * 3) Fetch each student’s registration (team) for our event.
 */
export async function fetchStudentEventsByIds(
    student_ids: string[],
    event_id: number
  ) {
    const validIds = student_ids.filter((id): id is string => id != null);
    if (validIds.length === 0) return [];
  
    const rows: {
      student_event_id: string;
      student_id: string;
      team_id: number;
      front_id: string;
    }[] = [];
  
    for (let i = 0; i < validIds.length; i += CHUNK_SIZE) {
      const chunk = validIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from('student_events')
        .select('student_event_id, student_id, team_id, front_id')
        .in('student_id', chunk)
        .eq('event_id', event_id);
  
      if (error) throw error;
      rows.push(...(data ?? []));
    }
  
    return rows;
  }

/**
 * 4) Fetch the team names for any team_ids we saw.
 */
export async function fetchTeamsByIds(team_ids: number[]) {
  if (team_ids.length === 0) return [];
  const { data, error } = await supabase
    .from("teams")
    .select("team_id, team_name")
    .in("team_id", team_ids);

  if (error) throw error;
  return data as {
    team_id: number;
    team_name: string;
  }[];
}

/**
 * 5) Gather everything into one flat array of “taker info”.
 */
export async function fetchAllTakerInfo(event_id: number, test_id: number) {
  // a) test‐takers
  const takersRaw = await fetchTestTakers(event_id, test_id);
  const studentIds = takersRaw.map((t) => t.student_id);

  // b) students
  const students = await fetchStudentsByIds(studentIds);

  // c) student_events
  const events = await fetchStudentEventsByIds(studentIds, event_id);

  // d) teams
  const teamIds = [
    ...new Set(
      events.map((e) => e.team_id).filter((id): id is number => id != null)
    ),
  ];

  const teams = await fetchTeamsByIds(teamIds);

  // e) merge into Taker[]
  return takersRaw.map((t) => {
    const stu = students.find((s) => s.student_id === t.student_id)!;
    const ev = events.find((e) => e.student_id === t.student_id)!;
    const tm = teams.find((x) => x.team_id === ev?.team_id)!;
    return {
      test_taker_id: t.test_taker_id,
      student_id: t.student_id,
      student: { first_name: stu.first_name, last_name: stu.last_name },
      student_event_id: ev?.student_event_id,
      start_time: t.start_time,
      end_time: t.end_time,
      registrations: [
        {
          team_id: ev?.team_id,
          front_id: ev?.front_id,
          teams: { team_name: tm?.team_name, front_id: tm?.team_id.toString() },
        },
      ],
    };
  });
}

/**
 * 6) Given a list of test_taker_ids, fetch every answer they submitted.
 */
export async function fetchTestAnswers(test_taker_ids: number[]) {
  if (test_taker_ids.length === 0) return [];
  const { data, error } = await supabase
    .from("test_answers")
    .select(
      `
      test_answer_id,
      test_taker_id,
      answer_latex,
      last_updated,
      test_problem_id
    `
    )
    .in("test_taker_id", test_taker_ids);

  if (error) throw error;
  return data as Answer[];
}

/**
 * 7) Given a list of test_taker_ids, fetch all “paste” events for them.
 */
export async function fetchPasteEvents(test_taker_ids: number[]) {
  if (test_taker_ids.length === 0) return [];
  const { data, error } = await supabase
    .from("test_logs")
    .select(
      `
      test_taker_id,
      event_type,
      created_at
    `
    )
    .in("test_taker_id", test_taker_ids)
    .eq("event_type", "paste");
  if (error) throw error;
  return data as PasteEvent[];
}


export async function getGradedTestAnswerss(
    test_id,
    test_taker_ids: number[],
    customSelect: string = "*",
  ) {
    const real_test_taker_ids = test_taker_ids.filter((id) => id != null);
    if (test_taker_ids.length === 0) return [];
    const { data, error } = await supabase
      .from("graded_test_answers")
      .select(customSelect)
      .in("test_taker_id", real_test_taker_ids)
      .eq("test_id", test_id);
  
    if (error) throw error;
    return data;
  }

/**
 * 8) Compute all cheating metrics for every taker.
 */
export function calculateAllCheatMetrics(
  takers: Taker[],
  answers: Answer[],
  pasteEvents: PasteEvent[],
  eventId = 10,
  kGlobalTiming = 0.7,
  kGlobalMia = 0.8
): CheatMetrics[] {
  // group answers by taker
  const answersByTaker = new Map<number, Answer[]>();
  for (const a of answers) {
    const arr = answersByTaker.get(a.test_taker_id) || [];
    arr.push(a);
    answersByTaker.set(a.test_taker_id, arr);
  }

  // count paste events
  const pasteCountByTaker = new Map<number, number>();
  for (const e of pasteEvents) {
    pasteCountByTaker.set(
      e.test_taker_id,
      (pasteCountByTaker.get(e.test_taker_id) || 0) + 1
    );
  }

  // build flat list of relative‐in‐test seconds
  type RelAns = { taker: number; problem: number; relSec: number };
  const allRel: RelAns[] = [];
  for (const t of takers) {
    const t0 = new Date(t.start_time).getTime();
    for (const a of answersByTaker.get(t.test_taker_id) || []) {
      const rel = (new Date(a.last_updated).getTime() - t0) / 1000;
      allRel.push({
        taker: t.test_taker_id,
        problem: a.test_problem_id,
        relSec: rel,
      });
    }
  }

  // average rel‐time per problem
  const agg = new Map<number, { sum: number; cnt: number }>();
  for (const { problem, relSec } of allRel) {
    const cur = agg.get(problem) || { sum: 0, cnt: 0 };
    cur.sum += relSec;
    cur.cnt += 1;
    agg.set(problem, cur);
  }
  const avgRel = new Map<number, number>();
  for (const [pid, { sum, cnt }] of agg) {
    avgRel.set(pid, sum / cnt);
  }


  // overall average problem‐submission time
  const probAvgs = Array.from(avgRel.values());
  const avgProbSub =
    probAvgs.reduce((s, x) => s + x, 0) / Math.max(1, probAvgs.length);

  // each taker’s own test length
  const lengths = takers.map((t) => {
    const s = new Date(t.start_time).getTime();
    const e = new Date(t.end_time).getTime();
    return Math.max(0, (e - s) / 1000);
  });
  const avgTestLen =
    lengths.reduce((s, x) => s + x, 0) / Math.max(1, lengths.length);

  // scaling factor
  const scalingFactor = avgTestLen / avgProbSub;

  // freq & avgTime by answer for global‐timing & MIA
  const freqByAnswer = new Map<string, number>();
  const timesByAnswer = new Map<string, number[]>();
  for (const a of answers) {
    freqByAnswer.set(
      a.answer_latex,
      (freqByAnswer.get(a.answer_latex) || 0) + 1
    );
    const arr = timesByAnswer.get(a.answer_latex) || [];
    arr.push(new Date(a.last_updated).getTime());
    timesByAnswer.set(a.answer_latex, arr);
  }
  const avgTimeByAnswer = new Map<string, number>();
  for (const [ans, tms] of timesByAnswer) {
    avgTimeByAnswer.set(ans, tms.reduce((s, x) => s + x, 0) / tms.length);
  }


  // team→members map
  const teamMembers = new Map<number, Taker[]>();
  for (const t of takers) {
    for (const reg of t.registrations) {
      if (reg.team_id != null) {
        const arr = teamMembers.get(reg.team_id) || [];
        arr.push(t);
        teamMembers.set(reg.team_id, arr);
      }
    }
  }


  // compute per‑taker
  return takers.map((t, idx) => {
    const theirAnswers = answersByTaker.get(t.test_taker_id) || [];
    const duration = lengths[idx];

    // — p_speed —
    // let sumRatio = 0
    // for (const {problem,relSec} of allRel.filter(r=>r.taker===t.test_taker_id)) {
    //   const avg = avgRel.get(problem) ?? relSec
    //   sumRatio += avg/Math.max(relSec,1)
    // }
    // const avgRatio = theirAnswers.length>0 ? sumRatio/theirAnswers.length : 0
    // const speedScore = avgRatio * scalingFactor
    // const p_speed    = 1 - Math.exp(-speedScore)
    const kSpeed = 0.008;

    // for each answer, compute its relative‐in‐test secs:
    const perProblemScores = theirAnswers.map((a) => {
      const relSec =
        (new Date(a.last_updated).getTime() -
          new Date(t.start_time).getTime()) /
        1000;

      // look up the global average for that problem
      const avgSec = avgRel.get(a.test_problem_id) ?? relSec;

      // scale them by (this student’s testLength ÷ problemAvg)
      const scaledTime = relSec * (avgTestLen / avgSec);

      // exponential drop‑off:
      return Math.exp(-kSpeed * scaledTime);
    });

    // pick the *max* score across their problems (or 0 if none)
    const p_speed = perProblemScores.length ? Math.max(...perProblemScores) : 0;

    // — p_globalTiming —
    let globalTimingScore = 0;
    for (const a of theirAnswers) {
      const same = answers.filter(
        (o) =>
          o.answer_latex === a.answer_latex && o.last_updated === a.last_updated
      ).length;
      if (same > 1) {
        const avgT = avgTimeByAnswer.get(a.answer_latex) || 0;
        const dt = Math.abs(new Date(a.last_updated).getTime() - avgT) / 1000;
        globalTimingScore += 1 / (dt + 1);
      }
    }
    const p_globalTiming = 1 - Math.exp(-kGlobalTiming * globalTimingScore);

    // — teamRapidFlag —
    let teamRapidFlag = false;

    // build a map of your real‐time timestamps by problem
    const yourAnswers = answersByTaker.get(t.test_taker_id) || [];
    const yourTimes  = new Map(
      yourAnswers.map(a => [a.test_problem_id, new Date(a.last_updated).getTime()])
    );

    for (const reg of t.registrations) {
      const members = teamMembers.get(reg.team_id) || [];
    
      for (const teammate of members) {
        if (teammate.test_taker_id === t.test_taker_id) continue;
    
        // build their real‐time map
        const theirAnswers = answersByTaker.get(teammate.test_taker_id) || [];
        const theirTimes   = new Map(
          theirAnswers.map(a => [a.test_problem_id, new Date(a.last_updated).getTime()])
        );
    
        // count how many problems line up within 30s
        let matchCount = 0;
        for (const [pid, yourTs] of yourTimes.entries()) {
          const theirTs = theirTimes.get(pid);
          if (theirTs !== undefined && Math.abs(yourTs - theirTs) <= 30000) {
            matchCount++;
            if (matchCount >= 3) {
              teamRapidFlag = true;
              break;
            }
          }
        }
    
        if (teamRapidFlag) break;
      }
      if (teamRapidFlag) break;
    }

    let teamMIAflag = false;

    for (const reg of t.registrations) {
      const members = teamMembers.get(reg.team_id) || [];
      // build a set of this taker’s answers
      const myAnswers =
        answersByTaker.get(t.test_taker_id)?.map((a) => a.answer_latex) || [];

      for (const other of members) {
        if (other.test_taker_id === t.test_taker_id) continue;

        // build the list of shared answers with this one teammate
        const theirAnswers =
          answersByTaker.get(other.test_taker_id)?.map((a) => a.answer_latex) ||
          [];
        const shared = myAnswers.filter((latex) =>
          theirAnswers.includes(latex)
        );

        // check count and uncommon‐ness
        if (shared.length >= (avgRel.size * 0.4)) {
          const hasUncommon = shared.some((latex) => {
            const globalFreq = freqByAnswer.get(latex) ?? 0;
            return globalFreq < (takers.length * 0.05);
          });
          if (hasUncommon || shared.length > (avgRel.size * 0.7)) {
            teamMIAflag = true;
            break;
          }
        }
      }

      if (teamMIAflag) break;
    }

    let globalMIAflag = false;

    // grab this student’s answer‐keys once
    const myAnswers =
      answersByTaker.get(t.test_taker_id)?.map((a) => a.answer_latex) || [];

    for (const other of takers) {
      if (other.test_taker_id === t.test_taker_id) continue;
      // other student’s answer‐keys
      const theirAnswers =
        answersByTaker.get(other.test_taker_id)?.map((a) => a.answer_latex) ||
        [];

      // find the intersection
      const shared = myAnswers.filter((latex) => theirAnswers.includes(latex));

      if (shared.length > (avgRel.size * 0.7)) {
        // check if any of those shared answers is “uncommon” globally
        const hasUncommon = shared.some((latex) => {
          const globalFreq = freqByAnswer.get(latex) ?? 0;
          return globalFreq < (takers.length * 0.1);
        });
        if (hasUncommon) {
          globalMIAflag = true;
          break;
        }
      }
    }

    // — p_globalMIA —

    // — testDuration & pasteCount —
    const testDuration = duration;
    const pasteCount = pasteCountByTaker.get(t.test_taker_id) || 0;
    const w1 = 0.2;
    const w2 = 0.2;
    const w3 = 0.2;
    const w4 = 0.2;
    const w5 = 0.2;
    const w6 = 0.2;

    const cheating_probability = (p_speed * w1) +  (p_globalTiming * w2) + (globalMIAflag ? w3 : 0 ) + (teamRapidFlag ? w4: 0) + (teamMIAflag ? w5 : 0) + (pasteCount > 3 ? w6: 0);

    return {
      test_taker_id: t.test_taker_id,
      student_id: t.student_id,
      fullName: `${t.student.first_name} ${t.student.last_name}`,
      team_id: t.registrations[0]?.team_id ?? -1,
      teamFrontId: t.registrations[0]?.front_id ?? "—",
      student_event_id: t.student_event_id,
      p_speed,
      p_globalTiming,
      teamRapidFlag,
      teamMIAflag,
      p_globalMIA: globalMIAflag,
      testDuration,
      pasteCount,
      cheating_probability
    };
  });
}

/**
 *  Fetch all the problems in a test, ordered by problem_number.
 */
export async function fetchTestProblemss(test_id: number) {
  const { data, error } = await supabase
    .from("test_problems")
    .select("test_problem_id, problem_number")
    .eq("test_id", test_id)
    .order("problem_number", { ascending: true });

  if (error) throw error;
  return data as { test_problem_id: number; problem_number: number }[];
}

/**
 *  Given one student_event_id, look up:
 *   • the student_id + front_id
 *   • that student’s test_taker_id + start_time
 *   • the student’s name
 *   • all of their answers on that test
 */
export async function fetchStudentProblemAnswers(
  test_id: number,
  student_event_id: number
) {
  try {
    // a) registration record
    const { data: se, error: seErr } = await supabase
      .from("student_events")
      .select("student_id, front_id")
      .eq("student_event_id", student_event_id)
      .single();
    if (seErr) throw seErr;

    // b) name
    const { data: stu, error: stuErr } = await supabase
      .from("students")
      .select("first_name, last_name")
      .eq("student_id", se.student_id)
      .single();
    if (stuErr) throw stuErr;

    // c) test_taker

    const { data: tt, error: ttErr } = await supabase
      .from("test_takers")
      .select("test_taker_id, start_time")
      .eq("test_id", test_id)
      .eq("student_id", se.student_id)
      .single();
    if (ttErr) throw ttErr;

    // d) answers
    const { data: ans, error: ansErr } = await supabase
      .from("test_answers")
      .select("test_problem_id, answer_latex, last_updated")
      .eq("test_taker_id", tt.test_taker_id);
    if (ansErr) throw ansErr;

    return {
      registration: se,
      student: stu,
      testTaker: tt,
      answers: ans,
    };
  } catch (err) {
    return false;
  }
}

/**
 *  Build the “wide” row for one student:
 *    • columns for front_id, fullName, startTime
 *    • for each problem 1…N:
 *       –   p{#}_latex
 *       –   p{#}_min     (minutes into test, two‑decimals)
 *       –   p{#}_rt      (ISO timestamp)
 */
export async function fetchStudentProblemTable(
  test_id: number,
  student_event_id: number
) {
  const problems = await fetchTestProblemss(test_id);
  const { registration, student, testTaker, answers } =
    await fetchStudentProblemAnswers(test_id, student_event_id);

  const startTs = new Date(testTaker.start_time).getTime();
  const ansMap = new Map<
    number,
    { answer_latex: string; last_updated: string }
  >();
  for (const a of answers) ansMap.set(a.test_problem_id, a);

  const graded = await getGradedTestAnswerss(
    test_id,
    [testTaker.test_taker_id],
    'test_problem_id, points'
  );

    const gradedMap = new Map<
        number,
        { points: number }
    >();
    let totalPoints = 0;
    for (const g of graded) {
        totalPoints += g.points ?? 0;
    }


  const row: any = {
    student_event_id,
    front_id: registration.front_id,
    fullName: `${student.first_name} ${student.last_name}`,
    totalPoints: totalPoints,
    startTime: new Date(testTaker.start_time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };




  for (const p of problems) {
    const a = ansMap.get(p.test_problem_id);
    row[`p${p.problem_number}_latex`] = a?.answer_latex || "";
    if (a) {
      const relMin = (new Date(a.last_updated).getTime() - startTs) / 60000;
      row[`p${p.problem_number}_min`] = relMin.toFixed(2);
      row[`p${p.problem_number}_rt`] = new Date(
        a.last_updated
      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      row[`p${p.problem_number}_min`] = "";
      row[`p${p.problem_number}_rt`] = "";
    }
  }

  return { problems, row };
}

/**
 *  The same, but for an entire team:
 *   • fetch all student_events for that team
 *   • loop over each student_event_id above
 *   • return one row per student
 */
export async function fetchTeamProblemTable(
  test_id: number,
  team_id: number,
  event_id: number
): Promise<{
  problems: Array<{ test_problem_id: number; problem_number: number }>;
  rows: any[];
}> {
  // 1) fetch the test’s problem list once
  const problems = await fetchTestProblemss(test_id);

  // 2) grab every student_event_id on this team for our event
  const { data: regs, error: regsErr } = await supabase
    .from("student_events")
    .select("student_event_id")
    .eq("team_id", team_id)
    .eq("event_id", event_id);

  if (regsErr) throw regsErr;
  if (!regs) return { problems, rows: [] };

  // 3) for each registration, attempt to fetch that student’s row
  const rows: any[] = [];
  for (const { student_event_id } of regs) {
    try {
      const { row } = await fetchStudentProblemTable(test_id, student_event_id);
      rows.push(row);
    } catch (err) {
      // skip any that fail (e.g. didn’t actually take this test)
      console.warn(
        `fetchStudentProblemTable failed for student_event_id=${student_event_id}, skipping`,
        err
      );
      continue;
    }
  }

  return { problems, rows };
}
