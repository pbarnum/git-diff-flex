import { SELECTORS } from '@/types';

export interface ColumnRect {
  left: number;
  right: number;
  width: number;
}

/**
 * Utility functions for DOM manipulation and calculations
 */
export class DOMUtils {
  /**
   * Updates the width for the "deletion" table column
   */
  static updateSplitWidth(table: HTMLElement, val: number): void {
    const delCode = table.querySelector<HTMLElement>(SELECTORS.delCode);
    if (delCode) {
      delCode.style.width = `${val}px`;
    }
  }

  /**
   * Determines the "deletion" number column dimensions depending on the type of diff
   */
  static getDeletionNumberColumn(table: HTMLElement): ColumnRect {
    const delNumCol = table.querySelector<HTMLElement>(SELECTORS.delLine);
    if (delNumCol) {
      const rect = delNumCol.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
      };
    }

    const rect: ColumnRect = {
      left: 0,
      right: 0,
      width: 0,
    };

    const tableRect = table.getBoundingClientRect();
    const addNumCol = table.querySelector<HTMLElement>(SELECTORS.addLine);
    if (addNumCol) {
      const colRect = addNumCol.getBoundingClientRect();
      rect.left = tableRect.left;
      rect.right = tableRect.left + colRect.width;
      rect.width = colRect.width;
    } else {
      rect.left = tableRect.left;
      rect.right = tableRect.left + 66;
      rect.width = 66;
    }

    return rect;
  }

  /**
   * Determines the addition column dimensions depending on the type of diff
   */
  static getAdditionNumberColumn(table: HTMLElement): ColumnRect {
    const addNumCol = table.querySelector<HTMLElement>(SELECTORS.addLine);
    if (addNumCol) {
      const rect = addNumCol.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
      };
    }

    const rect: ColumnRect = {
      left: 0,
      right: 0,
      width: 0,
    };

    const tableRect = table.getBoundingClientRect();
    const delNumCol = table.querySelector<HTMLElement>(SELECTORS.delLine);
    if (delNumCol) {
      const colRect = delNumCol.getBoundingClientRect();
      const delCode = table.querySelector<HTMLElement>(SELECTORS.delCode);
      if (delCode) {
        rect.left = delCode.getBoundingClientRect().right;
        rect.right = rect.left + colRect.width;
        rect.width = colRect.width;
      }
    } else {
      rect.left = tableRect.left;
      rect.right = tableRect.left + 66;
      rect.width = 66;
    }

    return rect;
  }
}
