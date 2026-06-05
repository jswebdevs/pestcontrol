import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// `@google/genai` is loaded lazily inside the constructor so the rest of the
// app keeps booting even when the package is absent at build time (e.g. on a
// Vercel deploy that hasn't run install). The shape is stable enough that we
// only need the `GoogleGenAI` constructor and a couple of method signatures.
type GenAi = {
  models: {
    generateContent(input: {
      model: string;
      contents: any;
      config?: any;
    }): Promise<any>;
  };
};

export interface GeminiTextOptions<T = any> {
  prompt: string;
  schema?: any;
  systemInstruction?: string;
  temperature?: number;
}

export interface GeminiImageResult {
  mimeType: string;
  base64: string;
  modelUsed: string;
}

const RETRYABLE_RE = /(429|500|502|503|504|rate|quota|overloaded|deadline|timeout|fetch|network|unavailable)/i;
// Errors where retrying the same model is pointless — fall through to the next
// model immediately (model doesn't exist, key lacks permission, bad request).
const SKIP_MODEL_RE = /(404|400|403|not[_\s-]?found|not_found|permission|invalid[_\s-]?argument|unsupported|deprecated)/i;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private ai: GenAi | null = null;
  private textModels: string[] = [];
  private imageModels: string[] = [];
  private maxRetriesPerModel = 3;
  private apiKey = '';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.apiKey = this.config.get<string>('gemini.apiKey') || '';
    this.textModels = this.config.get<string[]>('gemini.textModels') || [];
    this.imageModels = this.config.get<string[]>('gemini.imageModels') || [];
    this.maxRetriesPerModel = this.config.get<number>('gemini.maxRetriesPerModel') ?? 3;

    if (!this.apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY not set — AI endpoints will return 503 until configured.',
      );
      return;
    }
    try {
      const mod: any = await import('@google/genai');
      const GoogleGenAI = mod.GoogleGenAI || mod.default?.GoogleGenAI;
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      this.logger.log(
        `Gemini ready — text=[${this.textModels.join(', ')}] image=[${this.imageModels.join(', ')}]`,
      );
    } catch (e: any) {
      this.logger.error(`Gemini SDK init failed: ${e?.message ?? e}`);
    }
  }

  isReady(): boolean {
    return Boolean(this.ai && this.apiKey && this.textModels.length > 0);
  }

  /**
   * Run text generation against the fallback chain.
   * Returns the parsed JSON if a schema was provided, otherwise the raw text.
   * Throws ServiceUnavailableException only when every model × retry has failed.
   */
  async generateText<T = any>(opts: GeminiTextOptions<T>): Promise<{
    data: T;
    modelUsed: string;
    attempts: Array<{ model: string; attempt: number; error: string }>;
  }> {
    this.assertReady();
    const wantsJson = Boolean(opts.schema);
    const errors: Array<{ model: string; attempt: number; error: string }> = [];

    for (const model of this.textModels) {
      for (let attempt = 1; attempt <= this.maxRetriesPerModel; attempt++) {
        try {
          const res = await this.ai!.models.generateContent({
            model,
            contents: opts.prompt,
            config: {
              ...(wantsJson
                ? {
                    responseMimeType: 'application/json',
                    responseSchema: opts.schema,
                  }
                : {}),
              ...(opts.systemInstruction
                ? { systemInstruction: opts.systemInstruction }
                : {}),
              temperature: opts.temperature ?? 0.7,
            },
          });
          const text = this.extractText(res);
          if (!text) {
            throw new Error('empty response');
          }
          let data: any;
          if (wantsJson) {
            data = this.parseJsonLoose(text);
          } else {
            data = text;
          }
          return { data, modelUsed: model, attempts: errors };
        } catch (err: any) {
          const msg = err?.message ?? String(err);
          errors.push({ model, attempt, error: msg });
          this.logger.warn(`Gemini ${model} attempt ${attempt}/${this.maxRetriesPerModel} failed: ${msg}`);
          // Model doesn't exist / no permission — skip to next model, don't waste retries.
          if (SKIP_MODEL_RE.test(msg)) break;
          // Non-retryable and we're at the last attempt — break to next model.
          if (!RETRYABLE_RE.test(msg) && attempt >= this.maxRetriesPerModel) break;
          await sleep(Math.min(500 * 2 ** (attempt - 1), 4000));
        }
      }
    }
    throw new ServiceUnavailableException({
      message: 'All Gemini text models failed',
      attempts: errors,
    });
  }

  /**
   * Image generation against a fallback chain of image-capable models.
   * Each model is retried maxRetriesPerModel times before falling through;
   * 404 / "not found" responses skip a model immediately.
   */
  async generateImage(prompt: string): Promise<GeminiImageResult> {
    this.assertReady();
    if (this.imageModels.length === 0) {
      throw new ServiceUnavailableException('No image models configured');
    }
    const errors: Array<{ model: string; attempt: number; error: string }> = [];

    for (const model of this.imageModels) {
      for (let attempt = 1; attempt <= this.maxRetriesPerModel; attempt++) {
        try {
          const res = await this.ai!.models.generateContent({
            model,
            contents: prompt,
            config: { responseModalities: ['IMAGE', 'TEXT'] },
          });
          const img = this.extractImage(res);
          if (!img) throw new Error('no inline image data in response');
          return { ...img, modelUsed: model };
        } catch (err: any) {
          const msg = err?.message ?? String(err);
          errors.push({ model, attempt, error: msg });
          this.logger.warn(`Gemini image ${model} attempt ${attempt}/${this.maxRetriesPerModel} failed: ${msg}`);
          if (SKIP_MODEL_RE.test(msg)) break;
          if (!RETRYABLE_RE.test(msg) && attempt >= this.maxRetriesPerModel) break;
          await sleep(Math.min(500 * 2 ** (attempt - 1), 4000));
        }
      }
    }
    throw new ServiceUnavailableException({
      message: 'All Gemini image models failed',
      attempts: errors,
    });
  }

  // ─── helpers ────────────────────────────────────────────────────────────────
  private assertReady() {
    if (!this.isReady()) {
      throw new ServiceUnavailableException(
        'Gemini is not configured. Set GEMINI_API_KEY and restart.',
      );
    }
  }

  private extractText(res: any): string {
    if (typeof res?.text === 'string') return res.text;
    if (typeof res?.text === 'function') {
      try { return res.text(); } catch { /* fallthrough */ }
    }
    const cands = res?.candidates;
    if (Array.isArray(cands)) {
      for (const c of cands) {
        const parts = c?.content?.parts;
        if (Array.isArray(parts)) {
          const t = parts.map((p: any) => p?.text || '').join('').trim();
          if (t) return t;
        }
      }
    }
    return '';
  }

  private extractImage(res: any): { mimeType: string; base64: string } | null {
    const cands = res?.candidates;
    if (!Array.isArray(cands)) return null;
    for (const c of cands) {
      const parts = c?.content?.parts;
      if (!Array.isArray(parts)) continue;
      for (const p of parts) {
        const inline = p?.inlineData || p?.inline_data;
        if (inline && inline.data) {
          return {
            mimeType: inline.mimeType || inline.mime_type || 'image/png',
            base64: inline.data,
          };
        }
      }
    }
    return null;
  }

  /** JSON.parse with a fallback for models that wrap the payload in ```json fences. */
  private parseJsonLoose(text: string): any {
    const trimmed = text.trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenced) return JSON.parse(fenced[1]);
      // last-ditch: find the first { ... } block
      const first = trimmed.indexOf('{');
      const last = trimmed.lastIndexOf('}');
      if (first >= 0 && last > first) {
        return JSON.parse(trimmed.slice(first, last + 1));
      }
      throw new Error('response was not valid JSON');
    }
  }
}
