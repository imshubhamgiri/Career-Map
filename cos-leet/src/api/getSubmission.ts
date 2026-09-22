import {
  LeetCodeSubmissionDetailsRaw,
  LeetCodeSubmissionDetailsResponse,
  LeetCodeSubmissionItem,
  LeetCodeSubmissionListResponse,
} from '../types/Submission';
import { SUBMISSION_DETAILS_QUERY, SUBMISSION_LIST_QUERY } from './submission.query';

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

/**
 * Generic GraphQL runner targeting LeetCode with credentials: 'include'
 * to preserve the user's active session cookies.
 */
export async function executeLeetCodeGraphQL<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `LeetCode GraphQL request failed with status: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    const errorMsg = result.errors.map((e: { message: string }) => e.message).join('; ');
    throw new Error(`LeetCode GraphQL error: ${errorMsg}`);
  }

  return result as T;
}

/**
 * Fetches recent submissions for a specific problem slug.
 */
export async function getSubmissionList(
  questionSlug: string,
  limit: number = 5
): Promise<LeetCodeSubmissionItem[]> {
  const response = await executeLeetCodeGraphQL<LeetCodeSubmissionListResponse>(
    SUBMISSION_LIST_QUERY,
    {
      questionSlug,
      offset: 0,
      limit,
    }
  );

  return response.data?.submissionList?.submissions || [];
}

/**
 * Fetches comprehensive submission details including code, runtime, memory and question details.
 */
export async function getSubmissionDetails(
  submissionId: number
): Promise<LeetCodeSubmissionDetailsRaw> {
  const response = await executeLeetCodeGraphQL<LeetCodeSubmissionDetailsResponse>(
    SUBMISSION_DETAILS_QUERY,
    {
      submissionId,
    }
  );

  if (!response.data?.submissionDetails) {
    throw new Error(`Submission details not found for submission ID: ${submissionId}`);
  }

  return response.data.submissionDetails;
}

