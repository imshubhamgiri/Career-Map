import { SubmissionPayload } from '../types/Submission';

const BACKEND_SUBMISSIONS_URL = 'http://localhost:3000/api/v1/submissions';
const API_KEY_STORAGE_KEY = 'apiKey';

export interface SubmitResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export class ApiHandler {
  /**
   * Reads the stored user apiKey from chrome.storage.sync
   */
  public static async getApiKey(): Promise<string | null> {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
        const fallback = typeof window !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE_KEY) : null;
        resolve(fallback);
        return;
      }

      chrome.storage.sync.get([API_KEY_STORAGE_KEY], (result) => {
        const storedKey = result[API_KEY_STORAGE_KEY];
        resolve(typeof storedKey === 'string' && storedKey.length > 0 ? storedKey : null);
      });
    });
  }

  /**
   * Persists the user's apiKey to chrome.storage.sync
   */
  public static async setApiKey(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
        if (typeof window !== 'undefined') {
          if (apiKey) {
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
          } else {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
          }
        }
        resolve();
        return;
      }

      chrome.storage.sync.set({ [API_KEY_STORAGE_KEY]: apiKey }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Reads stored apiKey and executes a POST request to custom backend API endpoint
   */
  public static async submit(submission: SubmissionPayload): Promise<SubmitResponse> {
    const apiKey = await this.getApiKey();

    if (!apiKey) {
      const errorMsg = 'API key not configured. Please set your API key in the extension popup.';
      console.warn(`[Career OS] ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }

    try {
      console.log(`[Career OS] Forwarding submission for "${submission.titleSlug}" to ${BACKEND_SUBMISSIONS_URL}...`);

      const response = await fetch(BACKEND_SUBMISSIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const errorMsg = `Server responded with ${response.status} ${response.statusText}${
          errorText ? `: ${errorText}` : ''
        }`;
        console.error(`[Career OS] Backend submission failed: ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
        };
      }

      const responseData = await response.json().catch(() => ({}));
      console.log('[Career OS] Submission successfully synced to backend:', responseData);

      return {
        success: true,
        data: responseData,
      };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Unknown network error occurred while submitting.';
      console.error('[Career OS] Network error during submission sync:', errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}
