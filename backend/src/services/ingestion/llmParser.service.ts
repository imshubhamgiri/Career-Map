import { generateText, Output } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { ChunkResultSchema } from '../../schemas/problem.schema';
import { ChunkResult } from '../../types';
import { env } from '../../config/env';

const groq = createGroq({ apiKey: env.GROQ_API_KEY });

export async function parseChunkWithLLM(chunkLines: string[]): Promise<ChunkResult> {
  const textPayload = chunkLines.join('\n');

  const { output } = await generateText({
    model: groq('openai/gpt-oss-120b'),
    output: Output.object({
      schema: ChunkResultSchema,
    }),
    system: `You are an expert DSA curriculum extractor.
You must parse messy lines of text from study sheets and convert them into structured DSA problems.
Return valid JSON adhering strictly to the JSON schema.
Rules:
1. Ignore navigational rows, donation links, sheet disclaimers, or empty headers.
2. If a problem does not have a difficulty or category specified, infer it accurately using your knowledge of LeetCode/GFG questions.
3. If an explicit hyperlink was parsed in markdown format like [Title](url), use that url.
4. If no questions are found, set containsProblems to false and problems to [].`,
    prompt: `Parse the following extracted text snippet into JSON:\n\n${textPayload}`,
  });

  return output;
}
