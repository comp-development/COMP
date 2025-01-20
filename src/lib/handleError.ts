// import toast from "svelte-french-toast";

/**
 * Handles errors that arises during usage.
 *
 * @param error Error
 **/
export function handleError(error: Error) {
  console.error(error.message);
  console.error(error);
  // toast.error(error.message);
}
