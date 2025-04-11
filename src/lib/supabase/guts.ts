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
    .select("team_id, status, test_problem_id, teams(team_name)")
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
    const problemId = row.test_problem_id;
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
