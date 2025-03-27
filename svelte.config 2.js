import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

function find_matching_paren_index(content) {
  const open = content.indexOf("(");
  const close = content.indexOf(")");
  if (close == -1) {
    return -1;
  }
  if (open != -1 && open < close) {
    if (content.length <= open + 1) {
      return -1;
    }
    let offset = open + 1;
    content = content.substr(open + 1);
    let submatch_index = find_matching_paren_index(content);
    if (submatch_index == -1 || content.length <= submatch_index + 1) {
      return submatch_index;
    }
    offset += submatch_index + 1;
    const out = find_matching_paren_index(content.substr(submatch_index + 1));
    if (out == -1) {
      return out;
    }
    return out + offset;
  }
  return close;
}

function debug() {
  return {
    name: "debug",
    script: ({ content, filename }) => {
      // Don't overwrite the shim, only consider files in a src directory, and
      // don't consider library files.
      if (
        !filename.includes("logger.ts") &&
        filename.includes("src") &&
        !filename.includes("node_modules")
      ) {
        // Extract relevant part of filename.
        const src_idx = filename.indexOf("src");
        const file = filename.substr(src_idx);
        let out = "";
        // Keep track of line number to print out. (one indexed)
        let line_count = 1;
        // Search for this debug_log string.
        const target = "debug_log(";
        while (true) {
          let start = content.indexOf(target);
          if (start == -1) {
            out += content;
            break;
          }
          // Find matching parentheses. Will work if there are nested parentheses in
          // the expressions, but will not handle escaped parentheses correctly.
          const end = find_matching_paren_index(
            content.substr(start + target.length),
          );
          if (end == -1) {
            out += content;
            break;
          }
          out += content.substr(0, start);
          const window = content.substr(start + target.length, end);
          const lines = (
            content.substr(0, start + target.length + end).match(/\n/g) || ""
          ).length;
          line_count += lines;
          // Escape quotes in the expression.
          const expr = window.replaceAll('"', '\\"');
          // Use JSON.parse and JSON.stringify to freeze the current value and log it.
          // Terrible performance, but this is for debugging only.
          out += `console.debug("${file}:${line_count}\\n","DEBUG: ${expr}\\n", ...[${window}].map(v => JSON.parse(JSON.stringify(v)))`;
          content = content.substr(start + target.length + end);
        }

        return { code: out };
      } else {
        return { code: content };
      }
    },
  };
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [vitePreprocess(), debug()],

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter(),
  },
};

export default config;
