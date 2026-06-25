/**
 * Background service worker for Git Diff Flex extension
 */

const DIFF_PATH = /\/pull\/\d+|\/commit\/|\/compare\//;

function isGitHubDiffUrl(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    if (!hostname.endsWith('github.com')) return false;
    return DIFF_PATH.test(pathname);
  } catch {
    return false;
  }
}

async function injectContentScript(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content.css'],
    });
  } catch {
    // Tab may not be ready, or script already present
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
              hostContains: 'github.com',
              pathSuffix: '/files',
            },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowAction()],
      },
    ]);
  });
});

// GitHub SPA navigation does not re-run manifest content_scripts; inject on route change.
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId === 0 && isGitHubDiffUrl(details.url)) {
    injectContentScript(details.tabId);
  }
});
