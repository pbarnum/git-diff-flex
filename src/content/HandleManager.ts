/// <reference types="chrome"/>

import { CLASSES, SELECTORS, CacheStore, ButtonState } from '@/types';
import { DOMUtils } from './DOMUtils';

/**
 * Handle manager for draggable split view
 */
export class HandleManager {
  private cache: CacheStore = {};

  constructor(
    private file: HTMLElement,
    private table: HTMLElement,
    private configManager: { isToggleButtonsEnabled: () => boolean }
  ) { }

  /**
   * Create the handle singleton and append it to the DOM
   */
  createHandle(): HTMLElement {
    this.file.querySelector(`.${CLASSES.handle}`)?.remove();

    const fileId = this.file.id;
    if (!this.cache[fileId]) this.cache[fileId] = {};
    if (!this.cache[fileId].handle) this.cache[fileId].handle = { position: undefined };

    const handle = document.createElement('div');
    handle.classList.add(CLASSES.handle);

    handle.onmousedown = (e: MouseEvent) => {
      e.preventDefault();
      handle.classList.add(CLASSES.drag);
      const btn = this.file.querySelector<HTMLButtonElement>(
        `.${CLASSES.toggleButton}`
      );
      if (btn) {
        this.toggleButtonSplit(btn);
      }
    };

    handle.onmouseup = () => {
      handle.classList.remove(CLASSES.drag);
    };

    this.file.appendChild(handle);
    return handle;
  }

  /**
   * Calculate the handle's position, relative to the table's center column
   */
  calculateHandlePosition(handle: HTMLElement): void {
    const bodyRect = this.file.getBoundingClientRect();
    const tableRect = this.table.getBoundingClientRect();
    const top = tableRect.top - bodyRect.top;
    const centerRect = DOMUtils.getAdditionNumberColumn(this.table);

    const fileId = this.file.id;
    if (!this.cache[fileId].handle) this.cache[fileId].handle = {};

    this.cache[fileId].handle!.position = {
      height: tableRect.height,
      left: centerRect.left - tableRect.left - 1,
      top: top,
    };

    handle.style.height = `${tableRect.height}px`;
    handle.style.left = `${centerRect.left - tableRect.left - 1}px`;
    handle.style.top = `${top}px`;
  }

  /**
   * Handle mouse move event for dragging
   */
  handleMouseMove(e: MouseEvent, handle: HTMLElement, btn: HTMLButtonElement): void {
    if (!handle.classList.contains(CLASSES.drag)) return;

    const tableRect = this.table.getBoundingClientRect();
    const numColDelRect = DOMUtils.getDeletionNumberColumn(this.table);
    const addNumColRect = DOMUtils.getAdditionNumberColumn(this.table);
    const capLeft = numColDelRect.right;
    const capRight = tableRect.right - addNumColRect.width;

    let width = 0;
    let handleLeft = 0;

    if (e.clientX >= capRight) {
      handleLeft = capRight - tableRect.left;
      width = capRight - numColDelRect.right;
      this.toggleButtonDeletions(btn);
    } else if (e.clientX <= capLeft) {
      handleLeft = capLeft - tableRect.left;
      width = capLeft - numColDelRect.right;
      this.toggleButtonAdditions(btn);
    } else {
      handleLeft = e.clientX - tableRect.left;
      width = e.clientX - numColDelRect.right;
      this.toggleButtonSplit(btn);
    }

    DOMUtils.updateSplitWidth(this.table, width);
    handle.style.left = `${handleLeft}px`;
    this.cache[this.file.id].splitWidth = width;

    this.calculateHandlePosition(handle);
  }

  /**
   * Toggle table view based on button state
   */
  toggleTableView(handle: HTMLElement, btn: HTMLButtonElement): void {
    const tableRect = this.table.getBoundingClientRect();
    const numColDelRect = DOMUtils.getDeletionNumberColumn(this.table);
    const addNumColRect = DOMUtils.getAdditionNumberColumn(this.table);
    const capLeft = numColDelRect.right;
    const capRight = tableRect.right - addNumColRect.width;

    let handleLeft = 0;
    let width = 0;

    if (btn.classList.contains(CLASSES.toggleSplit)) {
      handleLeft = capLeft - tableRect.left;
      width = capLeft - numColDelRect.right + 1;
      this.toggleButtonAdditions(btn);
    } else if (btn.classList.contains(CLASSES.toggleAdditions)) {
      handleLeft = capRight - tableRect.left;
      width = capRight - numColDelRect.right + 1;
      this.toggleButtonDeletions(btn);
    } else if (btn.classList.contains(CLASSES.toggleDeletions)) {
      handleLeft = tableRect.width / 2;
      width = tableRect.width / 2 - numColDelRect.width;
      this.toggleButtonSplit(btn);
    }

    handle.style.left = `${handleLeft}px`;
    DOMUtils.updateSplitWidth(this.table, width);

    if (this.cache[this.file.id]) {
      this.cache[this.file.id].splitWidth = width;
    }
  }

  /**
   * Sets the toggle button to "split" view
   */
  private toggleButtonSplit(btn: HTMLButtonElement): void {
    btn.innerText = 'Split';
    btn.classList.remove(CLASSES.toggleAdditions, CLASSES.toggleDeletions);
    btn.classList.add(CLASSES.toggleSplit);

    if (this.cache[this.file.id]) {
      this.cache[this.file.id].buttonState = CLASSES.toggleSplit;
    }
  }

  /**
   * Sets the toggle button to "additions" view
   */
  private toggleButtonAdditions(btn: HTMLButtonElement): void {
    btn.innerText = 'Additions';
    btn.classList.remove(CLASSES.toggleSplit, CLASSES.toggleDeletions);
    btn.classList.add(CLASSES.toggleAdditions);

    if (this.cache[this.file.id]) {
      this.cache[this.file.id].buttonState = CLASSES.toggleAdditions;
    }
  }

  /**
   * Sets the toggle button to "deletions" view
   */
  private toggleButtonDeletions(btn: HTMLButtonElement): void {
    btn.innerText = 'Deletions';
    btn.classList.remove(CLASSES.toggleSplit, CLASSES.toggleAdditions);
    btn.classList.add(CLASSES.toggleDeletions);

    if (this.cache[this.file.id]) {
      this.cache[this.file.id].buttonState = CLASSES.toggleDeletions;
    }
  }

  public getCache(): CacheStore {
    return this.cache;
  }

  public setCache(cache: CacheStore): void {
    this.cache = cache;
  }
}
