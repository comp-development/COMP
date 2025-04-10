<!-- 
  EntityBadge.svelte - A reusable badge-like component for displaying entity information
  in a compact and visually appealing format. Can be used for students, teams, or organizations.
-->
<script lang="ts">
  import { Tooltip } from "flowbite-svelte";

  // Props for the component
  export let primaryText: string = ""; // Main display text (e.g., name)
  export let prefix: string | null = null; // Optional prefix (e.g., student number)
  export let subtitle: string | null = null; // Optional subtitle (e.g., email)
  export let tooltipText: string | null = null; // Text to show on hover (e.g., ID)
  export let tooltipPlacement: "top" | "right" | "bottom" | "left" = "top";
  export let icon: any = null; // Optional icon component
  export let accentColor: string = "var(--primary, #4B5563)"; // Color for the accent elements
  
  // New styling props
  export let align: "left" | "center" | "right" = "left"; // Text alignment within the badge
  export let backgroundColor: string | null = "rgba(243, 244, 246, 0.7)"; // Default light gray background instead of transparent
  export let hoverBackgroundColor: string | null = "rgba(229, 231, 235, 0.9)"; // Default hover background
  export let textColor: string | null = null; // Override text color
  export let subtitleColor: string | null = null; // Override subtitle color
  export let prefixColor: string | null = null; // Override prefix color
  export let borderRadius: string = "0.25rem"; // Border radius
  export let padding: string = "0.5rem 0.75rem"; // Padding
  export let width: string | null = null; // Custom width
  export let fitContent: boolean = false; // When true, badge will use minimum width to fit content
  export let compact: boolean = false; // Compact mode (less padding, smaller text)
  
  // Functional props
  export let href: string | null = null; // URL to navigate to when clicked
  export let target: "_blank" | "_self" | "_parent" | "_top" = "_self"; // Target for links
  export let onClick: (() => void) | null = null; // Click handler
  export let disabled: boolean = false; // Disabled state
  
  // Determine if the badge is clickable
  $: isClickable = href || onClick;
  
  // Handle click events
  function handleClick(e: MouseEvent | KeyboardEvent) {
    if (disabled) {
      e.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick();
    }
  }
  
  // Compute the alignment class
  $: alignmentClass = align === "center" ? "text-center items-center" : 
                     align === "right" ? "text-right items-end" : 
                     "text-left items-start";
  
  // Calculate inline style for text alignment
  $: textAlignStyle = `text-align: ${align};`;
</script>

<!-- Use the appropriate element based on whether it's a link or not -->
{#if href && !disabled}
  <a {href} {target} 
     class="badge-wrapper relative {fitContent ? 'inline-block' : 'block w-full'}"
     class:clickable={isClickable}
     class:disabled
     onclick={handleClick}
     style="--badge-bg: {backgroundColor || 'rgba(243, 244, 246, 1)'}; 
            --badge-hover-bg: {hoverBackgroundColor || 'rgba(229, 231, 235, 1)'};
            --badge-accent: {accentColor};
            --badge-text: {textColor || 'inherit'};
            --badge-subtitle: {subtitleColor || 'var(--gray-500, #6B7280)'};
            --badge-prefix: {prefixColor || 'var(--gray-500, #6B7280)'};
            --badge-radius: {borderRadius};
            --badge-padding: {padding};
            {width ? `width: ${width};` : ''}"
  >
    {#if tooltipText}
      <Tooltip color="dark" placement={tooltipPlacement}>{tooltipText}</Tooltip>
    {/if}
    
    <div class="entity-badge flex flex-col {alignmentClass} {compact ? 'compact' : ''}"
         role="button"
         tabindex="0"
         style="{textAlignStyle} {fitContent ? 'width: max-content;' : ''}">
      <!-- Primary info row with prefix and name -->
      <div class="badge-content {fitContent ? 'w-auto' : 'w-full'}" style={textAlignStyle}>
        {#if prefix}
          <span class="prefix text-xs font-medium mr-1">#{prefix}</span>
        {/if}
        
        <span class="primary-text font-semibold">
          {primaryText || "Unnamed"}
        </span>
        
        {#if icon}
          <span class="icon-wrapper ml-1 inline-block">
            <svelte:component this={icon} class="w-3 h-3" />
          </span>
        {/if}
      
        <!-- Subtitle row -->
        {#if subtitle}
          <div class="subtitle text-xs mt-0.5 truncate max-w-full">
            {subtitle}
          </div>
        {/if}
      </div>
    </div>
  </a>
{:else}
  <div 
    class="badge-wrapper relative {fitContent ? 'inline-block' : 'w-full'}"
    class:clickable={isClickable && !disabled}
    class:disabled
    onclick={handleClick}
    onkeydown={(e) => e.key === 'Enter' && handleClick(e)}
    role={isClickable ? "button" : "presentation"}
    tabindex={isClickable ? 0 : undefined}
    style="--badge-bg: {backgroundColor || 'rgba(243, 244, 246, 1)'}; 
           --badge-hover-bg: {hoverBackgroundColor || 'rgba(229, 231, 235, 1)'};
           --badge-accent: {accentColor};
           --badge-text: {textColor || 'inherit'};
           --badge-subtitle: {subtitleColor || 'var(--gray-500, #6B7280)'};
           --badge-prefix: {prefixColor || 'var(--gray-500, #6B7280)'};
           --badge-radius: {borderRadius};
           --badge-padding: {padding};
           {width ? `width: ${width};` : ''}"
  >
    {#if tooltipText}
      <Tooltip color="dark" placement={tooltipPlacement}>{tooltipText}</Tooltip>
    {/if}
    
    <div class="entity-badge flex flex-col {alignmentClass} {compact ? 'compact' : ''}"
         style="{textAlignStyle} {fitContent ? 'width: max-content;' : ''}">
      <!-- Primary info row with prefix and name -->
      <div class="badge-content {fitContent ? 'w-auto' : 'w-full'}" style={textAlignStyle}>
        {#if prefix}
          <span class="prefix text-xs font-medium mr-1">#{prefix}</span>
        {/if}
        
        <span class="primary-text font-semibold">
          {primaryText || "Unnamed"}
        </span>
        
        {#if icon}
          <span class="icon-wrapper ml-1 inline-block">
            <svelte:component this={icon} class="w-3 h-3" />
          </span>
        {/if}
      
        <!-- Subtitle row -->
        {#if subtitle}
          <div class="subtitle text-xs mt-0.5 truncate max-w-full">
            {subtitle}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .entity-badge {
    padding: var(--badge-padding, 0.5rem 0.75rem);
    border-radius: var(--badge-radius, 0.25rem);
    background-color: var(--badge-bg, rgba(243, 244, 246, 1));
    transition: all 0.15s ease-in-out;
    max-width: 100%;
    display: inline-flex;
    flex-direction: column;
  }
  
  .entity-badge.compact {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }
  
  .badge-content {
    display: block; /* Ensure text respects text-align */
  }
  
  .primary-text {
    color: var(--badge-text, var(--primary-dark));
    display: inline; /* Allow inline elements to flow naturally */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .subtitle {
    color: var(--badge-subtitle, var(--gray-500, #6B7280));
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .prefix {
    color: var(--badge-prefix, var(--gray-500, #6B7280));
    display: inline;
  }
  
  .badge-wrapper {
    position: relative;
    max-width: 100%;
    cursor: default;
  }
  
  .badge-wrapper.clickable {
    cursor: pointer;
  }
  
  .badge-wrapper.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Hover effect for non-disabled badges */
  .badge-wrapper:not(.disabled):hover .entity-badge {
    background-color: var(--badge-hover-bg, rgba(0, 0, 0, 0.03));
  }
  
  /* Focus styles for accessibility */
  .badge-wrapper.clickable:focus-visible {
    outline: 2px solid var(--badge-accent, var(--primary, #4B5563));
    outline-offset: 2px;
  }
  
  a.badge-wrapper {
    text-decoration: none;
    color: inherit;
  }
</style> 