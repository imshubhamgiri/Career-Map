import { createGroq } from '@ai-sdk/groq';
import { createGoogle, createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { ChunkResultSchema } from '../../schemas/problem.schema';
import { logger } from '../../utils/logger';

const log = logger.child({ service: 'LLMFallback' });

interface LLMProviderConfig {
  name: string;
  model: any;
  coolingUntil?: number; // timestamp to skip if rate-limited
}

const providers: LLMProviderConfig[] = [
  { name: 'Gemini-2.0-Flash', model: createGoogle({ apiKey: process.env.GOOGLE_API_KEY })('gemini-2.0-flash') },
  { name: 'Groq-120B', model: createGroq({ apiKey: process.env.GROQ_API_KEY })('openai/gpt-oss-120b') },
//   { name: 'Cerebras-70B', model: createOpenAICompatible({ ... })('llama-3.3-70b') }
];

export async function parseWithFallback(payload: string) {
  const now = Date.now();

  for (const provider of providers) {
    // Skip if recently rate-limited (e.g. within cooldown period)
    if (provider.coolingUntil && provider.coolingUntil > now) continue;

    try {
      const { output } = await generateText({
        model: provider.model,
        output: Output.object({ schema: ChunkResultSchema }),
        system: "You are an expert DSA curriculum extractor. Return strict JSON.",
        prompt: payload,
      });

      return output;
    } catch (err: any) {
      const status = err?.statusCode || err?.status;
      if (status === 429 || err?.message?.includes('rate limit')) {
        log.warn(
          { provider: provider.name, status, cooldownSeconds: 60 },
          `Provider rate-limited. Setting 60s cooldown & failing over`
        );
        provider.coolingUntil = Date.now() + 60_000; // 1-minute cooldown
        continue; // Try next provider in chain
      }
      // If it's another non-rate-limit error, continue to next provider as well
      log.warn(
        { provider: provider.name, err: err?.message },
        `Provider encountered error. Trying next provider in fallback chain`
      );
    }
  }

  throw new Error("All LLM providers in fallback chain exhausted.");
}