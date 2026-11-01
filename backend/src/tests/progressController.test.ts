import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressController } from '../controllers/progress.controller';
import { ProgressStatus } from '@prisma/client';
import { UnauthorizedError, BadRequestError } from '../errors/appError';

describe('ProgressController Unit Tests', () => {
  let mockProgressRepo: any;
  let progressController: ProgressController;

  beforeEach(() => {
    vi.clearAllMocks();

    mockProgressRepo = {
      upsertProgressEvent: vi.fn(),
      findProgressByUserAndProblem: vi.fn(),
    };

    progressController = new ProgressController(mockProgressRepo);
  });

  it('throws UnauthorizedError if user is missing on request', async () => {
    const req: any = {
      user: undefined,
      params: { problemId: 'p-1' },
      body: { status: ProgressStatus.SOLVED },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await progressController.updateProgress(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockProgressRepo.upsertProgressEvent).not.toHaveBeenCalled();
  });

  it('throws BadRequestError if problemId param is empty', async () => {
    const req: any = {
      user: { userId: 'u-1', email: 'test@career-os.dev' },
      params: { problemId: '' },
      body: { status: ProgressStatus.SOLVED },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await progressController.updateProgress(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it('successfully updates progress and responds with 200', async () => {
    const mockProgressEvent = {
      id: 'pe-123',
      userId: 'u-1',
      problemId: 'p-1',
      status: ProgressStatus.SOLVED,
      aiNotes: 'Clean O(N) hashmap approach',
      solvedAt: new Date(),
    };

    mockProgressRepo.upsertProgressEvent.mockResolvedValueOnce(mockProgressEvent);

    const req: any = {
      user: { userId: 'u-1', email: 'test@career-os.dev' },
      params: { problemId: 'p-1' },
      body: { status: ProgressStatus.SOLVED, aiNotes: 'Clean O(N) hashmap approach' },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await progressController.updateProgress(req, res, next);

    expect(mockProgressRepo.upsertProgressEvent).toHaveBeenCalledWith({
      userId: 'u-1',
      problemId: 'p-1',
      status: ProgressStatus.SOLVED,
      aiNotes: 'Clean O(N) hashmap approach',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockProgressEvent,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
