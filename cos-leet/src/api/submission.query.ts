export const SUBMISSION_LIST_QUERY = `
  query submissionList($questionSlug: String!, $offset: Int!, $limit: Int!) {
    submissionList(questionSlug: $questionSlug, offset: $offset, limit: $limit) {
      submissions {
        id
        statusDisplay
        lang
        runtime
        timestamp
        url
        isPending
        title
        memory
      }
      hasNext
    }
  }
`;

export const SUBMISSION_DETAILS_QUERY = `
  query submissionDetails($submissionId: Int!) {
    submissionDetails(submissionId: $submissionId) {
      runtime
      runtimeDisplay
      runtimePercentile
      memory
      memoryDisplay
      memoryPercentile
      code
      timestamp
      statusCode
      statusDisplay
      lang {
        name
        verboseName
      }
      question {
        questionId
        title
        titleSlug
        difficulty
      }
      notes
    }
  }
`;

