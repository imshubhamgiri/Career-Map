import * as cheerio from 'cheerio';
import { AppError } from '../../errors/appError';

export async function normalizeGenericWebpage(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new AppError(
        `Failed to fetch webpage: ${response.status} ${response.statusText}`,
        response.status >= 400 && response.status < 500 ? 400 : 502
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove irrelevant elements
    $('script, style, nav, footer, noscript, svg, header, aside, iframe').remove();

    // Preserve hyperlinks in markdown format [Text](URL)
    $('a').each((_, element) => {
      const text = $(element).text().trim();
      const href = $(element).attr('href');
      if (text && href && !href.startsWith('javascript:')) {
        try {
          const absoluteUrl = new URL(href, url).href;
          $(element).replaceWith(` [${text}](${absoluteUrl}) `);
        } catch {
          $(element).replaceWith(` [${text}](${href}) `);
        }
      }
    });

    const bodyText = $('body').text() || $.text();
    return bodyText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Error extracting webpage: ${error.message || error}`, 500);
  }
}
