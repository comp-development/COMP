<script lang="ts">
  import { onMount } from "svelte";
  import { getGutsScores } from "$lib/supabase/";

  interface Props {
    test: any;
    max_per_side?: number;
  }

  let { test, max_per_side = 15 }: Props = $props();
//  let num_rounds = test.settings.pages.length;
  let num_rounds = 8;
  let screen_width = screen.width;
  let curr_screen = 0;
  let num_screens = 0;
  let num_teams = 0;
  let num_copies = 1;
  let scores = $state([]);
  let seconds = 0;
  let minutes = 60;
  //document.documentElement.style.setProperty('--light', styles["background-dark"]);
  //document.documentElement.style.setProperty('--medium_green', styles["primary"]);
  document.documentElement.style.setProperty(
    "--screen_height",
    screen.height * 0.65 + "px",
  );

  onMount(async () => {
    scores = rankParticipants(
      (await getGutsScores(test.test_id)).flatMap((item) =>
        Array(num_copies).fill(item),
      ),
    );
    console.log("SCORES", scores);
    num_teams = scores.length;
    num_screens = Math.ceil(num_teams / max_per_side);
    // await fillInTeams();
    console.log(num_teams);
    await updateTable();
  });

  function rankParticipants(participants) {
    console.log("PART", participants);
    // Sort participants by score in descending order
    participants.sort((a, b) => b.score - a.score);

    let rank = 1; // Start with rank 1
    let currentRank = rank;
    let previousScore = participants[0].score;

    for (let i = 0; i < participants.length; i++) {
      // If the current score is the same as the previous one, assign the same rank
      if (participants[i].score !== previousScore) {
        // Update rank to current index + 1 (because rankings are 1-based, not 0-based)
        currentRank = rank;
        previousScore = participants[i].score;
      }

      // Assign the current rank to the participant
      participants[i].rank = currentRank;

      // Increment the rank for the next iteration
      rank++;
    }

    return participants;
  }

  function calculateIndices(extra) {
    let start = curr_screen * max_per_side + extra;
    let end = Math.min((curr_screen + 1) * max_per_side + extra, scores.length);
    return { start, end };
  }

  async function updateTable() {
    scores = rankParticipants(
      (await getGutsScores(test.test_id)).flatMap((item) =>
        Array(num_copies).fill(item),
      ),
    );
    console.log("SCORES", scores);
    if (curr_screen + 2 >= num_screens) curr_screen = 0;
    else curr_screen += 1;
  }

  setInterval(function () {
    updateTable();
  }, 10000);
</script>

<div>
  <h1 style="text-align: center">{test.event_name}</h1>
  <h2 style="text-align: center">{test.test_name}</h2>
  {#if test.division}<h3 style="text-align: center">{test.division}</h3>{/if}

  <br />
  <p style="font-style: italic; text-align: center;">
    Please note that all scores from Set {num_rounds} will not be shown.
  </p>
  <br />
  <div id="leftwrapper">
    <table class="gutsDisplay" id="leftTable">
      <thead>
        <tr class="gutsTr">
          <th class="gutsInfo">Rank</th>
          <th class="gutsInfo teamName">Team Name</th>
          <th class="gutsInfo progress">Progress</th>
          <th class="gutsInfo">Score</th>
        </tr>
      </thead>
      <tbody id="leftbody">
        {#each Array.from({ length: Math.min(max_per_side, scores.length) }, (_, i) => i) as i}
          <tr class="gutsTr">
            <td class="gutsResult">{scores[i].rank}</td>
            <td class="gutsResult teamName">{scores[i].name}</td>
            <td class="gutsResult">
              <div class="round">
                {#each Array.from({ length: num_rounds }, (_, i) => i + 1) as round}
                  <div
                    class="color-box {round < scores[i].page_number
                      ? 'complete'
                      : 'not-complete'}"
                  ></div>
                {/each}
              </div></td
            >
            <td class="gutsResult">{scores[i].score}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div id="rightwrapper">
    <table class="gutsDisplay" id="rightTable">
      <thead>
        <tr class="gutsTr">
          <th class="gutsInfo">Rank</th>
          <th class="gutsInfo teamName">Team Name</th>
          <th class="gutsInfo progress">Progress</th>
          <th class="gutsInfo">Score</th>
        </tr>
      </thead>
      <tbody id="rightbody">
        {#each Array.from({ length: calculateIndices(max_per_side).end - calculateIndices(max_per_side).start }, (_, i) => i + calculateIndices(max_per_side).start) as i}
          <tr class="gutsTr">
            <td class="gutsResult">{scores[i].rank}</td>
            <td class="gutsResult teamName">{scores[i].name}</td>
            <td class="gutsResult">
              <div class="round">
                {#each Array.from({ length: num_rounds }, (_, i) => i + 1) as round}
                  <div
                    class="color-box {round < scores[i].page_number
                      ? 'complete'
                      : 'not-complete'}"
                  ></div>
                {/each}
              </div></td
            >
            <td class="gutsResult">{scores[i].score}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .color-box {
    width: 18px;
    height: 18px;
    border: 1px solid #000;
    margin: 2px;
  }

  .complete {
    background-color: var(--primary-light);
  }

  .not-complete {
    background-color: var(--background-dark);
  }

  #leftwrapper {
    width: 50%;
    justify-content: center;
    border-collapse: collapse;
    padding: 10px;
    float: left;
    border-right: 3px dotted var(--secondary);
  }

  #rightwrapper {
    width: 50%;
    justify-content: center;
    border-collapse: collapse;
    padding: 10px;
    float: right;
  }

  #leftTable {
    float: left;
    margin: 10px;
    border: 2px solid var(--primary);
    width: 100%;
    table-layout: fixed; 
  }

  #rightTable {
    float: right;
    margin: 10px;
    border: 2px solid var(--primary);
    width: 100%;
    table-layout: fixed; 
  }

  .gutsDisplay {
    border-collapse: collapse;
    padding: 10px;
    width: 100%;
  }


  .teamName {
    width: auto;
    overflow-wrap: break-word; /* Forces wrapping of long words */
    word-break: break-word; /* For older browsers */
  }

  .round {
    display: flex;
    align-items: center;
    border: none;
  }

  .gutsInfo {
    color: white;
    background-color: var(--primary);
    padding: 10px;
    border: 1px solid var(--primary);
    text-align: left;
    font-family: var(--font-family);
    font-size: 12px;
    font-weight: bold;
  }

  .gutsResult {
    background-color: var(--primary-tint);
    padding: 10px;
    border: 1px solid var(--primary);
    text-align: left;
    font-family: var(--font-family);
    font-size: 16px;
  }

  .gutsTr {
    background-color: #f2f2f2;
  }
</style>
