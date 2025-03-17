<script lang="ts">
  import { InfoCircleSolid } from 'flowbite-svelte-icons';
  
  type VariantType = 'info' | 'success' | 'warning' | 'error';
  type AlignmentType = 'left' | 'center' | 'right';
  
  let { 
    message = '',
    variant = 'info' as VariantType,
    alignment = 'center' as AlignmentType,
    class: className = '' 
  } = $props();
  
  // Style map for different alert variants
  const variantStyles = {
    info: {
      background: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: '#2563eb'
    },
    success: {
      background: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#059669'
    },
    warning: {
      background: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#d97706'
    },
    error: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#dc2626'
    }
  };
  
  // Get the right style based on variant
  const style = variantStyles[variant as keyof typeof variantStyles] || variantStyles.info;
</script>

<div 
  class="alert {className}" 
  style="background-color: {style.background}; border-color: {style.border}; color: {style.text};"
>
  <div class="alert-container {alignment}-aligned">
    {#if alignment !== 'right'}
      <div class="alert-icon">
        <InfoCircleSolid class="w-5 h-5" />
      </div>
    {/if}
    
    <div class="alert-content">
      {#if message}
        <span>{message}</span>
      {:else}
        <slot></slot>
      {/if}
    </div>
    
    {#if alignment === 'right'}
      <div class="alert-icon">
        <InfoCircleSolid class="w-5 h-5" />
      </div>
    {/if}
  </div>
</div>

<style>
  .alert {
    display: flex;
    padding: 0.75rem 1rem;
    border-width: 1px;
    border-style: solid;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    width: 100%;
    margin-top: 1.5rem;
  }
  
  .alert-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }
  
  .left-aligned {
    justify-content: flex-start;
  }
  
  .center-aligned {
    justify-content: center;
  }
  
  .right-aligned {
    justify-content: flex-end;
  }
  
  .alert-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .alert-content {
    display: flex;
    align-items: center;
  }
</style> 