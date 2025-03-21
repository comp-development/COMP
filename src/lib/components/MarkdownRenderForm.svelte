<script lang="ts">
  import { marked } from "marked";
  import { Input, Modal, Button, Checkbox, Alert } from "flowbite-svelte";
  import { handleError } from "$lib/handleError";
  import toast from "$lib/toast.svelte";
  import jsPDF from "jspdf";
  import html2canvas from "html2canvas";
  import Loading from "$lib/components/Loading.svelte";
  import { PenOutline } from "flowbite-svelte-icons";

  let {
    source = $bindable(""),
    newResponses = $bindable({}),
    logo = null,
    handleSubmit = () => {},
    isAdmin = $bindable(false),
  } = $props();

  let signatures = $state({});
  let isModalOpen = $state(false);
  let loading = $state(false);
  let activeModalId = $state(null);
  let drawing = $state(false);
  let canvasElements = $state({});
  let signatureMethod = $state('written');
  let missingFields = $state([]);
  let showValidation = $state(false);
  let alertRef = $state(null);

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
            } else if (inputType == "date" && placeholder === "today") {
              // Set today's date for fields with placeholder="today"
              const today = new Date();
              const yyyy = today.getFullYear();
              const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
              const dd = String(today.getDate()).padStart(2, '0');
              newResponses[id] = `${yyyy}-${mm}-${dd}`;
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
    
    // Also clear the saved signature if it exists
    if (newResponses[activeModalId]?.signature) {
      newResponses[activeModalId].signature = null;
    }
  }

  function stopDrawing() {
    if (drawing) {
      drawing = false;
      
      // Save the current drawing state
      let canvas = canvasElements[activeModalId];
      let blank = document.createElement("canvas");
      blank.width = canvas.width;
      blank.height = canvas.height;
      
      // Only save if there's actually a drawing (not blank)
      if (canvas.toDataURL() !== blank.toDataURL()) {
        // Store in newResponses temporarily but don't close modal
        if (!newResponses[activeModalId]) {
          newResponses[activeModalId] = {};
        }
        newResponses[activeModalId].signature = canvas.toDataURL();
        
        // Force UI update by creating a new object
        newResponses = { ...newResponses };
      }
    }
  }

  function checkSignature() {
    try {
      if (signatureMethod === 'written') {
        let blank = document.createElement("canvas");
        blank.width = canvasElements[activeModalId].width;
        blank.height = canvasElements[activeModalId].height;

        if (canvasElements[activeModalId].toDataURL() !== blank.toDataURL()) {
          newResponses[activeModalId] = {
            signature: canvasElements[activeModalId].toDataURL(),
          };
          // Force UI update
          newResponses = { ...newResponses };
          isModalOpen = false;
          return;
        }
        
        throw new Error("Please draw your signature");
      } else if (signatureMethod === 'typed') {
        if (signatures[activeModalId].name && signatures[activeModalId].checked) {
          newResponses[activeModalId] = { 
            ...signatures[activeModalId],
            name: signatures[activeModalId].name,
            checked: signatures[activeModalId].checked
          };
          // Force UI update
          newResponses = { ...newResponses };
          isModalOpen = false;
          return;
        }
        
        throw new Error("Please type your full name and check the consent box");
      }
    } catch (e) {
      handleError(e);
    }
  }

  async function generatePDF(isBlank = false) {
    try {
      // Create iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.visibility = "hidden";
      iframe.width = "859px";
      iframe.height = "fit-content";

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&display=swap" rel="stylesheet">
            <style>
              body {
                width: 859px;
                padding: 0 40px;
                font-size: 20px;
                box-sizing: border-box;
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                line-height: 1.5;
                overflow: hidden;
                text-align: left;
              }
              .signature-text {
                font-family: 'Dancing Script', cursive;
                font-weight: 700;
                font-size: 28px;
              }
              .blank-field {
                border: 1px solid black;
                padding: 10px 15px;
                min-width: 300px;
                display: inline-block;
                height: 20px;
              }
              .blank-signature {
                border: 1px solid black;
                padding: 10px;
                width: 300px;
                height: 40px;
                display: inline-block;
                vertical-align: middle;
              }
            </style>
          </head>
          <body>
            <img src=${logo} style="width: 120px; height: auto; margin: 0 auto; display: block;" />
            ${marked(source)}
            <br />
          </body>
        </html>
        `);
      doc.close();

      // Replace field placeholders inside iframe
      let htmlContent = doc.body.innerHTML;
      htmlContent = htmlContent.replace(
        /:field{\s*#(\w+)\s+type="(\w+)"(?:\s+placeholder="([^"]+)")?\s*}/g,
        (match, id, type, placeholder) => {
          if (isBlank) {
            // Generate blank fields for printable PDF
            if (type === "signature") {
              return `<div class="blank-signature"></div>`;
            } else if (type === "date") {
              return `<div class="blank-field" style="min-width: 150px;"></div>`;
            } else {
              return `<div class="blank-field"></div>`;
            }
          } else {
            // Generate filled fields for submission
            if (type === "signature" && newResponses[id]?.signature) {
              return `<img src="${newResponses[id]?.signature}" style="border:1px solid black;width:200px;height:50px;display: inline-block; vertical-align: middle;">`;
            } else if (type === "signature" && newResponses[id]?.name) {
              // Render typed signatures with the cursive font
              return `<span style="border:1px solid black;padding:10px;padding-top: 0px;display:inline-block;min-width:180px;"><span class="signature-text">${newResponses[id].name}</span></span>`;
            } else {
              let text = newResponses[id] ?? placeholder ?? "________";
              return `<span style="border:1px solid black;padding:10px;padding-top: 0px;">${text}</span>`;
            }
          }
        },
      );
      doc.body.innerHTML = htmlContent;

      // Wait for iframe content to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Capture iframe content
      const fullCanvas = await html2canvas(doc.body, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
      });

      document.body.removeChild(iframe); // Remove iframe after capture

      // PDF Configuration
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "letter",
      });

      const margin = 50;
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = 2050;
      const imgWidth = pageWidth;
      let yOffset = 0;
      let pageNum = 0;
      const ctx = fullCanvas.getContext("2d");

      while (yOffset < fullCanvas.height) {
        let remainingHeight = fullCanvas.height - yOffset;
        let sliceHeight = Math.min(pageHeight - margin, remainingHeight);

        // Adjust sliceHeight to find a natural line break between two lines
        for (let y = yOffset + sliceHeight; y > yOffset + 10; y--) {
          let pixelRow = ctx.getImageData(0, y, fullCanvas.width, 1).data;
          let isEmptyRow = pixelRow.every((value) => value > 240); // Adjust for near-white background

          if (isEmptyRow) {
            sliceHeight = y - yOffset; // Adjust sliceHeight to this line break
            break;
          }
        }

        // Create a new slice canvas for this page
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = fullCanvas.width;
        sliceCanvas.height = sliceHeight;

        const sliceCtx = sliceCanvas.getContext("2d");
        sliceCtx.drawImage(fullCanvas, 0, -yOffset);

        // Convert the slice to an image
        const imgData = sliceCanvas.toDataURL("image/png");

        pdf.addImage(
          imgData,
          "PNG",
          0,
          margin / 2,
          imgWidth,
          (sliceHeight * imgWidth) / sliceCanvas.width,
        );

        yOffset += sliceHeight;
        pageNum++;

        if (yOffset + 10 < fullCanvas.height) {
          pdf.addPage();
        }
      }

      return pdf.output('blob');
    } catch (error) {
      handleError(error);
    }
  }

  async function handleSubmitWaiver() {
    loading = true;
    try {
      missingFields = [];
      
      // Check each field to identify missing ones
      for (const key in newResponses) {
        if (newResponses[key] === null || newResponses[key] === "") {
          missingFields.push(key);
        } else if (typeof newResponses[key] === 'object') {
          // Special check for signature objects
          if (newResponses[key].name === null && newResponses[key].signature === null) {
            missingFields.push(key);
          }
        }
      }
      
      if (missingFields.length > 0) {
        showValidation = true;
        throw new Error(`${missingFields.length} field(s) are incomplete. Please complete all required fields.`);
      }

      let pdf = await generatePDF(false);
      await handleSubmit(pdf);
      showValidation = false;
    } catch (e) {
      handleError(e);
      // Scroll to the alert after a short delay to ensure it's rendered
      setTimeout(() => {
        if (alertRef && missingFields.length > 0) {
          alertRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
    loading = false;
  }

  async function downloadBlankPDF() {
    loading = true;
    try {
      const pdf = await generatePDF(true);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdf);
      link.download = 'blank_waiver.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      handleError(e);
    }
    loading = false;
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&display=swap" rel="stylesheet">
</svelte:head>

{#if loading}
  <Loading />
{:else}
  <div class="summary">
    {#if showValidation && missingFields.length > 0}
      <div bind:this={alertRef}>
        <Alert color="red" dismissable={false}>
          <span class="font-medium">{missingFields.length} required field(s) are incomplete. Please complete all required fields.</span>
        </Alert>
      </div><br>
    {/if}
    <div class="officialMarkdown">
      {#each parsedMarkdown as lineParts}
        <div class="paragraph">
          {#each lineParts as part}
            {#if part.type === "written"}
              {@html marked(part.content ?? "")}
            {:else if part.type === "text"}
              <span class="inline-input {showValidation && missingFields.includes(part.id) ? 'input-error' : ''}">
                <Input
                  id={part.id}
                  type="text"
                  bind:value={newResponses[part.id]}
                  placeholder={part.placeholder}
                />
              </span>
            {:else if part.type === "signature"}
              <div 
                class="signature-box {newResponses[part.id]?.signature || (newResponses[part.id]?.name && newResponses[part.id]?.checked) ? 'signed' : 'unsigned'} {showValidation && missingFields.includes(part.id) ? 'signature-error' : ''}"
                onclick={() => {
                  isModalOpen = true;
                  activeModalId = part.id;
                  
                  // Determine initial signature method based on existing data
                  if (newResponses[part.id]?.signature) {
                    signatureMethod = 'written';
                  } else if (newResponses[part.id]?.name) {
                    signatureMethod = 'typed';
                  }

                  setTimeout(() => {
                    if (signatureMethod === 'written') {
                      // Only clear if there's no signature saved
                      if (!newResponses[part.id]?.signature) {
                        clearDrawing();
                      }
                      createDrawing();
                    }
                  }, 100);
                }}
              >
                {#if newResponses[part.id]?.signature}
                  <!-- Display drawn signature -->
                  <img src={newResponses[part.id].signature} alt="Signature" class="signature-image" />
                {:else if newResponses[part.id]?.name && newResponses[part.id]?.checked}
                  <!-- Display typed signature -->
                  <div class="typed-signature">
                    <span class="signature-name">{newResponses[part.id].name}</span>
                  </div>
                {:else}
                  <!-- Empty signature box with hint -->
                  <div class="signature-placeholder">
                    <PenOutline size="sm" />
                    <span>Click to sign</span>
                    {#if showValidation && missingFields.includes(part.id)}
                      <span class="error-message">Signature required</span>
                    {/if}
                  </div>
                {/if}
              </div>

              <div class="modalExterior">
                <Modal bind:open={isModalOpen}>
                  <div class="specificModalMax">
                    <h3
                      class="text-xl font-medium text-gray-900 dark:text-white text-center mb-3"
                    >
                      Signature
                    </h3>
                    <div class="flex justify-center gap-4 mb-4">
                      <Button 
                        color={signatureMethod === 'written' ? 'primary' : 'light'} 
                        onclick={() => {
                          signatureMethod = 'written';
                          // Wait for DOM update before recreating the drawing
                          setTimeout(() => {
                            // Don't clear an existing drawing
                            createDrawing();
                          }, 50);
                        }}
                      >
                        Draw Signature
                      </Button>
                      <Button 
                        color={signatureMethod === 'typed' ? 'primary' : 'light'} 
                        onclick={() => {
                          // Save the drawing before switching if there is one
                          if (signatureMethod === 'written') {
                            let canvas = canvasElements[activeModalId];
                            let blank = document.createElement("canvas");
                            blank.width = canvas.width;
                            blank.height = canvas.height;
                            
                            if (canvas.toDataURL() !== blank.toDataURL()) {
                              if (!newResponses[activeModalId]) {
                                newResponses[activeModalId] = {};
                              }
                              newResponses[activeModalId].signature = canvas.toDataURL();
                              // Force refresh of UI 
                              newResponses = { ...newResponses };
                            }
                          }
                          
                          signatureMethod = 'typed';
                        }}
                      >
                        Type Signature
                      </Button>
                    </div>
                    
                    {#if signatureMethod === 'written'}
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
                    {:else}
                      <div class="flex mb-3 flex-col">
                        <div class="w-full">
                          <Input
                            type="text"
                            class="mb-2"
                            bind:value={signatures[activeModalId].name}
                            on:input={() => {
                              // Update newResponses in real-time for UI preview
                              if (signatures[activeModalId].name) {
                                if (!newResponses[activeModalId]) {
                                  newResponses[activeModalId] = {};
                                }
                                newResponses[activeModalId] = {
                                  ...newResponses[activeModalId],
                                  name: signatures[activeModalId].name,
                                  checked: signatures[activeModalId].checked
                                };
                              } else if (newResponses[activeModalId]?.name) {
                                // Handle case when user clears the name
                                newResponses[activeModalId] = {
                                  ...newResponses[activeModalId],
                                  name: null
                                };
                              }
                              // Force UI update
                              newResponses = { ...newResponses };
                            }}
                            placeholder="Write Full Legal Name"
                          />
                          <Checkbox
                            bind:checked={signatures[activeModalId].checked}
                            on:change={() => {
                              // Update newResponses in real-time for UI preview
                              if (signatures[activeModalId].name) {
                                if (!newResponses[activeModalId]) {
                                  newResponses[activeModalId] = {};
                                }
                                newResponses[activeModalId] = {
                                  ...newResponses[activeModalId],
                                  name: signatures[activeModalId].name,
                                  checked: signatures[activeModalId].checked
                                };
                                // Force UI update
                                newResponses = { ...newResponses };
                              }
                            }}
                            >I understand that typing my full legal name above
                            constitutes a legally binding signature.</Checkbox
                          >
                        </div>
                        
                        {#if signatures[activeModalId].name}
                          <div class="preview-typed-signature mt-4">
                            <div class="typed-signature-preview">
                              <span>{signatures[activeModalId].name}</span>
                            </div>
                            <div class="preview-label">Preview{signatures[activeModalId].checked ? '' : ' (Checkbox must be checked to complete signature)'}</div>
                          </div>
                        {/if}
                      </div>
                    {/if}
                    
                    <div class="flex mt-4">
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
              <span class="inline-input {showValidation && missingFields.includes(part.id) ? 'input-error' : ''}">
                <input
                  id={part.id}
                  bind:value={newResponses[part.id]}
                  placeholder={part.placeholder}
                  type="date"
                  class="block w-full disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 text-sm rounded-lg"
                />
              </span>
            {:else if part.type === "number"}
              <span class="inline-input {showValidation && missingFields.includes(part.id) ? 'input-error' : ''}">
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

      <div class="pt-2 flex gap-4">
        <Button color="primary" onclick={handleSubmitWaiver} pill>Submit Waiver</Button>
        {#if isAdmin}
          <Button color="light" onclick={downloadBlankPDF} pill>Download Blank PDF</Button>
        {/if}
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
    scroll-behavior: smooth;
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
    position: relative;
  }

  :global(.inline-input input) {
    width: 200px;
    display: inline;
  }
  
  .input-error :global(input) {
    border-color: #e53e3e !important;
    box-shadow: 0 0 0 1px #e53e3e !important;
  }
  
  .error-message {
    color: #e53e3e;
    font-size: 0.75rem;
    position: absolute;
    bottom: -1.2rem;
    left: 0;
  }
  
  .signature-error {
    border-color: #e53e3e !important;
    box-shadow: 0 0 0 1px #e53e3e !important;
  }
  
  .validation-error {
    background-color: #FFF5F5;
    border: 1px solid #FED7D7;
    border-radius: 5px;
    padding: 10px 15px;
    margin-bottom: 15px;
    color: #e53e3e;
  }
  
  .validation-error p {
    font-weight: 600;
    margin-bottom: 5px !important;
    display: block !important;
  }
  
  .validation-error ul {
    margin: 0;
    padding-left: 20px;
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
  
  .specificModalMax {
    max-width: 500px;
    margin: 0 auto;
  }

  .signature-box {
    width: 240px;
    height: 60px;
    border: 1px solid #ccc;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin: 0 5px;
    vertical-align: middle;
    position: relative;
    overflow: hidden;
    background-color: white;
  }
  
  .signature-box:hover {
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    border-color: #aaa;
  }

  .signed {
    background-color: white;
    border-color: #4CAF50;
    border-width: 1px;
  }
  
  .unsigned {
    background-color: white;
    border-style: dashed;
  }
  
  .signature-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
    width: 100%;
    height: 100%;
    background-color: white;
  }
  
  .typed-signature {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Dancing Script', cursive;
    font-size: 1.4rem;
    font-weight: 700;
    color: #000;
    letter-spacing: 0.5px;
    line-height: 1;
  }
  
  .signature-name {
    display: inline-block;
  }
  
  .signature-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #777;
    font-size: 0.75rem;
    padding: 5px;
    width: 100%;
    height: 100%;
  }
  
  .signature-placeholder span {
    margin-top: 3px;
  }
  
  .preview-typed-signature {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 10px;
  }
  
  .typed-signature-preview {
    font-family: 'Dancing Script', cursive;
    font-size: 1.6rem;
    font-weight: 700;
    color: #000;
    padding: 10px 20px;
    border-bottom: 1px solid #000;
    min-width: 200px;
    text-align: center;
  }
  
  .preview-label {
    font-size: 0.75rem;
    color: #777;
    margin-top: 4px;
  }
</style>