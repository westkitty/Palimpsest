import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';

const PORT = Number(process.env.PORT || 3000);
const ALLOWED_VOICES = new Set(['Charon', 'Fenrir', 'Kore', 'Zephyr', 'Puck']);
const MAX_AUDIO_CACHE = 120;
const DISK_CACHE_DIR = path.resolve(process.cwd(), '.cache', 'tts-wav');

// Free-tier safe RPM limiter & cooldown tracker for gemini-3.8-flash-lite-tts (3 RPM cap)
const RPM_WINDOW_MS = 62_000;
const MAX_REQUESTS_PER_WINDOW = 3;

const wavCache = new Map<string, Buffer>();
const inFlightSynths = new Map<string, Promise<Buffer>>();
const recentUpstreamTimestamps: number[] = [];
let rateLimitedUntilMs = 0;
let cachedClient: GoogleGenAI | null = null;

function ensureDiskCacheDir(): void {
  try {
    if (!fs.existsSync(DISK_CACHE_DIR)) {
      fs.mkdirSync(DISK_CACHE_DIR, { recursive: true });
    }
  } catch {
    // Non-fatal if filesystem cache cannot be created
  }
}

function getCacheFilePath(cacheKey: string): string {
  const hash = crypto.createHash('sha256').update(cacheKey).digest('hex').slice(0, 28);
  return path.join(DISK_CACHE_DIR, `${hash}.wav`);
}

function readCachedWav(cacheKey: string): Buffer | null {
  const mem = wavCache.get(cacheKey);
  if (mem) return mem;

  try {
    const filePath = getCacheFilePath(cacheKey);
    if (fs.existsSync(filePath)) {
      const diskBuf = fs.readFileSync(filePath);
      if (diskBuf.length >= 128 && diskBuf.subarray(0, 4).toString('ascii') === 'RIFF') {
        setMemoryCachedWav(cacheKey, diskBuf);
        return diskBuf;
      }
    }
  } catch {
    // Ignore disk cache read issues
  }
  return null;
}

function setMemoryCachedWav(key: string, buf: Buffer): void {
  if (wavCache.size >= MAX_AUDIO_CACHE) {
    const oldestKey = wavCache.keys().next().value;
    if (oldestKey) wavCache.delete(oldestKey);
  }
  wavCache.set(key, buf);
}

function writeCachedWav(cacheKey: string, buf: Buffer): void {
  setMemoryCachedWav(cacheKey, buf);
  try {
    ensureDiskCacheDir();
    fs.writeFileSync(getCacheFilePath(cacheKey), buf);
  } catch {
    // Non-fatal if disk write fails
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedClient;
}

function pruneWindow(now: number): void {
  while (
    recentUpstreamTimestamps.length > 0 &&
    now - recentUpstreamTimestamps[0] > RPM_WINDOW_MS
  ) {
    recentUpstreamTimestamps.shift();
  }
}

function getCooldownSecondsRemaining(now = Date.now()): number {
  pruneWindow(now);
  let waitMs = Math.max(0, rateLimitedUntilMs - now);

  if (recentUpstreamTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestResetMs = recentUpstreamTimestamps[0] + RPM_WINDOW_MS - now;
    waitMs = Math.max(waitMs, oldestResetMs);
  }

  return waitMs > 0 ? Math.max(1, Math.ceil(waitMs / 1000)) : 0;
}

function parseRetryAfterSeconds(message: string): number {
  const preciseMatch = message.match(/retry in\s+([\d.]+)s/i);
  if (preciseMatch) {
    const secs = Number.parseFloat(preciseMatch[1]);
    if (Number.isFinite(secs) && secs > 0) return Math.min(180, Math.max(5, Math.ceil(secs) + 1));
  }
  const delayMatch = message.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
  if (delayMatch) {
    const secs = Number.parseInt(delayMatch[1], 10);
    if (Number.isFinite(secs) && secs >= 0) return Math.min(180, Math.max(5, secs + 1));
  }
  return 25;
}

function isQuotaError(err: unknown): { is429: boolean; message: string; retryAfterSec: number } {
  const rawMessage = err instanceof Error ? err.message : String(err ?? '');
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: unknown }).status)
      : 0;
  const is429 =
    status === 429 ||
    rawMessage.includes('"code":429') ||
    rawMessage.includes('RESOURCE_EXHAUSTED') ||
    rawMessage.includes('Quota exceeded');
  return {
    is429,
    message: rawMessage,
    retryAfterSec: is429 ? parseRetryAfterSeconds(rawMessage) : 0,
  };
}

async function synthesizeWithGemini(
  ai: GoogleGenAI,
  text: string,
  voiceName: string,
  style: string,
): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text,
            speechMetadata: {
              style,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('No audio data returned by voice synthesizer.');
  }
  return Buffer.from(base64Audio, 'base64');
}

async function createServer(): Promise<void> {
  ensureDiskCacheDir();
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/narration/health', (_req: Request, res: Response) => {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY.trim() !== '' &&
        process.env.GEMINI_API_KEY.trim() !== 'MY_GEMINI_API_KEY',
    );
    res.json({
      available: hasKey,
      cachedClips: wavCache.size,
      cooldownSeconds: getCooldownSecondsRemaining(),
    });
  });

  app.post('/api/narration/tts', async (req: Request, res: Response) => {
    try {
      const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
      const rawVoice = typeof req.body?.voiceName === 'string' ? req.body.voiceName.trim() : 'Charon';
      const rawStyle =
        typeof req.body?.style === 'string' && req.body.style.trim()
          ? req.body.style.trim().slice(0, 180)
          : 'Warm, resonant antiquarian storyteller in a candlelit study, measured and evocative';

      if (!rawText || rawText.length > 1400) {
        res.status(400).json({ error: 'Narration text must be between 1 and 1400 characters.' });
        return;
      }

      const voiceName = ALLOWED_VOICES.has(rawVoice) ? rawVoice : 'Charon';
      const cacheKey = `${voiceName}::${rawStyle}::${rawText}`;

      const cached = readCachedWav(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(cached);
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.setHeader('X-TTS-Status', 'unconfigured');
        res.setHeader('X-Retry-After', '60');
        res.status(204).end();
        return;
      }

      const existingInFlight = inFlightSynths.get(cacheKey);
      if (existingInFlight) {
        const wavBuffer = await existingInFlight;
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(wavBuffer);
        return;
      }

      const cooldownSec = getCooldownSecondsRemaining();
      if (cooldownSec > 0) {
        res.setHeader('X-TTS-Status', 'cooldown');
        res.setHeader('X-Retry-After', String(cooldownSec));
        res.status(204).end();
        return;
      }

      recentUpstreamTimestamps.push(Date.now());
      const synthPromise = synthesizeWithGemini(ai, rawText, voiceName, rawStyle)
        .then((wavBuffer) => {
          writeCachedWav(cacheKey, wavBuffer);
          return wavBuffer;
        })
        .finally(() => {
          inFlightSynths.delete(cacheKey);
        });

      inFlightSynths.set(cacheKey, synthPromise);
      const wavBuffer = await synthPromise;

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(wavBuffer);
    } catch (err) {
      const quota = isQuotaError(err);
      if (quota.is429) {
        const until = Date.now() + quota.retryAfterSec * 1000;
        rateLimitedUntilMs = Math.max(rateLimitedUntilMs, until);
        res.setHeader('X-TTS-Status', 'cooldown');
        res.setHeader('X-Retry-After', String(quota.retryAfterSec));
        res.status(204).end();
        return;
      }

      console.warn('[TTS fallback]', quota.message || 'Voice narration synthesis unavailable');
      res.setHeader('X-TTS-Status', 'unavailable');
      res.setHeader('X-Retry-After', '30');
      res.status(204).end();
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Palimpsest server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
