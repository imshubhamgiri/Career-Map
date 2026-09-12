import { PDFParse } from 'pdf-parse';

export async function normalizePdf(buffer: Buffer): Promise<string[]> {
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    const text = textResult.text || '';
    return text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
  } finally {
    await parser.destroy();
  }
}
