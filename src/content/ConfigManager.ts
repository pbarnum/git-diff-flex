/// <reference types="chrome"/>

import { Config, CLASSES } from '@/types';

/**
 * Configuration manager for the extension
 */
class ConfigManager {
  private config: Config = { toggleButtons: true, wordWrap: true };
  private listeners: Array<() => void> = [];

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const items = await chrome.storage.sync.get() as Partial<Config>;
    Object.assign(this.config, items);
    this.notifyListeners();

    chrome.storage.onChanged.addListener((changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'sync') {
        if (changes.toggleButtons) {
          this.config.toggleButtons = changes.toggleButtons.newValue;
        }
        if (changes.wordWrap) {
          this.config.wordWrap = changes.wordWrap.newValue;
        }
        this.notifyListeners();
      }
    });
  }

  public isToggleButtonsEnabled(): boolean {
    return this.config.toggleButtons;
  }

  public isWordWrapEnabled(): boolean {
    return this.config.wordWrap;
  }

  public onChange(callback: () => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback());
  }

  public applyOptions(): void {
    // Apply toggle button visibility
    const buttons = document.querySelectorAll<HTMLElement>(
      `.${CLASSES.toggleButton}`
    );
    buttons.forEach((button) => {
      if (this.isToggleButtonsEnabled()) {
        button.classList.remove(CLASSES.hidden);
      } else {
        button.classList.add(CLASSES.hidden);
      }
    });

    // Apply word wrap settings
    const tables = document.querySelectorAll<HTMLElement>(`.${CLASSES.table}`);
    tables.forEach((table) => {
      if (!this.isWordWrapEnabled()) {
        table.classList.add(CLASSES.clipped);
      } else {
        table.classList.remove(CLASSES.clipped);
      }
    });
  }
}

export default ConfigManager;
