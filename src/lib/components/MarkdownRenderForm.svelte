<script lang="ts">
  import { marked } from "marked";
  import { Input, Modal, Button, Checkbox } from "flowbite-svelte";
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";

  let {
    source = $bindable(""),
    newResponses = $bindable({}),
    handleSubmit = () => {},
  } = $props();

  let signatures = $state({});
  let isModalOpen = $state(false);
  let activeModalId = $state(null);

  function parseMarkdownWithInputs(markdown) {
    let regex =
      /:(field){\s*#(\w+)(?:\s+type="(\w+)")?(?:\s+placeholder="([^"]*)")?\s*}/g;
    let lines = markdown.split("\n");
    let structuredContent = [];

    for (let line of lines) {
      let parts = [];
      let lastIndex = 0;

      line.replace(
        regex,
        (match, type, id, inputType = "written", placeholder, index) => {
          if (index > lastIndex) {
            parts.push({
              type: "written",
              content: line.slice(lastIndex, index),
            });
          }

          if (!(id in newResponses)) {
            newResponses[id] = null;
          }

          if (inputType == "signature") {
            signatures[id] = {
              name: newResponses[id] ?? "",
              checked: newResponses[id] ? true : false,
            };
          }

          parts.push({
            type: inputType,
            id,
            placeholder: placeholder || "",
          });

          lastIndex = index + match.length;
        },
      );

      if (lastIndex < line.length) {
        parts.push({ type: "written", content: line.slice(lastIndex) });
      }

      structuredContent.push(parts);
    }

    return structuredContent;
  }

  let parsedMarkdown = parseMarkdownWithInputs(source ?? "");

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

  function checkSignature() {
    try {
      let canvas = document.getElementById(activeModalId);

      if (canvas) {
        let ctx = canvas.getContext("2d");
        let blank = document.createElement("canvas");
        blank.width = canvas.width;
        blank.height = canvas.height;

        if (canvas.toDataURL() !== blank.toDataURL()) {
          newResponses[activeModalId] = canvas.toDataURL();
          toast.success("Signature present!");
          isModalOpen = false;
          return;
        }
      }

      if (signatures[activeModalId].name && signatures[activeModalId].checked) {
        newResponses[activeModalId] = signatures[activeModalId].name;
        toast.success("Signature present!");
        isModalOpen = false;
        return;
      }

      throw new Error("The signature is not complete");
    } catch (e) {
      handleError(e);
    }
  }

  function handleSubmitWaiver() {
    try {
      for (const key in newResponses) {
        if (newResponses[key] === null || newResponses[key] === "") {
          throw new Error("All fields are not complete");
        }
      }

      handleSubmit();
    } catch (e) {
      handleError(e);
    }
  }
</script>

<div class="summary">
  <div class="officialMarkdown">
    {#each parsedMarkdown as lineParts}
      <div class="paragraph">
        {#each lineParts as part}
          {#if part.type === "written"}
            {@html marked(part.content ?? "")}
          {:else if part.type === "text"}
            <span class="inline-input">
              <Input
                id={part.id}
                type="text"
                bind:value={newResponses[part.id]}
                placeholder={part.placeholder}
              />
            </span>
          {:else if part.type === "signature"}
            <Button
              color={newResponses[part.id] ? "green" : "red"}
              onclick={() => {
                isModalOpen = true;
                activeModalId = part.id;
                setupSignatureCanvas(part.id);
              }}
              size="xs"
            >
              {newResponses[part.id] ? "Signed" : "Sign"}
            </Button>

            <div class="modalExterior">
              <Modal bind:open={isModalOpen}>
                <div class="specificModalMax">
                  <h3
                    class="text-xl font-medium text-gray-900 dark:text-white text-center mb-3"
                  >
                    Signature
                  </h3>
                  <div class="flex mb-3">
                    <span class="signature-input">
                      <canvas id={activeModalId} width="100%" height="100px"
                      ></canvas>
                    </span>
                  </div>
                  <h4 class="text-center mb-3">OR</h4>
                  <div class="flex mb-3">
                    <div>
                      <Input
                        type="text"
                        class="mb-2"
                        bind:value={signatures[activeModalId].name}
                        placeholder="Write Full Legal Name"
                      />
                      <Checkbox bind:checked={signatures[activeModalId].checked}
                        >I understand that typing my full legal name above
                        constitutes a legally binding signature.</Checkbox
                      >
                    </div>
                  </div>
                  <div class="flex">
                    <Button
                      color="primary"
                      onclick={() => checkSignature()}
                      pill>Submit</Button
                    >
                  </div>
                </div>
              </Modal>
            </div>
          {:else if part.type === "date"}
            <span class="inline-input">
              <input
                id={part.id}
                bind:value={newResponses[part.id]}
                placeholder={part.placeholder}
                type="date"
                class="block w-full disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 text-sm rounded-lg"
              />
            </span>
          {:else if part.type === "number"}
            <span class="inline-input">
              <Input
                id={part.id}
                type="number"
                bind:value={newResponses[part.id]}
                placeholder={part.placeholder}
              />
            </span>
          {/if}
        {/each}
      </div>
    {/each}

    <div class="pt-2 flex">
      <Button color="primary" onclick={handleSubmitWaiver} pill
        >Submit Waiver</Button
      >
    </div>
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
    width: 100%;
    height: 100px;
    position: relative;
  }

  canvas {
    width: 100%;
    height: 100%;
    cursor: crosshair;
  }
</style>
