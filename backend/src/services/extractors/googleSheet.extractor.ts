import { sheets } from '../../config/google';

export async function normalizeGoogleSheet(spreadsheetId: string): Promise<string[]> {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(title),data(rowData(values(formattedValue,hyperlink))))',
  });

  const rawRows: string[] = [];

  for (const sheet of response.data.sheets || []) {
    const tabName = sheet.properties?.title || 'General';
    rawRows.push(`--- TAB: ${tabName} ---`);

    const rows = sheet.data?.[0]?.rowData || [];
    for (const row of rows) {
      if (!row.values || row.values.length === 0) continue;

      // Extract text and any underlying hyperlink attached to cells
      const cellsText = row.values
        .map((cell) => {
          const text = cell.formattedValue?.trim();
          const link = cell.hyperlink?.trim();
          if (!text) return '';
          return link ? `[${text}](${link})` : text;
        })
        .filter(Boolean);

      if (cellsText.length > 0) {
        rawRows.push(cellsText.join(' | '));
      }
    }
  }

  return rawRows;
}
