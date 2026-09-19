import { Request, Response, NextFunction } from 'express';
import { extractTextFromUrl } from '../services/ingestion/dispatcher.service';
import { normalizePdf } from '../services/extractors/pdf.extractor';
import { processDocumentPipeline } from '../services/ingestion/pipeline.service';
import { AppError } from '../errors/appError';
import { RoadmapService } from '../services/roadmap.service';
import { ProblemService } from '../services/problems.service';
import { ApiResponse, IngestUrlInput } from '../types/index';
import { Roadmap, RoadmapStatus } from '@prisma/client';

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
  res: Response<ApiResponse<string>>,
  next: NextFunction
): Promise<void> {
  let createdRoadmap: Roadmap | null = null;

  try {
    const { url, title } = req.body;
    const userId = req.user!.userId;

    // 1. Clone-on-Ingest check (Phase 2)
    const roadmapexists = await roadmapService.roadmapExists(url);
    if (roadmapexists && roadmapexists.userId === userId) {
      res.status(200).json({ success: true, message: 'roadmap already exists', data: roadmapexists.id });
      return;
    }
    if (roadmapexists) {
      // [PHASE 2 FIX]: Pass custom title if provided, and return cloned roadmap ID
      const newRoadmap = await roadmapService.cloneRoadmap(roadmapexists.id, userId, title);
      res.status(201).json({ success: true, message: 'roadmap created successfully', data: newRoadmap.id });
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

    // 2. Extract and parse document
    const rawLines = await extractTextFromUrl(url);
    const result = await processDocumentPipeline(rawLines);

    // [PHASE 3 FIX]: Pipeline quality gate - handle pipeline failure
    if (!result.success) {
      await roadmapService.updateStatus(
        createdRoadmap.id,
        RoadmapStatus.FAILED,
        result.message || 'Pipeline processing failed'
      );
      res.status(422).json({
        success: false,
        message: result.message || 'Pipeline processing failed',
        data: createdRoadmap.id,
      });
      return;
    }

    // [PHASE 3 FIX]: Pipeline quality gate - handle 0 extracted questions
    if (result.data.length === 0) {
      await roadmapService.updateStatus(
        createdRoadmap.id,
        RoadmapStatus.FAILED,
        'No DSA problems detected in document'
      );
      res.status(422).json({
        success: false,
        message: 'No coding problems could be detected in this document.',
        data: createdRoadmap.id,
      });
      return;
    }

    // 3. Persist extracted problems (Phase 5 deduplication & transaction)
    await problemService.saveExtractedProblems(createdRoadmap.id, result.data);

    // [PHASE 3 FIX]: Transition status to COMPLETED upon successful persistence
    await roadmapService.updateStatus(createdRoadmap.id, RoadmapStatus.COMPLETED);

    res.status(201).json({
      success: true,
      message: 'created Roadmap',
      data: createdRoadmap.id,
    });
  } catch (err) {
    // [PHASE 3 FIX]: Mark roadmap as FAILED in catch block so it is not left orphaned in DB
    if (createdRoadmap) {
      await roadmapService
        .updateStatus(createdRoadmap.id, RoadmapStatus.FAILED, (err as Error).message)
        .catch(() => {});
    }
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
