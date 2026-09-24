import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chunkNormalizedText } from '../services/ingestion/chunker.service';
import { extractTextFromUrl } from '../services/ingestion/dispatcher.service';
import { normalizeGoogleSheet } from '../services/extractors/googleSheet.extractor';
import { normalizeGoogleDoc } from '../services/extractors/googleDoc.extractor';
import { normalizeGenericWebpage } from '../services/extractors/web.extractor';
import { AppError } from '../errors/appError';

vi.mock('../services/extractors/googleSheet.extractor', () => ({
  normalizeGoogleSheet: vi.fn(),
}));

vi.mock('../services/extractors/googleDoc.extractor', () => ({
  normalizeGoogleDoc: vi.fn(),
}));

vi.mock('../services/extractors/web.extractor', () => ({
  normalizeGenericWebpage: vi.fn(),
}));

describe('Ingestion Chunker Service', () => {
  it('returns empty array when given empty input', () => {
    const result = chunkNormalizedText([]);
    expect(result).toEqual([]);
  });

  it('returns single chunk when line count is <= default chunkSize (7)', () => {
    const lines = ['Problem 1', 'Problem 2', 'Problem 3'];
    const result = chunkNormalizedText(lines);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(lines);
  });

  it('splits lines with sliding window overlap when exceeding chunkSize', () => {
    // 10 lines, chunkSize = 7, overlap = 1
    // Chunk 1: [0..6] (7 lines), next i = 0 + (7 - 1) = 6
    // Chunk 2: [6..9] (4 lines), i + 7 >= 10 -> break
    const lines = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`);
    const chunks = chunkNormalizedText(lines, 7, 1);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual(lines.slice(0, 7));
    expect(chunks[1]).toEqual(lines.slice(6, 10));
    // Verify overlap line
    expect(chunks[0][6]).toBe(chunks[1][0]);
  });

  it('handles custom chunkSize and overlap accurately', () => {
    const lines = ['A', 'B', 'C', 'D', 'E', 'F'];
    const chunks = chunkNormalizedText(lines, 3, 1);

    // Chunk 1: A, B, C (next i = 0 + 2 = 2)
    // Chunk 2: C, D, E (next i = 2 + 2 = 4)
    // Chunk 3: E, F (next i = 4 + 2 = 6 >= 6 -> break)
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toEqual(['A', 'B', 'C']);
    expect(chunks[1]).toEqual(['C', 'D', 'E']);
    expect(chunks[2]).toEqual(['E', 'F']);
  });
});

describe('Ingestion Dispatcher Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('identifies Google Sheets URL, extracts Sheet ID, and invokes normalizeGoogleSheet', async () => {
    const sheetUrl =
      'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0';
    (normalizeGoogleSheet as any).mockResolvedValue(['Row 1', 'Row 2']);

    const result = await extractTextFromUrl(sheetUrl);

    expect(normalizeGoogleSheet).toHaveBeenCalledWith(
      '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
    );
    expect(result).toEqual(['Row 1', 'Row 2']);
  });

  it('throws 400 AppError for malformed Google Sheets URL missing document ID', async () => {
    const invalidSheetUrl = 'https://docs.google.com/spreadsheets/u/0/random';

    await expect(extractTextFromUrl(invalidSheetUrl)).rejects.toThrow(AppError);
    await expect(extractTextFromUrl(invalidSheetUrl)).rejects.toThrow(
      'Invalid Google Sheet URL format.'
    );
  });

  it('identifies Google Docs URL, extracts Doc ID, and invokes normalizeGoogleDoc', async () => {
    const docUrl =
      'https://docs.google.com/document/d/1krrCrWl-uvcgV8Q6FTQDiJpUZdmvys0wHly7nRriI6c/edit';
    (normalizeGoogleDoc as any).mockResolvedValue(['Heading 1', 'Paragraph']);

    const result = await extractTextFromUrl(docUrl);

    expect(normalizeGoogleDoc).toHaveBeenCalledWith(
      '1krrCrWl-uvcgV8Q6FTQDiJpUZdmvys0wHly7nRriI6c'
    );
    expect(result).toEqual(['Heading 1', 'Paragraph']);
  });

  it('throws 400 AppError for malformed Google Doc URL missing document ID', async () => {
    const invalidDocUrl = 'https://docs.google.com/document/pub';

    await expect(extractTextFromUrl(invalidDocUrl)).rejects.toThrow(AppError);
    await expect(extractTextFromUrl(invalidDocUrl)).rejects.toThrow(
      'Invalid Google Doc URL format.'
    );
  });

  it('delegates generic webpage URLs to normalizeGenericWebpage', async () => {
    const webUrl = 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-problems/';
    (normalizeGenericWebpage as any).mockResolvedValue(['Problem 1', 'Problem 2']);

    const result = await extractTextFromUrl(webUrl);

    expect(normalizeGenericWebpage).toHaveBeenCalledWith(webUrl);
    expect(result).toEqual(['Problem 1', 'Problem 2']);
  });
});

