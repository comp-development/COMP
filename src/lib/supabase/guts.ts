import { supabase } from "../supabaseClient";

const groupScores: Record<number, number> = {
  1: 8,
  5: 9,
  9: 10,
  13: 11,
  17: 13,
  21: 15,
  25: 17,
  29: 20,
};

export async function getGutsScores(test_id: number) {
  const { data, error } = await supabase
    .from("manual_grades")
    .select("team_id, status, test_problem_id, test_problems(problem_number), teams(team_name)")
    .eq("test_id", test_id);

  if (error) {
    console.error("Error fetching grades:", error.message);
    return [];
  }

  const scoresByTeam: Record<
    string,
    { name: string; score: number; pages: Set<number> }
  > = {};

  for (const row of data) {
    const teamId = row.team_id;
    const teamName = row.teams?.team_name ?? "Unknown";
    const problemId = row.test_problems.problem_number;
    const status = row.status;

    const page = [1, 5, 9, 13, 17, 21, 25, 29].find(
      (start) => problemId >= start && problemId <= start + 3
    ) ?? 1;

    const groupScore = groupScores[page] ?? 0;

    if (!scoresByTeam[teamId]) {
      scoresByTeam[teamId] = { name: teamName, score: 0, pages: new Set() };
    }

    if (status === "correct") {
      scoresByTeam[teamId].score += groupScore;
    }

    scoresByTeam[teamId].pages.add(page);
  }

  return Object.entries(scoresByTeam).map(
    ([team_id, { name, score, pages }]) => ({
      team_id,
      name,
      score,
      page_number: pages.size + 1,
    })
  );
}


export async function getGradedTestAnswerss(
  test_id,
  customSelect: string = "*",
) {
  const { data, error } = await supabase
    .from("graded_test_answers")
    .select(customSelect)
    .eq("test_id", test_id);

  if (error) throw error;
  return data;
}




export async function getOnlineGutsScores(test_id) {

  const data = await getGradedTestAnswerss(test_id);
  
  const { data: test_taker_data, error: test_taker_error } = await supabase
    .from("test_takers")
    .select("test_taker_id, page_number, test_taker_id, teams(team_name, team_id)")
    .eq("test_id", test_id);

  if (test_taker_error) throw test_taker_error;


  const page_map = new Map(
    test_taker_data.map(tt => [tt.test_taker_id, tt.page_number])
  );
  const scoresMap = new Map();


  data.forEach((obj) => {
    const allowedPage = page_map.get(obj.test_taker_id);
    if (allowedPage > obj.test_problem_page) {
      if (!scoresMap.has(obj.test_taker_id)) {
        scoresMap.set(obj.test_taker_id, []);
      }
      scoresMap.get(obj.test_taker_id).push(obj.points || 0);
    }
  });

  const result = test_taker_data.map(tt => {
    const scoreArr = scoresMap.get(tt.test_taker_id) || [];
    const totalScore = scoreArr.reduce((sum, val) => sum + val, 0);

    return {
      name: tt.teams?.team_name ?? "Unknown",
      page_number: tt.page_number,
      score: totalScore,
      team_id: tt.teams?.team_id ?? "Unknown"
    };
  });

  // data.forEach((obj) => {
  //   if (page_map.get(obj.test_taker_id) > obj.test_problem_page) {
  //     testTakersMap[obj.test_taker_id][obj.test_problem_number] = { ...obj };
  //   }
  // });

  // Object.values(testTakersMap).forEach((testTaker) => {
  //   const totalPoints = Object.keys(testTaker).reduce((sum, key) => {
  //     return sum + (testTaker[key]?.points || 0);
  //   }, 0);
  //   testTaker.points = totalPoints;
  // });

  // console.log()

  console.log(result);
  return result;

}