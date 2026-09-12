import { AppError } from '../../errors/appError';

export async function normalizeGoogleDoc(documentId: string): Promise<string[]> {
  const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`;
  
  const response = await fetch(exportUrl);
  if (!response.ok) {
    throw new AppError(
      'Could not access Google Doc. Ensure it is set to "Anyone with the link can view".',
      400
    );
  }

  const rawText = await response.text();
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
