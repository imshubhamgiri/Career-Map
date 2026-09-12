import { chunkNormalizedText } from './chunker.service';
import { parseChunkWithLLM } from './llmParser.service';
import { ExtractedQuestion, PipelineResult } from '../../types';

export async function processDocumentPipeline(
  rawLines: string[],
  concurrency = 5
): Promise<PipelineResult> {
  const chunks = chunkNormalizedText(rawLines, 35, 3);

  const results = [];

  // Controlled concurrency batching to prevent API rate limit issues
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((chunk) => parseChunkWithLLM(chunk)));
    results.push(...batchResults);
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
