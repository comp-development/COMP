import { supabase } from '$lib/supabaseClient'

export interface Taker {
  test_taker_id: number
  student_id: number
  student: { first_name: string; last_name: string }
  registrations: {
    team_id: number
    front_id: string         // “001A”, etc
    teams: {
      team_name: string
      front_id: string       // “001”, etc
    }
  }[]
}

export interface Answer {
  test_answer_id: number
  test_taker_id: number
  answer_latex: string
  last_updated: string      // ISO timestamp
}

export interface PasteEvent {
  test_taker_id: number
  event_type: string
  created_at: string        // ISO timestamp
}

export interface CheatMetrics {
  test_taker_id: number
  student_id: number
  fullName: string
  team_id: number
  teamFrontId: string
  // --- the seven metrics:
  p_speed: number
  p_globalTiming: number
  teamRapidFlag: boolean
  teamMIAflag: boolean
  p_globalMIA: number
  testDuration: number     // seconds
  pasteCount: number
}



/**
 * Fetch all test‐takers for a given event + test,
 */
export async function fetchTestTakers(
    event_id: number,
    test_id: number
  ) {
    const { data, error } = await supabase
      .from('test_takers')
      .select('test_taker_id, student_id')
      .eq('test_id', test_id);
    //   .limit(10);
  
    if (error) throw error
    return data as { test_taker_id: number; student_id: number }[]
  }


  /**
 * 2) Fetch those students’ names in one go.
 */
export async function fetchStudentsByIds(student_ids: number[]) {
    if (student_ids.length === 0) return []
    const { data, error } = await supabase
      .from('students')
      .select('student_id, first_name, last_name')
      .in('student_id', student_ids)
  
    if (error) throw error
    return data as { student_id: number; first_name: string; last_name: string }[]
  }

/**
 * 3) Fetch each student’s registration (team) for our event.
 */
export async function fetchStudentEventsByIds(
    student_ids: number[],
    event_id: number
  ) {
    if (student_ids.length === 0) return []
    const { data, error } = await supabase
      .from('student_events')
      .select('student_id, team_id, front_id')
      .in('student_id', student_ids)
      .eq('event_id', event_id)
  
    if (error) throw error
    return data as { student_id: number; team_id: number; front_id: string }[]
  }

  /**
 * 4) Fetch the team names for any team_ids we saw.
 */
export async function fetchTeamsByIds(team_ids: number[]) {
    if (team_ids.length === 0) return []
    const { data, error } = await supabase
      .from('teams')
      .select('team_id, team_name')
      .in('team_id', team_ids)
  
    if (error) throw error
    return data as { team_id: number; team_name: string }[]
  }

  /**
 * 5) Helper: gather everything into one flat array of “taker info”
 */
export async function fetchAllTakerInfo(
    event_id: number,
    test_id: number
  ) {
    console.log("test_takers started");

    // a) test-takers
    const takers = await fetchTestTakers(event_id, test_id)
    console.log("test_takers startedv2");


    // b) students
    const studentIds = takers.map((t) => t.student_id)

    console.log("studentIds", studentIds);
    const students   = await fetchStudentsByIds(studentIds)
    console.log("test_takers startedv3");

    // c) student_events
    const events     = await fetchStudentEventsByIds(studentIds, event_id)
  
    // d) teams
    const teamIds    = Array.from(new Set(events.map((e) => e.team_id)))
    const teams      = await fetchTeamsByIds(teamIds)



    console.log("test_takers completeish", takers)

    // merge
    return takers.map((t) => {
      const s = students.find((x) => x.student_id === t.student_id)
      const e = events.find((x) => x.student_id === t.student_id)
      const tm = e ? teams.find((x) => x.team_id === e.team_id) : null
  
      return {
        test_taker_id: t.test_taker_id,
        student_id:    t.student_id,
        first_name:    s?.first_name ?? '',
        last_name:     s?.last_name  ?? '',
        team_id:       e?.team_id    ?? null,
        team_name:     tm?.team_name ?? null,
        front_id:      e?.front_id   ?? null
      }
    })
  }
/**
 * Given a list of test_taker_ids, fetch every answer they submitted.
 */
export async function fetchTestAnswers(
  test_taker_ids: number[]
) {
  const { data, error } = await supabase
    .from('test_answers')
    .select(`
      test_answer_id,
      test_taker_id,
      answer_latex,
      last_updated
    `)
    .in('test_taker_id', test_taker_ids)

  console.log("answer complete")
  if (error) throw error
  return data
}

/**
 * Given a list of test_taker_ids, fetch all “paste” events for them.
 */
export async function fetchPasteEvents(
  test_taker_ids: number[]
) {
  const { data, error } = await supabase
    .from('test_logs')
    .select(`
      test_taker_id,
      event_type,
      created_at
    `)
    .in('test_taker_id', test_taker_ids)
    .eq('event_type', 'paste')

    console.log("paste complete")
  if (error) throw error
  return data
}



export function calculateAllCheatMetrics(
  takers: Taker[],
  answers: Answer[],
  pasteEvents: PasteEvent[],
  eventId = 10,
  kGlobalTiming = 0.7,
  kGlobalMia = 0.8,
): CheatMetrics[] {
    console.log("takers", takers);
    console.log("answers", answers);
    console.log("pasteEvents", pasteEvents);
  // 1) Group answers by taker
  const answersByTaker = new Map<number, Answer[]>()
  for (const a of answers) {
    const arr = answersByTaker.get(a.test_taker_id) || []
    arr.push(a)
    answersByTaker.set(a.test_taker_id, arr)
  }

  // 2) Paste counts
  const pasteCountByTaker = new Map<number, number>()
  for (const e of pasteEvents) {
    pasteCountByTaker.set(
      e.test_taker_id,
      (pasteCountByTaker.get(e.test_taker_id) || 0) + 1
    )
  }

  // 3) Compute each taker's duration
  const durations = takers.map((t) => {
    const as = (answersByTaker.get(t.test_taker_id) || [])
      .map((a) => new Date(a.last_updated))
      .sort((a, b) => a.getTime() - b.getTime())
    if (as.length < 2) return 0

    return (as[as.length - 1] - as[0]) / 1000;
  })
  const avgDuration =
    durations.reduce((sum, d) => sum + d, 0) / durations.length || 1

  // 4) Precompute global‑answer timestamp groups & frequencies
  const freqByAnswer = new Map<string, number>()
  const timesByAnswer = new Map<string, number[]>()
  for (const a of answers) {
    freqByAnswer.set(
      a.answer_latex,
      (freqByAnswer.get(a.answer_latex) || 0) + 1
    )
    const arr = timesByAnswer.get(a.answer_latex) || []
    arr.push(new Date(a.last_updated).getTime())
    timesByAnswer.set(a.answer_latex, arr)
  }
  const avgTimeByAnswer = new Map<string, number>()
  for (const [ans, times] of timesByAnswer.entries()) {
    avgTimeByAnswer.set(
      ans,
      times.reduce((s, t) => s + t, 0) / times.length
    )
  }

  console.log("freqByAnswer", freqByAnswer)

  // 5) Build team → all takers map (for team‐internal metrics)
  const teamMembers = new Map<number, Taker[]>()
  for (const t of takers) {
    // skip anyone who never registered on a team for this event
    if (!t.team_id) continue
  
    const arr = teamMembers.get(t.team_id) ?? []
    arr.push(t)
    teamMembers.set(t.team_id, arr)
  }

  console.log("teamMembers", teamMembers)

  // 6) Now, for each taker compute all metrics
  return takers.map((t, idx) => {
    const theirAnswers = answersByTaker.get(t.test_taker_id) || []
    const duration = durations[idx] || 0

    // 1) Speed metric
    const rawSpeedRatio = avgDuration / Math.max(duration, 1)
    const p_speed = Math.min(1, rawSpeedRatio)

    // 2) Global timing similarity
    let globalTimingScore = 0
    for (const a of theirAnswers) {
      const key = a.answer_latex
      // how many others submitted the SAME answer at the SAME timestamp?
      const countSameTime = answers.filter(
        (o) =>
          o.answer_latex === key &&
          o.last_updated === a.last_updated
      ).length
      if (countSameTime > 1) {
        const avgT = avgTimeByAnswer.get(key) || 0
        const dt = Math.abs(
          new Date(a.last_updated).getTime() - avgT
        ) / 1000
        // weight inversely by distance (plus 1s to avoid div0)
        globalTimingScore += 1 / (dt + 1)
      }
    }
    const p_globalTiming = 1 - Math.exp(-kGlobalTiming * globalTimingScore)

    // 3) Team rapid‐submission flag
    let teamRapidFlag = false
    if (t.team_id) {
        const members = teamMembers.get(t.team_id) || []

        // collect every answer timestamp for that team
        const allTimes = members
        .flatMap((m) =>
            (answersByTaker.get(m.test_taker_id) || [])
            .map((a) => new Date(a.last_updated).getTime())
        )
        .sort((a, b) => a - b)

        if (allTimes.length > 1) {
        const spanSec = (allTimes[allTimes.length - 1] - allTimes[0]) / 1_000
        teamRapidFlag = spanSec <= 30
        }
    }

    // 4) Team MIA flag (same uncommon wrong answer)
    let teamMIAflag = false

// only compute if this taker has a team
    if (t.team_id) {
    const members = teamMembers.get(t.team_id) || []

    // build a count of how many times each answer_latex appears among this team
    const cnt = new Map<string, number>()
    for (const m of members) {
        for (const a of answersByTaker.get(m.test_taker_id) || []) {
        // only count *incorrect* answers?
        // (assuming you’ve filtered answersByTaker to only wrongs, or check a.is_correct)
        cnt.set(a.answer_latex, (cnt.get(a.answer_latex) || 0) + 1)
        }
    }

    // if any answer is shared by >1 member and is “uncommon” overall
    // (here we treat freqByAnswer.get(latex) as the *global* frequency)
    for (const [latex, count] of cnt.entries()) {
        const globalFreq = freqByAnswer.get(latex) ?? 1
        // say “uncommon” if it’s used by fewer than 10% of all takers
        if (count > 1 && globalFreq < takers.length * 0.1) {
        teamMIAflag = true
        break
        }
    }
    }

    // 5) Global MIA‐style score (Arpit’s formula)
    let globalMiaScore = 0
    for (const a of theirAnswers) {
      const freq = freqByAnswer.get(a.answer_latex) || 1
      // if more than one person chose it:
      if ((freqByAnswer.get(a.answer_latex) || 0) > 1) {
        globalMiaScore += 1 - freq / takers.length
      }
    }
    const p_globalMIA =
      1 - Math.exp(-kGlobalMia * globalMiaScore * globalMiaScore)

    // 6) Raw test duration
    const testDuration = duration

    // 7) Paste count
    const pasteCount = pasteCountByTaker.get(t.test_taker_id) || 0

    return {
      test_taker_id: t.test_taker_id,
      student_id: t.student_id,
      fullName: `${t.first_name} ${t.last_name}`,
      team_id: t.team_id,
      teamFrontId: t.front_id,
      p_speed,
      p_globalTiming,
      teamRapidFlag,
      teamMIAflag,
      p_globalMIA,
      testDuration,
      pasteCount,
    }
  })
}
