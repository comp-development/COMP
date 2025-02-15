<!-- @migration-task Error while migrating Svelte code: Can't migrate code with afterUpdate. Please migrate by hand. -->
<script>
  import { onMount, afterUpdate } from "svelte";

  export let math = "";

  let container;
  let mathJaxScriptLoaded = false;

  function renderMath() {
    if (window.MathJax && window.MathJax.Hub) {
      if (container) {
        container.innerHTML = math;
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, container]);
      }
    }
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

<div bind:this={container}></div>
