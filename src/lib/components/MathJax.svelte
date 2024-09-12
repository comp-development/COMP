<script>
    import { onMount, afterUpdate } from 'svelte';

    export let latex = '';

    let container;

    function renderMath() {
        if (window.MathJax && window.MathJax.typesetPromise) {
            container.innerHTML = latex;
            window.MathJax.typesetPromise([container])
                .catch(err => console.error("MathJax typesetting error: ", err));
        }
    }

    function initMathJax() {
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
                processEscapes: true,
            },
            startup: {
                typeset: false,
                pageReady: () => {
                    renderMath();
                }
            }
        };
    }

    onMount(() => {
        if (!window.MathJax) {
            initMathJax();
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
            script.async = true;
            document.head.appendChild(script);
        } else {
            renderMath();
        }
    });

    afterUpdate(() => {
        renderMath();
    });
</script>

<!-- Only binding container without using {@html} to prevent full re-render -->
<div bind:this={container}></div>
