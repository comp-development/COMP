<script>
  import Puzzle from "$lib/components/Puzzle.svelte";
  import { onMount } from "svelte";
  import Button from "$lib/components/Button.svelte";

  let selectedProblem = 0;
  
  // Define three different puzzles
  const puzzles = [
    [
    {
      loc: [
        [0, 8],
        [0, 6],
        [2, 6],
        [2, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 6],
        [0, 4],
        [2, 4],
        [2, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 4],
        [0, 2],
        [2, 2],
        [2, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 2],
        [0, 0],
        [2, 0],
        [2, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 8],
        [2, 6],
        [4, 6],
        [4, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 6],
        [2, 4],
        [4, 4],
        [4, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 4],
        [2, 2],
        [4, 2],
        [4, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 2],
        [2, 0],
        [4, 0],
        [4, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 8],
        [4, 6],
        [6, 6],
        [6, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 6],
        [4, 4],
        [6, 4],
        [6, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 4],
        [4, 2],
        [6, 2],
        [6, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 2],
        [4, 0],
        [6, 0],
        [6, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 8],
        [6, 6],
        [8, 6],
        [8, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 6],
        [6, 4],
        [8, 4],
        [8, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 4],
        [6, 2],
        [8, 2],
        [8, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 2],
        [6, 0],
        [8, 0],
        [8, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 0],
        [2, 0],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [2, 0],
        [4, 0],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 0],
        [6, 0],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 0],
        [8, 0],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 0],
        [0, 2],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [2, 0],
        [2, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 0],
        [4, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [6, 0],
        [6, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [8, 0],
        [8, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 2],
        [2, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 2],
        [4, 2],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 2],
        [6, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [6, 2],
        [8, 2],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [0, 2],
        [0, 4],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 2],
        [2, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 2],
        [4, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 2],
        [6, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [8, 2],
        [8, 4],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 4],
        [2, 4],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 4],
        [4, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 4],
        [6, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 4],
        [8, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [0, 4],
        [0, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [2, 4],
        [2, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 4],
        [4, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 4],
        [6, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [8, 4],
        [8, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 6],
        [2, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 6],
        [4, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 6],
        [6, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 6],
        [8, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 6],
        [0, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 6],
        [2, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 6],
        [4, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 6],
        [6, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [8, 6],
        [8, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [0, 8],
        [2, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 8],
        [4, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 8],
        [6, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [6, 8],
        [8, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [[0, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[5, 1]],
      type: "text",
      state: "3",
    },
    {
      loc: [[1, 3]],
      type: "text",
      state: "3",
    },
    {
      loc: [[3, 3]],
      type: "text",
      state: "0",
    },
    {
      loc: [[5, 5]],
      type: "text",
      state: "0",
    },
    {
      loc: [[7, 5]],
      type: "text",
      state: "2",
    },
    {
      loc: [[3, 7]],
      type: "text",
      state: "1",
    }],
    [
    {
      loc: [
        [0, 8],
        [0, 6],
        [2, 6],
        [2, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 6],
        [0, 4],
        [2, 4],
        [2, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 4],
        [0, 2],
        [2, 2],
        [2, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 2],
        [0, 0],
        [2, 0],
        [2, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 8],
        [2, 6],
        [4, 6],
        [4, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 6],
        [2, 4],
        [4, 4],
        [4, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 4],
        [2, 2],
        [4, 2],
        [4, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 2],
        [2, 0],
        [4, 0],
        [4, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 8],
        [4, 6],
        [6, 6],
        [6, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 6],
        [4, 4],
        [6, 4],
        [6, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 4],
        [4, 2],
        [6, 2],
        [6, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 2],
        [4, 0],
        [6, 0],
        [6, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 8],
        [6, 6],
        [8, 6],
        [8, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 6],
        [6, 4],
        [8, 4],
        [8, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 4],
        [6, 2],
        [8, 2],
        [8, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 2],
        [6, 0],
        [8, 0],
        [8, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 0],
        [2, 0],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [2, 0],
        [4, 0],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 0],
        [6, 0],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 0],
        [8, 0],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 0],
        [0, 2],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [2, 0],
        [2, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 0],
        [4, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [6, 0],
        [6, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [8, 0],
        [8, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 2],
        [2, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 2],
        [4, 2],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 2],
        [6, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [6, 2],
        [8, 2],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [0, 2],
        [0, 4],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 2],
        [2, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 2],
        [4, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 2],
        [6, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [8, 2],
        [8, 4],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 4],
        [2, 4],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 4],
        [4, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 4],
        [6, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 4],
        [8, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [0, 4],
        [0, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [2, 4],
        [2, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 4],
        [4, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 4],
        [6, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [8, 4],
        [8, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 6],
        [2, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 6],
        [4, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 6],
        [6, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 6],
        [8, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 6],
        [0, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 6],
        [2, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 6],
        [4, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 6],
        [6, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [8, 6],
        [8, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [0, 8],
        [2, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 8],
        [4, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 8],
        [6, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [6, 8],
        [8, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [[0, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[5, 1]],
      type: "text",
      state: "3",
    },
    {
      loc: [[1, 3]],
      type: "text",
      state: "3",
    },
    {
      loc: [[3, 3]],
      type: "text",
      state: "0",
    },
    {
      loc: [[5, 5]],
      type: "text",
      state: "0",
    },
    {
      loc: [[7, 5]],
      type: "text",
      state: "2",
    },
    {
      loc: [[3, 7]],
      type: "text",
      state: "1",
    }],
    [
    {
      loc: [
        [0, 8],
        [0, 6],
        [2, 6],
        [2, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 6],
        [0, 4],
        [2, 4],
        [2, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 4],
        [0, 2],
        [2, 2],
        [2, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 2],
        [0, 0],
        [2, 0],
        [2, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 8],
        [2, 6],
        [4, 6],
        [4, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 6],
        [2, 4],
        [4, 4],
        [4, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 4],
        [2, 2],
        [4, 2],
        [4, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [2, 2],
        [2, 0],
        [4, 0],
        [4, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 8],
        [4, 6],
        [6, 6],
        [6, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 6],
        [4, 4],
        [6, 4],
        [6, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 4],
        [4, 2],
        [6, 2],
        [6, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [4, 2],
        [4, 0],
        [6, 0],
        [6, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 8],
        [6, 6],
        [8, 6],
        [8, 8],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 6],
        [6, 4],
        [8, 4],
        [8, 6],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 4],
        [6, 2],
        [8, 2],
        [8, 4],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [6, 2],
        [6, 0],
        [8, 0],
        [8, 2],
      ],
      type: "surface",
      state: "",
    },
    {
      loc: [
        [0, 0],
        [2, 0],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [2, 0],
        [4, 0],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 0],
        [6, 0],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 0],
        [8, 0],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 0],
        [0, 2],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [2, 0],
        [2, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 0],
        [4, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [6, 0],
        [6, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [8, 0],
        [8, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 2],
        [2, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 2],
        [4, 2],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 2],
        [6, 2],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [6, 2],
        [8, 2],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [0, 2],
        [0, 4],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 2],
        [2, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 2],
        [4, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 2],
        [6, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [8, 2],
        [8, 4],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 4],
        [2, 4],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 4],
        [4, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 4],
        [6, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 4],
        [8, 4],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [0, 4],
        [0, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [2, 4],
        [2, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 4],
        [4, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 4],
        [6, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [8, 4],
        [8, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 6],
        [2, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 6],
        [4, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 6],
        [6, 6],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 6],
        [8, 6],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [0, 6],
        [0, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 6],
        [2, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [4, 6],
        [4, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [6, 6],
        [6, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [8, 6],
        [8, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [
        [0, 8],
        [2, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [2, 8],
        [4, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [4, 8],
        [6, 8],
      ],
      type: "edge",
      state: "+",
    },
    {
      loc: [
        [6, 8],
        [8, 8],
      ],
      type: "edge",
      state: "-",
    },
    {
      loc: [[0, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 0]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 2]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 4]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 6]],
      type: "point",
      state: "true",
    },
    {
      loc: [[0, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[2, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[4, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[6, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[8, 8]],
      type: "point",
      state: "true",
    },
    {
      loc: [[5, 1]],
      type: "text",
      state: "3",
    },
    {
      loc: [[1, 3]],
      type: "text",
      state: "3",
    },
    {
      loc: [[3, 3]],
      type: "text",
      state: "0",
    },
    {
      loc: [[5, 5]],
      type: "text",
      state: "0",
    },
    {
      loc: [[7, 5]],
      type: "text",
      state: "2",
    },
    {
      loc: [[3, 7]],
      type: "text",
      state: "1",
    } 
  
  ]];

</script>

<br />
<h1>Puzzle</h1>
<br />
<div class="row">

  <div>
    {#each puzzles as puzzle, index}
      <button
        class="problem_click"
        style="background-color: {index === selectedProblem
          ? 'var(--secondary-light)'
          : 'var(--primary-light)'};"
        on:click={() => {
          selectedProblem = index;
        }}>{index + 1}</button
      >
      <br />
    {/each}
  </div>
  <div>
    <div style="border: 1px solid gray; border-radius: 10px; padding: 10px;">
      <h3>Problem {selectedProblem + 1}</h3>
      <p>Problem</p>
      <div style="justify-content: center; display:flex">
            <Puzzle
        puzzle={puzzles[selectedProblem]}
        editable={true}
        is_puzzle={true}
      />
    </div>
      <br />
      <p>Answer</p>
      <div>Answer {selectedProblem + 1}</div>
    </div>
    <br /><br />
  </div>
</div>



<style>
  .row {
    display: grid;
    grid-template-columns: 10% auto;
    column-gap: 20px;
    padding: 20px;
    text-align: left;
  }

  .problem_click {
    width: 100%;
    border-radius: 50px;
    padding: 5px 10px;
    border: none;
    outline: none;
    margin-bottom: 10px;
  }

  h3,
  p {
    font-weight: bold;
  }

  h3 {
    font-size: 24px;
  }

  .grid {
    display: grid;
    grid-template-columns: 24% 24% 24% 24%;
    column-gap: 10px;
    row-gap: 10px;
  }

  .answerbox {
    padding: 10px;
    border-radius: 5px;
    display: grid;
    grid-template-columns: 75% 25%;
    min-height: 50px;
  }

  .answer {
    overflow-x: scroll;
    overflow-y: hidden;
  }

  .arrow-button {
    padding: 0px;
    cursor: pointer;
    background-color: transparent;
    border: none;
    margin-left: 2px;
  }
</style>