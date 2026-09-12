import { Request, Response, NextFunction } from 'express';
import { extractTextFromUrl } from '../services/ingestion/dispatcher.service';
import { normalizePdf } from '../services/extractors/pdf.extractor';
import { processDocumentPipeline } from '../services/ingestion/pipeline.service';
import { AppError } from '../errors/appError';

export async function ingestUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { url } = req.body;
    if (!url) {
      throw new AppError('URL is required', 400);
    }

    // Step 1: Auto-detect source and normalize to string[]
    const rawLines = await extractTextFromUrl(url);

    // Step 2 & 3: Sliding window chunking & LLM extraction
    const result = await processDocumentPipeline(rawLines);

    if (!result.success) {
      res.status(422).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function ingestFile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError('File is required', 400);
    }

    // Normalize PDF to string[]
    const rawLines = await normalizePdf(req.file.buffer);

    // Run identical extraction pipeline
    const result = await processDocumentPipeline(rawLines);

    if (!result.success) {
      res.status(422).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
