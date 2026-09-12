export function chunkNormalizedText(
  lines: string[],
  chunkSize = 35,
  overlap = 3
): string[][] {
  const chunks: string[][] = [];
  let i = 0;

  while (i < lines.length) {
    const chunk = lines.slice(i, i + chunkSize);
    chunks.push(chunk);

    // Stop loop if end of lines is reached
    if (i + chunkSize >= lines.length) break;
    i += chunkSize - overlap;
  }

  return chunks;
}
