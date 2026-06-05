// Standalone Gemini → Cloudinary → DB script.
// Generates a portrait-oriented About hero image and attaches its publicId to
// the `home.about` setting. Runs without the Nest backend being up — it just
// needs the .env vars (GEMINI_API_KEY, GEMINI_IMAGE_MODELS, CLOUDINARY_*,
// DATABASE_URL) and the regenerated Prisma client.

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const homeAbout = await prisma.setting.findUnique({ where: { key: 'home.about' } });
const pageAbout = await prisma.setting.findUnique({ where: { key: 'page.about' } });
const promptFromAi = pageAbout?.value?.imagePrompt;

// Force a portrait composition so the image matches the new aspect-4/5 column.
const prompt =
  (promptFromAi ||
    'A professional Bangladeshi pest control team in green and grey uniform standing in front of a clean white service van in a residential Rajshahi neighborhood. Team smiling, approachable, daylight, photorealistic, magazine-quality, sharp detail.') +
  ' Portrait orientation, 4:5 aspect ratio, environmental portrait, the team is composed in the lower two-thirds with negative space above for headlines, shallow depth of field, natural skin tones, warm afternoon light.';

const models = (process.env.GEMINI_IMAGE_MODELS ||
  'gemini-2.5-flash-image,gemini-3.1-flash-image,gemini-3-pro-image')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

let inline = null;
let modelUsed = null;
for (const model of models) {
  try {
    const r = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseModalities: ['IMAGE', 'TEXT'] },
    });
    for (const c of r.candidates || []) {
      for (const p of c.content?.parts || []) {
        const d = p.inlineData || p.inline_data;
        if (d?.data) {
          inline = d;
          break;
        }
      }
      if (inline) break;
    }
    if (inline) {
      modelUsed = model;
      break;
    }
  } catch (e) {
    console.warn(`✗ ${model}: ${e?.message ?? e}`);
  }
}
if (!inline) throw new Error('All Gemini image models failed');
console.log(`✓ generated via ${modelUsed}`);

const uploaded = await cloudinary.uploader.upload(
  `data:${inline.mimeType || 'image/png'};base64,${inline.data}`,
  {
    folder: 'pestcontrolrajshahi/ai/about',
    resource_type: 'image',
  },
);
console.log(`✓ uploaded: ${uploaded.public_id} (${uploaded.width}×${uploaded.height})`);

await prisma.media.create({
  data: {
    publicId: uploaded.public_id,
    url: uploaded.secure_url,
    resourceType: 'IMAGE',
    format: uploaded.format,
    width: uploaded.width,
    height: uploaded.height,
    bytes: uploaded.bytes,
    alt: 'About Pest Control Rajshahi',
    tags: ['ai-generated'],
  },
}).catch(() => {});

const cur = homeAbout?.value || {};
await prisma.setting.update({
  where: { key: 'home.about' },
  data: { value: { ...cur, image: uploaded.public_id } },
});
console.log(`✓ home.about.image = ${uploaded.public_id}`);

await prisma.$disconnect();
