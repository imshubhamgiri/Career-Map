import { getSubmissionDetails, getSubmissionList } from '../api/getSubmission';
import { SubmissionPayload } from '../types/Submission';

export class LeetCodeHandler {
  /**
   * Orchestrates fetching the latest submission for a problem slug and parses it into a clean submission object.
   */
  public static async getSubmission(questionSlug: string): Promise<SubmissionPayload | null> {
    try {
      const submissions = await getSubmissionList(questionSlug, 5);
      if (!submissions || submissions.length === 0) {
        console.warn(`[Career OS] No submissions found for question slug: ${questionSlug}`);
        return null;
      }

      // Latest submission is the first item in the list
      const latest = submissions[0];
      const submissionId = parseInt(latest.id, 10);

      if (isNaN(submissionId)) {
        console.warn(`[Career OS] Received invalid submission ID: ${latest.id}`);
        return null;
      }

      // Fetch comprehensive details for the submission
      const details = await getSubmissionDetails(submissionId);

      const titleSlug = details.question?.titleSlug || questionSlug;
      const questionTitle = details.question?.title || latest.title || questionSlug;
      const code = details.code || '';
      const language = details.lang?.verboseName || details.lang?.name || latest.lang || 'Unknown';
      const status = details.statusDisplay || latest.statusDisplay || 'Unknown';
      const runtime =
        details.runtimeDisplay ||
        (details.runtime != null ? `${details.runtime} ms` : latest.runtime || 'N/A');
      const memory =
        details.memoryDisplay ||
        (details.memory != null ? `${details.memory} MB` : latest.memory || 'N/A');

      let timestamp = details.timestamp;
      if (!timestamp && latest.timestamp) {
        timestamp =
          typeof latest.timestamp === 'string'
            ? parseInt(latest.timestamp, 10)
            : latest.timestamp;
      }
      if (!timestamp) {
        timestamp = Math.floor(Date.now() / 1000);
      }

      const payload: SubmissionPayload = {
        titleSlug,
        questionTitle,
        code,
        language,
        status,
        runtime,
        memory,
        timestamp,
      };

      return payload;
    } catch (error) {
      console.error(`[Career OS] Error fetching submission for ${questionSlug}:`, error);
      throw error;
    }
  }
}
