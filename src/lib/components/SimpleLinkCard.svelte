<script lang="ts">
  import { Button, Card, Badge } from 'flowbite-svelte';
  import { ArrowRightOutline, FileLinesSolid } from 'flowbite-svelte-icons';

  export let test: {
    test_name: string;
    link: string | null | undefined;
    instructions: string | null | undefined;
    division?: string;
    is_team?: boolean; 
  };

  function openLink() {
    if (test.link) {
      window.open(test.link, '_blank', 'noopener,noreferrer');
    }
  }

  function openInstructions() {
    if (test.instructions) {
      window.open(test.instructions, '_blank', 'noopener,noreferrer');
    }
  }
</script>

<Card class="h-full flex flex-col">
  <div class="flex-grow mb-4">
    <h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
      {test.test_name}
    </h5>
    {#if test.is_team}
      <Badge color="blue">Team</Badge>
    {/if}
    
    <!-- Placeholder paragraph -->
    <p class="mt-4 text-gray-700 dark:text-gray-400 text-sm">
      This round will happen on google sheets. The instructions link will be made available at the beginning of the round, and then you will be granted access to the spreadsheet at the beginning of the solving period 15 minutes later. Then, you'll have 60 minutes to solve the puzzles.
    </p>
  </div>
  
  <div class="flex gap-2">
    <Button on:click={openInstructions} class="w-full" disabled={!test.instructions} color="light">
      <FileLinesSolid class="mr-2 w-5 h-5" /> Instructions
    </Button>
    <Button on:click={openLink} class="w-full" disabled={!test.link}>
      Go to Test <ArrowRightOutline class="ml-2 w-5 h-5" />
    </Button>
  </div>
</Card>

<style>
  /* Add any specific styles if needed, potentially reusing styles from TestCard */
</style> 