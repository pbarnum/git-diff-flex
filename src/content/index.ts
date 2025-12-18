/// <reference types="chrome"/>

import { CLASSES, SELECTORS, CacheStore } from '@/types';
import ConfigManager from './ConfigManager';
import { HandleManager } from './HandleManager';
import { DOMUtils } from './DOMUtils';
import './styles.css';

/**
 * Main content script for Git Diff Flex
 */
class GitDiffFlex {
  private configManager: ConfigManager;
  private cache: CacheStore = {};

  constructor() {
    this.configManager = new ConfigManager();
    this.configManager.onChange(() => this.configManager.applyOptions());
    this.initialize();
  }

  private initialize(): void {
    const observer = new MutationObserver(() => {
      const files = document.querySelectorAll<HTMLElement>(
        `${SELECTORS.legacyFile},${SELECTORS.file}`
      );
      if (files.length > 0) {
        this.findTables();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Find all diff tables that have not been initialized
   */
  private findTables(): void {
    const files = document.querySelectorAll<HTMLElement>(
      `${SELECTORS.legacyFile},${SELECTORS.file}`
    );

    files.forEach((file) => {
      const table = file.querySelector<HTMLElement>(
        `${SELECTORS.table}:not(.${CLASSES.table})`
      );
      if (!table) return;

      const handleManager = new HandleManager(file, table, this.configManager);
      handleManager.setCache(this.cache);

      const handle = handleManager.createHandle();
      const btn = this.generateToggleButton(file, table, handle, handleManager);

      // Restore cached column width if it exists
      const cached = this.cache[file.id];
      if (cached?.splitWidth) {
        DOMUtils.updateSplitWidth(table, cached.splitWidth);
      }

      // Customize the table element
      table.classList.add(CLASSES.table);
      if (!this.configManager.isWordWrapEnabled()) {
        table.classList.add(CLASSES.clipped);
      }
      table.addEventListener('mouseenter', () =>
        handleManager.calculateHandlePosition(handle)
      );

      // Observe the table's resize events
      const ro = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          handleManager.calculateHandlePosition(handle);
        });
      });
      ro.observe(table);

      // Wait for layout to complete before restoring cached position
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const cached = this.cache[file.id];
          if (cached?.handle?.position) {
            const { height, left, top } = cached.handle.position;
            if (height && left !== undefined && top !== undefined) {
              handle.style.height = `${height}px`;
              handle.style.left = `${left}px`;
              handle.style.top = `${top}px`;
            }
          } else {
            handleManager.calculateHandlePosition(handle);
          }
        });
      });

      // Remove drag class on mouse up
      file.addEventListener('mouseup', () => {
        handle.classList.remove(CLASSES.drag);
      });

      // Handle mouse move for dragging
      file.addEventListener('mousemove', (e) => {
        handleManager.handleMouseMove(e, handle, btn);
      });

      this.cache = handleManager.getCache();
    });
  }

  /**
   * Generate toggle button for the file header
   */
  private generateToggleButton(
    file: HTMLElement,
    table: HTMLElement,
    handle: HTMLElement,
    handleManager: HandleManager
  ): HTMLButtonElement {
    file.querySelector(`.${CLASSES.toggleButton}`)?.remove();

    const header = file.querySelector<HTMLElement>(
      `${SELECTORS.fileHeader},${SELECTORS.legacyFileHeader}`
    );
    const btn = document.createElement('button');
    btn.innerText = 'Split';
    btn.classList.add(
      'btn',
      'btn-sm',
      'btn-primary',
      CLASSES.toggleButton,
      CLASSES.toggleSplit
    );
    btn.addEventListener('click', () => {
      handleManager.toggleTableView(handle, btn);
    });

    const div = document.createElement('div');
    div.append(btn);
    div.classList.add('flex-shrink-0');
    if (header) {
      header.append(div);
    }

    if (!this.configManager.isToggleButtonsEnabled()) {
      btn.classList.add(CLASSES.hidden);
    }

    // Restore cached button state if it exists
    const cached = this.cache[file.id];
    if (cached?.buttonState) {
      if (cached.buttonState === CLASSES.toggleAdditions) {
        btn.innerText = 'Additions';
        btn.classList.remove(CLASSES.toggleSplit, CLASSES.toggleDeletions);
        btn.classList.add(CLASSES.toggleAdditions);
      } else if (cached.buttonState === CLASSES.toggleDeletions) {
        btn.innerText = 'Deletions';
        btn.classList.remove(CLASSES.toggleSplit, CLASSES.toggleAdditions);
        btn.classList.add(CLASSES.toggleDeletions);
      } else {
        btn.innerText = 'Split';
        btn.classList.remove(CLASSES.toggleAdditions, CLASSES.toggleDeletions);
        btn.classList.add(CLASSES.toggleSplit);
      }
    }

    return btn;
  }
}

// Initialize the extension
new GitDiffFlex();
