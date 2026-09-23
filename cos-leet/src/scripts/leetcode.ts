import { ApiHandler } from '../handlers/ApiHandler';
import { LeetCodeHandler } from '../handlers/LeetCodeHandler';

console.log('[Career OS] LeetCode content script initialized.');

// Guard against repeated listener bindings in case of multiple injection
if (!(window as unknown as { __COS_LEET_CONTENT_LOADED__?: boolean }).__COS_LEET_CONTENT_LOADED__) {
  (window as unknown as { __COS_LEET_CONTENT_LOADED__?: boolean }).__COS_LEET_CONTENT_LOADED__ = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'get-submission') {
      const questionSlug = message.questionSlug;
      console.log(`[Career OS] Received get-submission signal for slug: "${questionSlug}"`);

      // Process asynchronously
      (async () => {
        try {
          const submission = await LeetCodeHandler.getSubmission(questionSlug);

          if (!submission) {
            console.warn(`[Career OS] No recent submission found for "${questionSlug}".`);
            sendResponse({ success: false, reason: 'submission_not_found' });
            return;
          }

          // 1. Verify status is ACCEPTED
          const normalizedStatus = (submission.status || '').toUpperCase();
          if (normalizedStatus !== 'ACCEPTED') {
            console.log(
              `[Career OS] Submission verdict is "${submission.status}" (not ACCEPTED). Skipping sync.`
            );
            sendResponse({ success: false, reason: 'not_accepted', status: submission.status });
            return;
          }

          // 2. Verify submission occurred within the last 60 seconds
          const submissionTimeMs =
            submission.timestamp > 1e11
              ? submission.timestamp
              : submission.timestamp * 1000;
          const currentTimeMs = Date.now();
          const ageInSeconds = Math.round(Math.abs(currentTimeMs - submissionTimeMs) / 1000);

          if (ageInSeconds > 60) {
            console.warn(
              `[Career OS] Submission is ${ageInSeconds}s old (exceeds 60-second limit). Skipping sync.`
            );
            sendResponse({ success: false, reason: 'submission_expired', ageInSeconds });
            return;
          }

          console.log(
            `[Career OS] Validated ACCEPTED submission for "${submission.questionTitle}" (${ageInSeconds}s ago). Forwarding to backend...`
          );

          // 3. Dispatch to backend API
          const response = await ApiHandler.submit(submission);
          if (response.success) {
            console.log(
              `[Career OS] Successfully synchronized submission "${submission.questionTitle}" to backend!`
            );
          } else {
            console.error(
              `[Career OS] Backend sync failed for "${submission.questionTitle}":`,
              response.error
            );
          }

          sendResponse(response);
        } catch (error) {
          console.error('[Career OS] Error handling submission in content script:', error);
          sendResponse({ success: false, error: String(error) });
        }
      })();

      return true; // Keep message channel open for asynchronous response
    }

    return false;
  });
}
