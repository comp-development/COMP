<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { slide } from 'svelte/transition';

  type Tab = {
    id: string;
    title: string;
    variant?: string;
    icon?: any;
    disabled?: boolean;
    customBgColor?: string;
    customTextColor?: string;
    customHoverColor?: string;
    customActiveColor?: string;
    customBorderColor?: string;
  };

  export let tabs: Tab[] = [];
  export let activeTabId: string = '';
  export let style: 'traditional' | 'pill' | 'full' = 'traditional';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let tabAlignment: 'left' | 'center' | 'right' = 'left';
  export let spacing: { x: number, y: number } = { x: 2, y: 4 }; // Tailwind spacing units
  export let contentBackground: boolean = false;
  
  // Color theme customization
  export let colorVariants: Record<string, {
    bg: string;
    text: string;
    hover: string;
    active: string;
    border: string;
    borderColor: string; // CSS hex color for the border
  }> = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      hover: 'hover:bg-blue-100',
      active: 'bg-blue-100',
      border: 'border-blue-200',
      borderColor: '#93c5fd'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      hover: 'hover:bg-green-100',
      active: 'bg-green-100',
      border: 'border-green-200',
      borderColor: '#86efac'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      hover: 'hover:bg-purple-100',
      active: 'bg-purple-100',
      border: 'border-purple-200',
      borderColor: '#d8b4fe'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      hover: 'hover:bg-amber-100',
      active: 'bg-amber-100',
      border: 'border-amber-200',
      borderColor: '#fcd34d'
    },
    default: {
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      hover: 'hover:bg-gray-100',
      active: 'bg-gray-100',
      border: 'border-gray-200',
      borderColor: '#d1d5db'
    }
  };
  
  // Compatibility mapping for legacy props
  export let mapEntityToVariant: Record<string, string> = {
    student: 'blue',
    team: 'green',
    org: 'purple',
    ticket: 'amber',
    default: 'default'
  };

  // If no activeTabId is provided, default to first tab
  $: {
    if (!activeTabId && tabs.length > 0) {
      activeTabId = tabs[0].id;
    }
  }

  const dispatch = createEventDispatcher();

  async function handleTabClick(tabId: string) {
    if (activeTabId !== tabId) {
      activeTabId = tabId;
      // Wait for DOM update before dispatching event
      await tick();
      dispatch('tabChange', { tabId });
    }
  }

  function getVariantFromTab(tab: Tab): string {
    // For backward compatibility with entityType
    if ('entityType' in tab) {
      const entityType = tab.entityType as string;
      return mapEntityToVariant[entityType] || 'default';
    }
    return tab.variant || 'default';
  }

  function getTabClasses(tab: Tab, isActive: boolean) {
    const variant = getVariantFromTab(tab);
    const colors = colorVariants[variant] || colorVariants.default;
    
    const sizeClass = size === 'sm' ? 'text-xs py-1 px-3' : 
                      size === 'lg' ? 'text-base py-3 px-6' : 
                      'text-sm py-2 px-5';
    
    // Base classes
    let classes = `focus:outline-none font-medium transition-all duration-200 ease-in-out ${sizeClass}`;
    
    // Custom colors take precedence over variant colors
    const bgColor = tab.customBgColor ? `bg-[${tab.customBgColor}]` : colors.bg;
    const textColor = tab.customTextColor ? `text-[${tab.customTextColor}]` : colors.text;
    const hoverColor = tab.customHoverColor ? `hover:bg-[${tab.customHoverColor}]` : colors.hover;
    const activeColor = tab.customActiveColor ? `bg-[${tab.customActiveColor}]` : colors.active;
    
    if (style === 'pill') {
      classes += ` rounded ${isActive ? activeColor : bgColor} ${textColor} ${!isActive ? hoverColor : ''}`;
    } else if (style === 'traditional') {
      if (isActive) {
        classes += ` bg-white ${textColor} border-t-2 border-l-2 border-r-2 border-b-0 rounded-t-lg relative z-10`;
      } else {
        // Remove the border and border-color tailwind classes, we'll apply them via style
        classes += ` ${bgColor} ${textColor} border-b-0 rounded-t-lg ${hoverColor}`;
      }
    } else if (style === 'full') {
      classes += ` ${isActive ? activeColor : bgColor} ${textColor} ${!isActive ? hoverColor : ''}`;
    }
    
    if (tab.disabled) {
      classes += ' opacity-50 cursor-not-allowed';
    }
    
    return classes;
  }

  function getTabStyle(tab: Tab, isActive: boolean) {
    const variant = getVariantFromTab(tab);
    const colors = colorVariants[variant] || colorVariants.default;
    // Extract color name and shade from Tailwind class
    let colorVar = colors.text.match(/text-(\w+)-(\d+)/);
    let borderColor;
    
    if (tab.customTextColor) {
      borderColor = tab.customTextColor;
    } else if (colorVar && colorVar.length >= 3) {
      borderColor = `var(--${colorVar[1]}-${colorVar[2]})`;
    } else {
      borderColor = 'var(--gray-600)'; // Default fallback
    }
    
    if (style === 'traditional') {
      if (isActive) {
        // For active tab, add more bottom padding to cover the container's top border
        return `border-color: ${borderColor}; border-top-width: 2px; border-left-width: 2px; border-right-width: 2px; border-bottom: 2px solid white; margin-bottom: -2px; position: relative; z-index: 1;`;
      } else {
        // Apply border with the same color but keep original thickness (1px)
        return `border: 1px solid ${borderColor}; border-bottom: 0;`;
      }
    }
    
    return '';
  }

  function getContentContainerStyle() {
    const variant = activeTab ? getVariantFromTab(activeTab) : 'default';
    const colors = colorVariants[variant] || colorVariants.default;
    
    // Extract color name and shade from Tailwind class
    let colorVar = colors.text.match(/text-(\w+)-(\d+)/);
    let borderColor;
    
    if (activeTab?.customTextColor) {
      borderColor = activeTab.customTextColor;
    } else if (colorVar && colorVar.length >= 3) {
      borderColor = `var(--${colorVar[1]}-${colorVar[2]})`;
    } else {
      borderColor = 'var(--gray-600)'; // Default fallback
    }
    
    return `
      margin-left: ${spacing.x/4}rem; 
      margin-right: ${spacing.x/4}rem; 
      margin-bottom: ${spacing.y/4}rem;
      border: 2px solid ${borderColor};
      position: relative;
    `;
  }

  function getContentContainerClass(activeTab: Tab | undefined) {
    if (!activeTab) return 'mt-0';
    
    const variant = getVariantFromTab(activeTab);
    const colors = colorVariants[variant] || colorVariants.default;
    
    if (style === 'traditional') {
      return `p-4 rounded-lg bg-white`;
    }
    
    if (contentBackground) {
      return `mt-4 p-4 rounded-lg ${colors.bg}`;
    }
    
    return `mt-4 rounded-lg p-4`;
  }

  $: activeTab = tabs.find(tab => tab.id === activeTabId);
</script>

<div class="tabs-component w-full">
  <div class="tab-list flex flex-wrap {tabAlignment === 'center' ? 'justify-center' : tabAlignment === 'right' ? 'justify-end' : 'justify-start'}" style="margin-left: {spacing.x/4}rem; margin-right: {spacing.x/4}rem;">
    {#each tabs as tab}
      <button
        type="button"
        class={getTabClasses(tab, tab.id === activeTabId)}
        style={getTabStyle(tab, tab.id === activeTabId)}
        on:click={() => !tab.disabled && handleTabClick(tab.id)}
        role="tab"
        aria-selected={tab.id === activeTabId}
        disabled={tab.disabled}
        aria-controls={`panel-${tab.id}`}
      >
        {#if tab.icon}
          <svelte:component this={tab.icon} class="w-4 h-4 mr-2 inline-block" />
        {/if}
        {tab.title}
      </button>
    {/each}
  </div>
  
  <div class={getContentContainerClass(activeTab)} style={getContentContainerStyle()}>
    <div role="tabpanel" transition:slide={{ duration: 200 }}>
      <slot />
    </div>
  </div>
</div>

<style>
  .tabs-component {
    --transition-duration: 0.2s;
    --blue-600: #2563eb;
    --green-600: #059669;
    --purple-600: #9333ea; 
    --amber-600: #d97706;
    --gray-600: #4b5563;
  }
  
  .tab-list {
    gap: 0.25rem;
    margin-bottom: 0px; /* Match the -2px margin on the active tab */
    position: relative;
    z-index: 10; /* Ensure tabs are above the content container */
  }
  
  /* Tab styles */
  :global(.tabs-component button[role="tab"]) {
    position: relative;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }
</style> 