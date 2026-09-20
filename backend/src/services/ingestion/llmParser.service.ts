import { generateText, Output } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createGoogle } from '@ai-sdk/google';
import { ChunkResultSchema } from '../../schemas/problem.schema';
import { ChunkResult } from '../../types';
import { env } from '../../config/env';

const groq = createGroq({ apiKey: env.GROQ_API_KEY });
const geminiApiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
const google = geminiApiKey ? createGoogle({ apiKey: geminiApiKey }) : null;

const SYSTEM_PROMPT = `You are an expert DSA curriculum extractor.
You must parse messy lines of text from study sheets and convert them into structured DSA problems.
Return valid JSON adhering strictly to the JSON schema.
Rules:
1. Ignore navigational rows, donation links, sheet disclaimers, or empty headers.
2. If a problem does not have a difficulty or category specified, infer it accurately using your knowledge of LeetCode/GFG questions.
3. If an explicit hyperlink was parsed in markdown format like [Title](url), use that url.
4. If no questions are found, set containsProblems to false and problems to [].`;

/**
 * Parses medium-to-large chunks (35-45 lines) using Gemini 3.6 Flash (1M TPM, 8,192 max output tokens).
 */
export async function parseWithGemini(lines: string[] , model?: any): Promise<ChunkResult> {
  if (!google) {
    throw new Error('Neither GEMINI_API_KEY nor GOOGLE_API_KEY is configured.');
  }

  const textPayload = lines.join('\n');
  const { output } = await generateText({
    model: google(model || 'gemini-3.6-flash'),
    maxOutputTokens: 32000,
    output: Output.object({
      schema: ChunkResultSchema,
    }),
    system: SYSTEM_PROMPT,
    prompt: `Parse the following extracted text snippet into JSON:\n\n${textPayload}`,
  });

  return output;
}

/**
 * Parses small chunks (5-7 lines) using Groq (openai/gpt-oss-20b) with safe 1,500 token limit.
 */
export async function parseChunkWithGroq(chunkLines: string[]): Promise<ChunkResult> {
  const textPayload = chunkLines.join('\n');

  const { output } = await generateText({
    model: groq('openai/gpt-oss-20b'),
    maxOutputTokens: 1500,
    output: Output.object({
      schema: ChunkResultSchema,
    }),
    system: SYSTEM_PROMPT,
    prompt: `Parse the following extracted text snippet into JSON:\n\n${textPayload}`,
  });

  return output;
}

export const parseChunkWithLLM = parseChunkWithGroq;

