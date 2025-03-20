<script lang="ts">
  import { marked } from "marked";
  import { Input, Modal, Button, Checkbox } from "flowbite-svelte";
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";
  import jsPDF from "jspdf";
  import html2canvas from "html2canvas";
  import Loading from "$lib/components/Loading.svelte";

  let {
    source = $bindable(""),
    newResponses = $bindable({}),
    handleSubmit = () => {},
  } = $props();

  let signatures = $state({});
  let isModalOpen = $state(false);
  let loading = $state(false);
  let activeModalId = $state(null);
  let drawing = $state(false);
  let canvasElements = $state({});

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
            if (inputType == "signature") {
              newResponses[id] = {
                name: null,
                signature: null,
                checked: false,
              };
            } else {
              newResponses[id] = null;
            }
          }

          if (inputType == "signature") {
            signatures[id] = {
              name: newResponses[id].name ?? "",
              checked: newResponses[id].checked ? true : false,
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

  function createDrawing() {
    let ctx = canvasElements[activeModalId].getContext("2d");

    if (
      newResponses[activeModalId] &&
      newResponses[activeModalId].signature?.startsWith("data:image")
    ) {
      let img = new Image();
      img.src = newResponses[activeModalId].signature;
      img.onload = function () {
        ctx.drawImage(img, 0, 0);
      };
    }
  }

  function startDrawing(event) {
    let ctx = canvasElements[activeModalId].getContext("2d");

    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    if (event.button === 0) {
      drawing = true;
      ctx.beginPath();
    }
  }

  function draw(event) {
    if (!drawing) return;

    let ctx = canvasElements[activeModalId].getContext("2d");

    let rect = canvasElements[activeModalId].getBoundingClientRect();
    let scaleX = canvasElements[activeModalId].width / rect.width;
    let scaleY = canvasElements[activeModalId].height / rect.height;

    let x = (event.clientX - rect.left) * scaleX;
    let y = (event.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.moveTo(x, y);
    ctx.stroke();
  }

  function clearDrawing() {
    let ctx = canvasElements[activeModalId].getContext("2d");
    ctx.clearRect(
      0,
      0,
      canvasElements[activeModalId].width,
      canvasElements[activeModalId].height,
    );
  }

  function stopDrawing() {
    drawing = false;
  }

  function checkSignature() {
    try {
      let blank = document.createElement("canvas");
      blank.width = canvasElements[activeModalId].width;
      blank.height = canvasElements[activeModalId].height;

      if (canvasElements[activeModalId].toDataURL() !== blank.toDataURL()) {
        newResponses[activeModalId] = {
          signature: canvasElements[activeModalId].toDataURL(),
        };
        toast.success("Signature present!");
        isModalOpen = false;
        return;
      }

      if (signatures[activeModalId].name && signatures[activeModalId].checked) {
        newResponses[activeModalId] = signatures[activeModalId];
        toast.success("Signature present!");
        isModalOpen = false;
        return;
      }

      throw new Error("The signature is not complete");
    } catch (e) {
      handleError(e);
    }
  }

  async function generatePDF() {
    try {
      loading = true;

      // Create iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.visibility = "hidden";
      iframe.width = "859px";
      iframe.height = "auto";

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <html>
        <head>
          <style>
            body {
              width: 859px;
              padding: 40px;
              font-size: 20px;
              box-sizing: border-box;
              font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
              line-height: 1.5;
              overflow: hidden;
              text-align: left;
            }
          </style>
        </head>
        <body>
          ${marked(source)}
        </body>
        </html>
        `);
      doc.close();

      // Replace field placeholders inside iframe
      let htmlContent = doc.body.innerHTML;
      htmlContent = htmlContent.replace(
        /:field{\s*#(\w+)\s+type="(\w+)"(?:\s+placeholder="([^"]+)")?\s*}/g,
        (match, id, type, placeholder) => {
          if (type === "signature" && newResponses[id]?.signature) {
            return `<img src="${newResponses[id]?.signature}" style="border:1px solid black;width:200px;height:50px;">`;
          } else {
            let text =
              type === "signature"
                ? newResponses[id]?.name
                : (newResponses[id] ?? placeholder ?? "________");
            return `<span style="border-bottom:1px solid black;padding:2px;">${text}</span>`;
          }
        },
      );
      doc.body.innerHTML = htmlContent;

      // Wait for iframe content to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Capture iframe content
      const canvas = await html2canvas(doc.body, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
      });

      document.body.removeChild(iframe); // Remove iframe after capture

      // Generate PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "letter",
      });

      const margin = 50;
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height - margin;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = 0;

      pdf.addImage(imgData, "PNG", 0, yPosition, imgWidth, imgHeight);

      if (imgHeight > pageHeight) {
        let currentHeight = imgHeight;
        let startY = 0;

        while (currentHeight > pageHeight) {
          pdf.addPage();
          startY += (pageHeight - margin);
          currentHeight -= (pageHeight - margin);
          pdf.addImage(imgData, "PNG", 0, -startY, imgWidth, imgHeight);
        }
      }

      pdf.save("waiver.pdf");
    } catch (error) {
      handleError(error);
    }
    loading = false;
  }

  function handleSubmitWaiver() {
    try {
      for (const key in newResponses) {
        if (newResponses[key] === null || newResponses[key] === "") {
          throw new Error("All fields are not complete");
        }
      }

      generatePDF();

      //handleSubmit(pdf);
    } catch (e) {
      handleError(e);
    }
  }
</script>

{#if loading}
  <Loading />
{:else}
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
                color={(newResponses[part.id].name &&
                  newResponses[part.id].checked) ||
                newResponses[part.id].signature
                  ? "green"
                  : "red"}
                onclick={() => {
                  isModalOpen = true;
                  activeModalId = part.id;

                  setTimeout(() => {
                    clearDrawing();
                    createDrawing();
                  }, 100);
                }}
                size="xs"
              >
                {(newResponses[part.id].name &&
                  newResponses[part.id].checked) ||
                newResponses[part.id].signature
                  ? "Signed"
                  : "Sign"}
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
                      <div class="signature-input">
                        <canvas
                          id={activeModalId}
                          bind:this={canvasElements[activeModalId]}
                          width="400px"
                          height="100px"
                          onmousedown={startDrawing}
                          onmousemove={draw}
                          onmouseleave={stopDrawing}
                          onmouseup={stopDrawing}
                        ></canvas>
                      </div>
                    </div>
                    <button onclick={clearDrawing}>Clear Drawing</button>
                    <h4 class="text-center mb-3">OR</h4>
                    <div class="flex mb-3">
                      <div>
                        <Input
                          type="text"
                          class="mb-2"
                          bind:value={signatures[activeModalId].name}
                          placeholder="Write Full Legal Name"
                        />
                        <Checkbox
                          bind:checked={signatures[activeModalId].checked}
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
{/if}

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
