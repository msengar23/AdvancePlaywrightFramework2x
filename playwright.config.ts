
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import os from 'os';
import fs from 'fs';
import path from 'path';

dotenv.config();

// When Playwright runs under a Windows service account such as Jenkins
// (NT AUTHORITY\SYSTEM), USERPROFILE resolves to C:\WINDOWS\system32\config\systemprofile,
// so it cannot find browsers installed under the normal user profile. Point it at the
// machine's ms-playwright location that any account can access, if present.
if (process.platform === 'win32' && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
  const candidates = [
    path.join(process.env.ProgramData || 'C:\\ProgramData', 'ms-playwright'),
    path.join('C:\\Users', 'mamta', 'AppData', 'Local', 'ms-playwright'),
    path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright'),
  ];
  const found = candidates.find((dir) => fs.existsSync(dir));
  if (found) process.env.PLAYWRIGHT_BROWSERS_PATH = found;
}

function normalizeUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // .env values may be markdown-wrapped like [https://x.com](https://x.com/) — extract the link target.
  const md = raw.match(/\]\((https?:\/\/[^)]+)\)/);
  if (md) return md[1].replace(/\/+$/, '');
  return raw.replace(/^\[|\]$/g, '').replace(/\/+$/, '');
}

function resolveBaseURL(): string {
  if (process.env.BASE_URL) return normalizeUrl(process.env.BASE_URL)!;
  const env = (process.env.TTA_ENV || 'qa').toLowerCase();
  switch (env) {
    case 'api':
      return process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';
    case 'dev':
    case 'local':
      return process.env.DEV_BASE_URL || 'http://localhost:3000';
    case 'stg':
    case 'stage':
    case 'staging':
      return process.env.STG_BASE_URL || 'https://stage.thetestingacademy.com';
    case 'prod':
    case 'production':
      return process.env.PROD_BASE_URL || 'https://app.thetestingacademy.com';
    case 'qa':
    default:
      return process.env.QA_BASE_URL || 'https://app.thetestingacademy.com';
  }

}


export default defineConfig({
  testDir: './src/tests',

  timeout: 60_000,

  expect: {
    timeout: 10_000
  },

  fullyParallel: true,

  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['./src/utils/CustomReporter.ts'],
    ['html'],
    ['list'],
  ],

  use: {
    baseURL: resolveBaseURL(),
    screenshot: 'only-on-failure',
    video: 'on',
    trace: 'on',
    viewport: { width: 1920, height: 1080 }
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});