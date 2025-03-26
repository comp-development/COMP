<!-- @migration-task Error while migrating Svelte code: Can't migrate code with afterUpdate. Please migrate by hand. -->
<script lang="ts">
  import { supabase } from "$lib/supabaseClient";
  import { onMount, afterUpdate } from "svelte";

  export let math = "";

  let container;
  let mathJaxScriptLoaded = false;

  function replaceImage(html: string) {
    return html.replaceAll(
      /\\image\{([^\\}]+)\}/g,
      (_, m) =>
        `<img src=${supabase.storage.from("problem-images").getPublicUrl(m).data.publicUrl}></img>`,
    );
  }

  function renderMath() {
    if (window.MathJax && window.MathJax.Hub) {
      if (container) {
        container.innerHTML = replaceImage(math);
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, container]);
        
        // Make math elements unfocusable after typesetting
        window.MathJax.Hub.Queue(() => makeUnfocusable());
      }
    }
  }

  // Make all math elements unfocusable
  function makeUnfocusable() {
    if (!container) return;
    
    // Target all MathJax-generated elements
    const mathElements = container.querySelectorAll('.MathJax, .MathJax_Display, .mjx-chtml');
    mathElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.setAttribute('tabindex', '-1');
        el.style.outline = 'none';
      }
    });
  }

  function initMathJax() {
    if (window.MathJax) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML";
      script.async = true;
      script.onload = () => {
        window.MathJax.Hub.Config({
          tex2jax: {
            inlineMath: [
              ["$", "$"],
              ["\\(", "\\)"],
            ],
            displayMath: [
              ["$$", "$$"],
              ["\\[", "\\]"],
            ],
            processEscapes: true,
          },
          TeX: { extensions: ["AMSmath.js", "AMSsymbols.js"] },
          menuSettings: { context: "browser" },
          // Disable keyboard navigation within math
          // elements to prevent tab focus
          showMathMenu: false,
          showMathMenuMSIE: false,
        });
        resolve();
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  onMount(async () => {
    if (!mathJaxScriptLoaded) {
      try {
        await initMathJax();
        mathJaxScriptLoaded = true;
      } catch (err) {
        console.error("MathJax script loading error: ", err);
      }
    }
    renderMath();
  });

  afterUpdate(() => {
    renderMath();
  });
</script>

<div bind:this={container} tabindex="-1"></div>
