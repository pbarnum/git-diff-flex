export interface Config {
  toggleButtons: boolean;
  wordWrap: boolean;
}

export interface FileCache {
  splitWidth?: number;
  buttonState?: string;
  handle?: {
    position?: {
      height: number;
      left: number;
      top: number;
    };
  };
}

export interface CacheStore {
  [fileId: string]: FileCache;
}

export enum ButtonState {
  Split = 'gdf-btn-toggle-split',
  Additions = 'gdf-btn-toggle-add',
  Deletions = 'gdf-btn-toggle-del',
}

export const CLASSES = {
  handle: 'gdf-handle',
  hidden: 'gdf-hidden',
  file: 'gdf-file',
  table: 'gdf-table',
  clipped: 'gdf-table-clipped',
  drag: 'gdf-drag',
  toggleButton: 'gdf-btn-toggle',
  toggleSplit: 'gdf-btn-toggle-split',
  toggleAdditions: 'gdf-btn-toggle-add',
  toggleDeletions: 'gdf-btn-toggle-del',
} as const;

export const SELECTORS = {
  legacyFile: '.file',
  legacyFileHeader: '.file-info',
  file: 'div[role="region"]',
  table: 'table',
  fileHeader: 'div[class*=diff-file-header] > div:last-child',
  delLine: 'colgroup > col:nth-child(1)',
  delCode: 'colgroup > col:nth-child(2)',
  addLine: 'colgroup > col:nth-child(3)',
  addCode: 'colgroup > col:nth-child(4)',
} as const;
