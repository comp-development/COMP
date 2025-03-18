<script>
  import { marked } from "marked";
  import { Input } from "flowbite-svelte";
  import { onMount } from "svelte";

  let {
    source = $bindable(""),
    custom_fields,
    newResponses = $bindable({}),
    validationErrors = $bindable({}),
    handleSubmit = () => {},
  } = $props();

  // Function to parse markdown while handling :field and :signature placeholders
  function parseMarkdownWithInputs(markdown) {
    let regex = /:(field|signature){\s*#(\w+)(?:\s+placeholder="([^"]*)")?\s*}/g;
    let lines = markdown.split("\n"); // Split text into lines
    let structuredContent = [];

    for (let line of lines) {
      let parts = [];
      let lastIndex = 0;

      line.replace(regex, (match, type, id, placeholder, index) => {
        // Push preceding text
        if (index > lastIndex) {
          parts.push({ type: "text", content: line.slice(lastIndex, index) });
        }

        // Push input or signature field representation
        parts.push({
          type: type, // "field" for input, "signature" for signature pad
          id,
          placeholder: placeholder || "Default input",
        });

        lastIndex = index + match.length;
      });

      // Push remaining text after last match
      if (lastIndex < line.length) {
        parts.push({ type: "text", content: line.slice(lastIndex) });
      }

      structuredContent.push(parts);
    }

    return structuredContent;
  }

  let parsedMarkdown = parseMarkdownWithInputs(source);

  // Signature drawing logic
  function setupSignatureCanvas(id) {
    let canvas = document.getElementById(id);
    if (!canvas) return;

    let ctx = canvas.getContext("2d");
    let drawing = false;

    function startDrawing(event) {
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(event.offsetX, event.offsetY);
    }

    function draw(event) {
      if (!drawing) return;
      ctx.lineTo(event.offsetX, event.offsetY);
      ctx.stroke();
    }

    function stopDrawing() {
      drawing = false;
    }

    // Attach event listeners
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
  }

  // Initialize signature canvases after the component mounts
  onMount(() => {
    parsedMarkdown.forEach(lineParts => {
      lineParts.forEach(part => {
        if (part.type === "signature") {
          setupSignatureCanvas(part.id);
        }
      });
    });
  });
</script>

<div class="summary">
  <div class="officialMarkdown">
    {#each parsedMarkdown as lineParts}
      <div class="paragraph">
        {#each lineParts as part}
          {#if part.type === "text"}
            {@html marked(part.content)}
          {:else if part.type === "field"}
            <span class="inline-input">
              <Input id={part.id} placeholder={part.placeholder} />
            </span>
          {:else if part.type === "signature"}
            <span class="signature-input">
              <canvas id={part.id} width="250" height="50"></canvas>
            </span>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .summary {
    border: 3px solid var(--primary-light);
    padding: 20px;
    margin: 10px;
    margin-top: 0px;
    border-radius: 15px;
    text-align: left;
  }

  :global(.summary p) {
    margin: auto 0;
    padding: 0;
    display: inline;
  }

  .officialMarkdown {
    box-sizing: border-box;
  }

  .paragraph {
    margin: 0;
    margin-bottom: 7px;
  }

  .inline-input {
    display: inline;
    vertical-align: middle;
    margin: 0 5px;
  }

  :global(.inline-input input) {
    width: 200px;
    display: inline;
  }

  .signature-input {
    display: inline-block;
    vertical-align: middle;
    border: 2px solid gray;
    padding: 5px;
    border-radius: 5px;
    background: white;
    width: 250px;
    height: 50px;
    margin: 0 5px;
    position: relative;
  }

  canvas {
    width: 100%;
    height: 100%;
    cursor: crosshair;
  }
</style>
