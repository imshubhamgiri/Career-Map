import { normalizeGoogleSheet } from '../extractors/googleSheet.extractor';
import { normalizeGoogleDoc } from '../extractors/googleDoc.extractor';
import { normalizeGenericWebpage } from '../extractors/web.extractor';
import { AppError } from '../../errors/appError';

export async function extractTextFromUrl(url: string): Promise<string[]> {
  const parsedUrl = new URL(url);

  // 1. Google Sheets
  if (parsedUrl.hostname === 'docs.google.com' && parsedUrl.pathname.includes('/spreadsheets/')) {
    const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new AppError('Invalid Google Sheet URL format.', 400);
    }
    return await normalizeGoogleSheet(sheetIdMatch[1]);
  }

  // 2. Google Docs
  if (parsedUrl.hostname === 'docs.google.com' && parsedUrl.pathname.includes('/document/')) {
    const docIdMatch = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    if (!docIdMatch) {
      throw new AppError('Invalid Google Doc URL format.', 400);
    }
    return await normalizeGoogleDoc(docIdMatch[1]);
  }

  // 3. Generic Webpages / DSA Blogs / Notion Pages / GitHub
  return await normalizeGenericWebpage(url);
}
