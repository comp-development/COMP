import { supabase } from "../supabaseClient";

export async function getGutsScores(test_id: number) {
  const { data, error } = await supabase
    .from("guts_grades")
    .select("team_id, score, test_problem_id, teams(team_name)")
    // .eq("test_id", test_id); !!! UNCOMMENT LATER

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

    const page = [1, 5, 9, 13, 17, 21, 25].find((start) =>
      problemId >= start && problemId <= start + 3
    ) ?? 1;

    if (!scoresByTeam[teamId]) {
      scoresByTeam[teamId] = { name: teamName, score: 0, pages: new Set() };
    }

    scoresByTeam[teamId].score += row.score ?? 0;
    scoresByTeam[teamId].pages.add(page);
  }

  return Object.entries(scoresByTeam).map(
    ([team_id, { name, score, pages }]) => ({
      team_id,
      name,
      score,
      page_number: pages.size + 1
    })
  );
}
