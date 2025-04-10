<script lang="ts">
  import { Badge } from "flowbite-svelte";
  import { 
    EditOutline, 
    ClipboardCheckOutline, 
    TableRowOutline,
    FileLinesSolid,
    CogOutline
  } from "flowbite-svelte-icons";
  import { formatDurationHumanReadable } from "$lib/dateUtils";

  // Define test interface
  interface TestData {
    test_id: string;
    test_name: string;
    is_team: boolean;
    division?: string;
    opening_time?: string;
    length: number;
    buffer_time: number;
    date?: string;
    time?: string;
    amPm?: string;
    status?: string;
    countdown?: string;
    disabled?: boolean;
    instructions?: string;
    visible?: boolean;
    test_mode?: string;
  }

  // Props
  let { test, isHostView = true, onOpenClick, onInstructionsClick, onSettingsClick } = $props<{
    test: TestData;
    isHostView?: boolean;
    onOpenClick: (e?: Event) => void;
    onInstructionsClick: () => void;
    onSettingsClick?: () => void;
  }>();
</script>

<div class="card">
  <div class="card-header">
    <h4 class="card-title">
      {test.test_name}
      {#if isHostView && test.visible === false}
        <span class="hidden-indicator">(Hidden)</span>
      {/if}
    </h4>
    <div class="badges-container">
      <div class="badges">
        <Badge color="blue">{test.is_team ? "Team" : "Individual"}</Badge>
        {#if test.division}
          <Badge color="green">{test.division}</Badge>
        {/if}
        {#if isHostView && test.visible === false}
          <Badge color="red">Hidden</Badge>
        {/if}
        {#if isHostView && test.visible === true}
          <Badge color="green">Visible</Badge>
        {/if}
        {#if isHostView && test.test_mode}
          <Badge color="purple">{test.test_mode}</Badge>
        {/if}
      </div>
    </div>
  </div>
  
  <div class="card-content">
    {#if test.status == "Not Open" && test.opening_time}
      <div class="info-row">
        <span class="info-label">Start Time:</span>
        <span class="info-value">
          {new Date(test.opening_time).toLocaleString([], {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    {/if}
    
    <div class="info-row">
      <span class="info-label">Duration:</span>
      <span class="info-value">{formatDurationHumanReadable(test.length)}</span>
    </div>
    
    {#if isHostView}
      <div class="info-row">
        <span class="info-label">Buffer:</span>
        <span class="info-value">{formatDurationHumanReadable(test.buffer_time)}</span>
      </div>
    {/if}
    
    {#if test.countdown}
      <div class="countdown">
        {test.countdown}
      </div>
    {/if}
  </div>
  
  <div class="card-footer">
    {#if isHostView}
      <!-- Host view buttons -->
      <div class="action-buttons host-actions">
        <div class="left-buttons">
          <div class="tooltip-container">
            <button class="test-button empty" onclick={onSettingsClick}>
                <CogOutline class="w-5 h-5 icon" />
            </button>
            <span class="tooltip">Settings</span>
          </div>
          <div class="tooltip-container">
            <a href="./tests/{test.test_id}">
              <button class="test-button empty">
                <EditOutline class="w-5 h-5 icon" />
              </button>
              <span class="tooltip">Edit Test</span>
            </a>
          </div>
          
          <div class="tooltip-container">
            <a href="./tests/{test.test_id}/grade">
              <button class="test-button empty">
                <ClipboardCheckOutline class="w-5 h-5 icon" />
              </button>
              <span class="tooltip">Grade Test</span>
            </a>
          </div>
          
          <div class="tooltip-container">
            <a href="./tests/{test.test_id}/results">
              <button class="test-button empty">
                <TableRowOutline class="w-5 h-5 icon" />
              </button>
              <span class="tooltip">Results</span>
            </a>
          </div>
          
          
        </div>
        
        <div class="right-buttons">
          <button
            class="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
            onclick={onOpenClick}
          >
            Open
          </button>
        </div>
      </div>
    {:else}
      <!-- Student view buttons -->
      <div class="action-buttons host-actions">
        <div class="left-buttons">
          {#if test.instructions !== undefined && test.instructions !== "" && test.instructions !== null}
            <div class="tooltip-container">
              <button class="test-button empty" onclick={onInstructionsClick} disabled={!test.instructions}>
                <FileLinesSolid class="w-5 h-5 icon" />
              </button>
              <span class="tooltip">
                {#if test.instructions}View Instructions{:else}No Instructions{/if}
              </span>
            </div>
          {/if}
        </div>
        
        <div class="right-buttons">
          <button
            class="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
            disabled={test.disabled}
            onclick={onOpenClick}
          >
            {test.status}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);
    overflow: visible;
    transition: transform 0.2s, box-shadow 0.2s;
    height: 100%;
    position: relative;
  }
  
  .card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  .card-header {
    padding: 1.25rem 1.25rem 0.75rem;
    border-bottom: 1px solid #f0f0f0;
    overflow: hidden;
  }
  
  .card-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.75rem;
    text-align: center;
  }
  
  .badges-container {
    display: flex;
    justify-content: center;
    width: 100%;
  }
  
  .badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .card-content {
    padding: 1rem 1.25rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    overflow: hidden;
  }
  
  .info-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-align: left;
    justify-content: flex-start;
  }
  
  .info-label {
    font-weight: 500;
    color: #555;
    min-width: 6rem;
    text-align: left;
  }
  
  .info-value {
    color: #333;
    text-align: left;
  }
  
  .countdown {
    margin-top: 0.5rem;
    font-weight: 600;
    color: var(--primary, #3f9656);
    padding: 0.5rem;
    background-color: #f8f9fa;
    border-radius: 0.5rem;
    text-align: center;
  }
  
  .card-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid #f0f0f0;
    background-color: #fafafa;
    position: relative;
    overflow: visible;
    border-bottom-left-radius: 0.75rem;
    border-bottom-right-radius: 0.75rem;
  }
  
  .action-buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    overflow: visible;
    position: relative;
    z-index: 10;
  }
  
  .host-actions {
    justify-content: space-between;
  }
  
  .left-buttons {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .right-buttons {
    display: flex;
    align-items: center;
  }
  
  .test-button {
    border-radius: 10px;
    border: 1px solid var(--primary-light, #a7f0ba);
    transition: transform 0.2s, border 0.2s, background-color 0.2s;
  }

  .full {
    background-color: var(--primary-light, #a7f0ba);
    padding: 0.75rem 1.25rem;
    font-weight: 500;
  }

  .empty {
    padding: 0.6rem;
    color: var(--primary, #3f9656);
    background-color: white;
  }

  button:disabled,
  button[disabled] {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .test-button:not([disabled]):hover {
    transform: scale(1.05);
    cursor: pointer;
  }

  .full:not([disabled]):hover {
    border: 2px solid var(--primary-dark, #3f9656);
    background-color: var(--primary-light, #a7f0ba);
  }

  .empty:not([disabled]):hover {
    border: 2px solid var(--primary, #3f9656);
    background-color: #f8f9fa;
  }
  
  .tooltip-container {
    position: relative;
    display: inline-block;
  }
  
  .tooltip {
    visibility: hidden;
    background-color: #333;
    color: white;
    text-align: center;
    padding: 5px 10px;
    border-radius: 6px;
    position: absolute;
    z-index: 9999;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.3s;
    white-space: nowrap;
    font-size: 0.875rem;
    pointer-events: none;
    width: auto;
    min-width: max-content;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  /* Arrow for tooltip */
  .tooltip::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
  
  .tooltip-container:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
  
  .icon {
    color: inherit;
  }
  
  .hidden-indicator {
    font-size: 0.8rem;
    color: #e74c3c;
    font-weight: normal;
  }
</style> 