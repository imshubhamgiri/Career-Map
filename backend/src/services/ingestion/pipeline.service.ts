import { chunkNormalizedText } from './chunker.service';
import { parseChunkWithLLM } from './llmParser.service';
import { ExtractedQuestion, PipelineResult } from '../../types';
import { logger } from '../../utils/logger';

const log = logger.child({ service: 'IngestionPipeline' });

export async function processDocumentPipeline(
  rawLines: string[],
  concurrency = 2
): Promise<PipelineResult> {
  // Use a chunk size of 15 with 2-line overlap to avoid output token truncation in LLM responses
  const chunks = chunkNormalizedText(rawLines, 15, 2);

  const results = [];

  log.info(
    { totalLines: rawLines.length, totalChunks: chunks.length, concurrency },
    'Document partitioned into chunks'
  );

  // Controlled concurrency batching with pacing to prevent Groq TPM rate limit spikes
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);
    log.info(
      { batchStart: i + 1, batchEnd: Math.min(i + concurrency, chunks.length), totalChunks: chunks.length },
      'Processing chunk batch'
    );
    const batchResults = await Promise.all(
      batch.map(async (chunk, bIdx) => {
        const chunkIndex = i + bIdx + 1;
        const res = await parseChunkWithLLM(chunk);
        log.debug(
          { chunkIndex, totalChunks: chunks.length, problemsFound: res.problems?.length || 0 },
          'Chunk parsed'
        );
        return res;
      })
    );
    results.push(...batchResults);

    // Brief pacing between batches if more chunks remain
    if (i + concurrency < chunks.length) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  // Flatten problems array
  const rawProblems = results.flatMap((res) => res.problems || []);

  // Deduplicate by URL (or by lowercase title if no URL exists)
  const uniqueProblemsMap = new Map<string, ExtractedQuestion>();
  for (const item of rawProblems) {
    const key = item.url ? item.url.toLowerCase() : item.title.toLowerCase().trim();
    if (!uniqueProblemsMap.has(key)) {
      uniqueProblemsMap.set(key, item);
    }
  }

  const finalQuestions = Array.from(uniqueProblemsMap.values());

  // Quality gate check
  if (finalQuestions.length === 0) {
    return {
      success: false,
      message:
        'No coding problems could be detected in this document. Please verify the URL or PDF formatting.',
      data: [],
    };
  }

  return {
    success: true,
    totalExtracted: finalQuestions.length,
    data: finalQuestions,
  };
}
