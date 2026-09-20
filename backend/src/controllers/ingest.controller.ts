import { Request, Response, NextFunction } from 'express';
import { extractTextFromUrl } from '../services/ingestion/dispatcher.service';
import { normalizePdf } from '../services/extractors/pdf.extractor';
import { processDocumentPipeline } from '../services/ingestion/pipeline.service';
import { AppError } from '../errors/appError';
import { RoadmapService } from '../services/roadmap.service';
import { ProblemService } from '../services/problems.service';
import { ApiResponse, IngestUrlInput } from '../types/index';
import { Roadmap, RoadmapStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { queueRoadmapIngestion } from '../queues/ingestion.queue';

let log = logger.child({ service: 'IngestController' });


const roadmapService = new RoadmapService();
const problemService = new ProblemService();

// [PHASE 1 FIX]: Helper to safely detect standardized source types
function detectSourceType(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'docs.google.com') {
      if (parsed.pathname.includes('/spreadsheets/')) return 'GOOGLE_SHEETS';
      if (parsed.pathname.includes('/document/')) return 'GOOGLE_DOCS';
    }
    return 'URL';
  } catch {
    return 'URL';
  }
}

export async function ingestUrl(
  req: Request<{}, {}, IngestUrlInput>,
  res: Response<ApiResponse<Roadmap>>,
  next: NextFunction
): Promise<void> {
  let createdRoadmap: Roadmap | null = null;

  try {
    const { url, title } = req.body;
    const userId = req.user!.userId;

    // 1. Clone-on-Ingest check (Phase 2)
    const roadmapexists = await roadmapService.roadmapExists(url);
    if (roadmapexists && roadmapexists.userId === userId) {
      res.status(200).json({ success: true, message: 'roadmap already exists', data: roadmapexists });
      return;
    }
    if (roadmapexists) {
      // [PHASE 2 FIX]: Pass custom title if provided, and return cloned roadmap ID
      const newRoadmap = await roadmapService.cloneRoadmap(roadmapexists.id, userId, title);
      res.status(201).json({ success: true, message: 'roadmap created successfully', data: newRoadmap });
      return;
    }

    // [PHASE 1 FIX]: Construct clean RoadmapInput matching Prisma contract
    // (passes userId from authenticated user, detected sourceType, sourceUrl, and initial PROCESSING status)
    const detectedSourceType = detectSourceType(url);
    createdRoadmap = await roadmapService.createRoadmap({
      userId,
      title: title || 'DSA Roadmap',
      sourceType: detectedSourceType,
      sourceUrl: url,
      status: RoadmapStatus.PROCESSING,
    });

    // 2. Offload extraction and parsing to background BullMQ worker
    await queueRoadmapIngestion({
      roadmapId: createdRoadmap.id,
      url,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'created Roadmap',
      data: createdRoadmap,
    });
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
