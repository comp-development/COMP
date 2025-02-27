import toast from "$lib/toast.svelte";
import posthog from "posthog-js";

/**
 * Handles errors that arises during usage.
 *
 * @param error Error
 **/
export function handleError(error: Error) {
  console.error(error.message);
  console.error(error);
  toast.error(error.message);
  posthog.capture('handle_errored', { error: Error })
}
