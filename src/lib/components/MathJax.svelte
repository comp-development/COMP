<script>
    import { onMount, afterUpdate } from 'svelte';

    export let latex = '';

    let container;

    // Function to load MathJax script
    function loadMathJax() {
        return new Promise((resolve, reject) => {
            if (window.MathJax) {
                resolve(window.MathJax);
                return;
            }

            window.MathJax = {
                tex: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    displayMath: [['$$', '$$'], ['\\[', '\\]']],
                    processEscapes: true,
                },
                startup: {
                    typeset: false
                }
            };

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
            script.async = true;
            script.onload = () => resolve(window.MathJax);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Function to render MathJax
    async function renderMath() {
        try {
            const MathJax = await loadMathJax();
            container.innerHTML = latex;
            await MathJax.typesetPromise([container]);
        } catch (err) {
            console.error("MathJax loading or typesetting error: ", err);
        }
    }

    onMount(() => {
        renderMath();
    });

    afterUpdate(() => {
        renderMath();
    });
</script>

<div bind:this={container}></div>
