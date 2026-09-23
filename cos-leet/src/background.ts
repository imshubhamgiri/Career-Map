console.log('[Career OS] LeetCode sync background service worker started.');

/**
 * Intercept LeetCode submissions by listening to chrome.webRequest.onCompleted
 * targeting URLs matching *://leetcode.com/problems/<question-slug>/submit/
 */
chrome.webRequest.onCompleted.addListener(
  (details) => {
    // Only intercept POST/submission requests
    if (details.method && details.method !== 'POST') {
      return;
    }

    const match = details.url.match(/\/problems\/([^/]+)\/submit\/?/);
    if (!match) {
      return;
    }

    const questionSlug = match[1];
    console.log(`[Career OS] Detected submission for "${questionSlug}". Waiting 5 seconds for judge evaluation...`);

    // Wait 5 seconds to allow LeetCode's judge to finish evaluating
    setTimeout(async () => {
      try {
        const messagePayload = {
          type: 'get-submission',
          questionSlug,
        };

        if (details.tabId && details.tabId >= 0) {
          chrome.tabs.sendMessage(details.tabId, messagePayload).catch((err) => {
            console.warn(
              `[Career OS] Could not send message to tab ${details.tabId}:`,
              err
            );
          });
        } else {
          // Fallback to current active tab if tabId is unavailable
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, messagePayload).catch((err) => {
              console.warn('[Career OS] Could not send message to active tab:', err);
            });
          }
        }
      } catch (err) {
        console.error('[Career OS] Error dispatching get-submission to content script:', err);
      }
    }, 5000);
  },
  {
    urls: [
      '*://leetcode.com/problems/*/submit/',
      '*://leetcode.com/problems/*/submit/*',
    ],
  }
);
