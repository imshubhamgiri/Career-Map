import { google } from 'googleapis';
import { env } from './env';

export const sheets = google.sheets({
  version: 'v4',
  auth: env.GOOGLE_API_KEY,
});
