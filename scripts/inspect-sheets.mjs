import { google } from 'googleapis';
import fs from 'fs';

const dotenv = fs.readFileSync('.env.local', 'utf8');
const env = {};
dotenv.split('\n').forEach((l) => {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) {
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1].trim()] = v.replace(/\\n/g, '\n');
  }
});

const auth = new google.auth.JWT({
  email: env.GOOGLE_CLIENT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function inspect() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: env.GOOGLE_SHEET_ID });
  for (const s of meta.data.sheets) {
    const title = s.properties.title;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range: `'${title}'!A1:I5`,
    });
    console.log(`=== ${title} ===`);
    console.log(res.data.values || []);
  }
}

inspect().catch(console.error);
