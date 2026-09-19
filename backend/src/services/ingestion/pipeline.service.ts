import { chunkNormalizedText } from './chunker.service';
import { parseWithGemini, parseChunkWithGroq } from './llmParser.service';
import { ChunkResult, ExtractedQuestion, PipelineResult } from '../../types';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
// [PHASE 5 FIX]: Import canonical identity resolver for deduplication
import { resolveCanonicalSlug } from '../../utils/canonicalSlug';

const log = logger.child({ service: 'IngestionPipeline' });

export async function processDocumentPipeline(
  rawLines: string[],
  concurrency = 1
): Promise<PipelineResult> {
  log.info({ totalLines: rawLines.length }, 'Starting document ingestion pipeline');

  let results: ChunkResult[] = [];

  // ==========================================
  // Tier 1: Try Google Gemini (Handles full sheets or large chunks)
  // ==========================================
  if (env.GEMINI_API_KEY || env.GOOGLE_API_KEY) {
    try {
      if (rawLines.length <= 350) {
        // Up to 350 lines (300+ questions): pass in a single shot with 32,000 output tokens!
        log.info({ totalLines: rawLines.length }, 'Attempting single-shot extraction via Gemini 3.6 Flash (32k token buffer)');
        const res = await parseWithGemini(rawLines);
        log.info({ problemsFound: res.problems?.length || 0 }, 'Gemini single-shot extraction succeeded');
        results = [res];
      } else {
        // Very large document: chunk in blocks of 150 lines
        const geminiChunks = chunkNormalizedText(rawLines, 150, 5);
        log.info(
          { totalLines: rawLines.length, totalChunks: geminiChunks.length },
          'Processing in 150-line Gemini chunks'
        );
        for (let i = 0; i < geminiChunks.length; i++) {
          const res = await parseWithGemini(geminiChunks[i]);
          log.debug(
            { chunkIndex: i + 1, totalChunks: geminiChunks.length, problemsFound: res.problems?.length || 0 },
            'Chunk parsed via Gemini'
          );
          results.push(res);
          if (i + 1 < geminiChunks.length) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
    } catch (err: any) {
      log.warn(
        { err: err?.message, code: err?.statusCode || err?.status },
        'Gemini extraction failed or rate-limited. Falling back to Groq chunked pipeline'
      );
      results = []; // Reset results to trigger Groq fallback
    }
  }

  // ==========================================
  // Tier 2: Fallback to Groq Chunked Pipeline
  // ==========================================
  if (results.length === 0) {
    // Safe chunk size (7 lines, 1 overlap) ensures < 600 output tokens to prevent JSON truncation
    const chunks = chunkNormalizedText(rawLines, 7, 1);
    log.info(
      { totalLines: rawLines.length, totalChunks: chunks.length, concurrency },
      'Processing via Groq fallback chunked pipeline'
    );

    for (let i = 0; i < chunks.length; i += concurrency) {
      const batch = chunks.slice(i, i + concurrency);
      log.info(
        { batchStart: i + 1, batchEnd: Math.min(i + concurrency, chunks.length), totalChunks: chunks.length },
        'Processing Groq batch'
      );

      const batchResults = await Promise.all(
        batch.map(async (chunk, bIdx) => {
          const chunkIndex = i + bIdx + 1;
          let attempts = 0;

          while (attempts < 3) {
            try {
              const res = await parseChunkWithGroq(chunk);
              log.debug(
                { chunkIndex, totalChunks: chunks.length, problemsFound: res.problems?.length || 0 },
                'Chunk parsed via Groq'
              );
              return res;
            } catch (error: any) {
              attempts++;
              log.error({ chunkIndex, attempt: attempts, error: error.message }, 'Error parsing chunk with Groq');
              const isRateLimitError =
                error?.message?.includes('Rate limit') ||
                error?.message?.includes('rate limit') ||
                error?.status === 429;

              if (isRateLimitError && attempts < 3) {
                log.warn({ chunkIndex, attempt: attempts }, 'Groq TPM rate limit hit. Pausing 8s before retrying...');
                await new Promise((r) => setTimeout(r, 8000));
              } else {
                throw error;
              }
            }
          }
          throw new Error(`Failed to parse chunk ${chunkIndex} after retries.`);
        })
      );
      results.push(...batchResults);

      // Brief pacing between batches if more chunks remain
      if (i + concurrency < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // Flatten problems array
  const rawProblems = results.flatMap((res) => res.problems || []);

  // [PHASE 5 FIX]: Deduplicate using universal canonical identity instead of raw string comparison.
  // This collapses URL variants (e.g. /problems/two-sum and /problems/two-sum/description)
  // and cross-platform representations into the same canonical problem.
  const uniqueProblemsMap = new Map<string, ExtractedQuestion>();
  for (const item of rawProblems) {
    const key = resolveCanonicalSlug(item.title, item.url);
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

  log.info({ totalExtracted: finalQuestions.length }, 'Document pipeline completed successfully');

  return {
    success: true,
    totalExtracted: finalQuestions.length,
    data: finalQuestions,
  };
}

