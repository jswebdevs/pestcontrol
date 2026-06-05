import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { ContentStatus, Prisma } from '@prisma/client';
import slugify from 'slugify';

import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import {
  ABOUT_SCHEMA,
  aboutPrompt,
  BRAND_SYSTEM_INSTRUCTION,
  CONTACT_SCHEMA,
  contactPrompt,
  FAQS_SCHEMA,
  faqsPrompt,
  FOOTER_SCHEMA,
  footerPrompt,
  HOME_SECTIONS_SCHEMA,
  homeSectionsPrompt,
  POLICY_SCHEMA,
  policyPrompt,
  PROJECTS_SCHEMA,
  projectsPrompt,
  SERVICE_SCHEMA,
  servicePrompt,
  TESTIMONIALS_SCHEMA,
  testimonialsPrompt,
} from './prompts';

export interface ServiceCategoryInput {
  slug: string;
  name: string;
  icon?: string;
  order?: number;
}

export interface ServicePayload {
  /** Slug of the target category. Resolved against payload.categories[].slug,
   *  or upserts a stub category if no match is found. */
  categorySlug?: string;
  name: string;
  slug: string;
  shortDesc: string;
  longDescParagraphs: string[];
  bullets: string[];
  inclusions: string[];
  exclusions: string[];
  basePrice?: number;
  priceUnit?: string;
  seoTitle?: string;
  seoDescription?: string;
  imagePrompt: string;
  imageUrl?: string;
  imagePublicId?: string;
}

export interface ProjectPayload {
  title: string;
  slug: string;
  client?: string;
  category?: string;
  summary: string;
  bodyParagraphs: string[];
  dateIso?: string;
  imagePrompt: string;
  imageUrl?: string;
  imagePublicId?: string;
}

export interface ApplyPayload {
  home?: any;
  footer?: any;
  about?: any;
  contact?: any;
  faqs?: { items: Array<{ question: string; answerParagraphs: string[] }> };
  testimonials?: { items: Array<{ name: string; role?: string; body: string; rating: number }> };
  policies?: {
    privacy?: any;
    refund?: any;
    terms?: any;
  };
  services?: ServicePayload[];
  projects?: ProjectPayload[];
  /** Optional category catalog — upserted before services so they can reference
   *  categories by slug. If a service has a categorySlug not in this list,
   *  apply() upserts a stub category with that slug. */
  categories?: ServiceCategoryInput[];
  /** When true, soft-delete all current services + projects before applying. */
  wipeContent?: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: config.get<string>('cloudinary.cloudName'),
      api_key: config.get<string>('cloudinary.apiKey'),
      api_secret: config.get<string>('cloudinary.apiSecret'),
      secure: true,
    });
  }

  // ─── Text section generators ──────────────────────────────────────────────
  generateHome() {
    return this.gemini.generateText({
      prompt: homeSectionsPrompt(),
      schema: HOME_SECTIONS_SCHEMA,
      systemInstruction: BRAND_SYSTEM_INSTRUCTION,
    });
  }

  generateFooter() {
    return this.gemini.generateText({
      prompt: footerPrompt(),
      schema: FOOTER_SCHEMA,
      systemInstruction: BRAND_SYSTEM_INSTRUCTION,
    });
  }

  generateAbout() {
    return this.gemini.generateText({
      prompt: aboutPrompt(),
      schema: ABOUT_SCHEMA,
      systemInstruction: BRAND_SYSTEM_INSTRUCTION,
    });
  }

  generateContact() {
    return this.gemini.generateText({
      prompt: contactPrompt(),
      schema: CONTACT_SCHEMA,
      systemInstruction: BRAND_SYSTEM_INSTRUCTION,
    });
  }

  generateFaqs(serviceNames: string[]) {
    return this.gemini.generateText({
      prompt: faqsPrompt(serviceNames),
      schema: FAQS_SCHEMA,
      systemInstruction: BRAND_SYSTEM_INSTRUCTION,
    });
  }

  generateTestimonials(serviceNames: string[]) {
    return this.gemini.generateText({
      prompt: testimonialsPrompt(serviceNames),
      schema: TESTIMONIALS_SCHEMA,
      systemInstruction: BRAND_SYSTEM_INSTRUCTION,
    });
  }

  generateProjects(serviceNames: string[], count = 8) {
    return this.gemini.generateText({
      prompt: projectsPrompt(serviceNames, count),
      schema: PROJECTS_SCHEMA,
      systemInstruction: BRAND_SYSTEM_INSTRUCTION,
    });
  }

  generatePolicy(kind: 'privacy' | 'refund' | 'terms') {
    return this.gemini.generateText({
      prompt: policyPrompt(kind),
      schema: POLICY_SCHEMA,
      systemInstruction: BRAND_SYSTEM_INSTRUCTION,
    });
  }

  async generateService(input: string): Promise<{ data: ServicePayload; modelUsed: string }> {
    const result = await this.gemini.generateText<ServicePayload>({
      prompt: servicePrompt(input),
      schema: SERVICE_SCHEMA,
      systemInstruction: BRAND_SYSTEM_INSTRUCTION,
    });
    // Normalize slug
    result.data.slug = slugify(result.data.slug || result.data.name, {
      lower: true,
      strict: true,
    });
    return { data: result.data, modelUsed: result.modelUsed };
  }

  // ─── Image generation → Cloudinary ────────────────────────────────────────
  async generateAndUploadImage(opts: {
    prompt: string;
    folderTag?: string;
    alt?: string;
  }): Promise<{ publicId: string; url: string; alt?: string }> {
    const img = await this.gemini.generateImage(opts.prompt);
    const baseFolder =
      this.config.get<string>('cloudinary.folder') || 'uploads';
    const folder = `${baseFolder}/ai${opts.folderTag ? '/' + slugify(opts.folderTag, { lower: true, strict: true }) : ''}`;

    const dataUri = `data:${img.mimeType};base64,${img.base64}`;
    const uploaded: any = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
      // Cloudinary auto-derives format from mime; let it.
    });

    // Mirror the existing media flow by also persisting a Media row so the
    // image shows up in MediaPicker.
    try {
      await this.prisma.media.create({
        data: {
          publicId: uploaded.public_id,
          url: uploaded.secure_url,
          resourceType: 'IMAGE',
          format: uploaded.format,
          width: uploaded.width,
          height: uploaded.height,
          bytes: uploaded.bytes,
          alt: opts.alt || null,
          tags: ['ai-generated'],
        },
      });
    } catch (e: any) {
      // Non-fatal — image still uploaded; just won't appear in the picker until refresh.
      this.logger.warn(`Media row insert skipped: ${e?.message ?? e}`);
    }

    return {
      publicId: uploaded.public_id,
      url: uploaded.secure_url,
      alt: opts.alt,
    };
  }

  // ─── Apply payload to DB ──────────────────────────────────────────────────
  async apply(payload: ApplyPayload) {
    const summary: Record<string, any> = {};

    // Optionally wipe stale content from a previous brand or seed.
    if (payload.wipeContent) {
      const svcRes = await this.prisma.service.updateMany({
        where: { deletedAt: null },
        data: { deletedAt: new Date() },
      });
      const prjRes = await this.prisma.project.updateMany({
        where: { deletedAt: null },
        data: { deletedAt: new Date() },
      });
      summary.servicesWiped = svcRes.count;
      summary.projectsWiped = prjRes.count;
    }

    // Settings — map AI-generated shapes into the SAME key+shape contracts that
    // the existing public templates read from (`src/app/(public)/page.tsx`,
    // `Hero.tsx`, `Sections.tsx`). Otherwise the data lands in the DB but the
    // templates ignore it and the user sees the old seed copy.
    const settingsPatches: Array<{ key: string; value: any }> = [];
    if (payload.home) {
      const hero = payload.home.hero || {};
      settingsPatches.push({
        key: 'home.hero',
        value: {
          slides: [
            {
              headline: hero.heading,
              sub: hero.subheading,
              eyebrow: hero.eyebrow,
              cta: { label: hero.ctaPrimary, href: '/services' },
              image: hero.imagePublicId, // CldImage takes a publicId
            },
          ],
        },
      });
      // Reuse valueProps for both the top trust-badge strip AND the
      // why-choose-us grid (same source of truth, two presentations).
      const props = Array.isArray(payload.home.valueProps) ? payload.home.valueProps : [];
      settingsPatches.push({
        key: 'home.trustBadges',
        value: { badges: props.map((v: any) => ({ icon: v.icon, label: v.title })) },
      });
      settingsPatches.push({
        key: 'home.whyChooseUs',
        value: {
          title: 'Why choose us',
          points: props.map((v: any) => ({ icon: v.icon, title: v.title, desc: v.body })),
        },
      });
      const cards = payload.home.serviceCardsHeading || {};
      settingsPatches.push({
        key: 'home.serviceCards',
        value: { title: cards.heading, sub: cards.subheading },
      });
      const tHead = payload.home.testimonialsHeading || {};
      settingsPatches.push({
        key: 'home.testimonials',
        value: { title: tHead.heading, sub: tHead.subheading },
      });
      const cta = payload.home.cta || {};
      settingsPatches.push({
        key: 'home.finalCta',
        value: {
          title: cta.heading,
          sub: cta.body,
          cta: { label: cta.ctaLabel },
        },
      });
      // Static "how it works" steps — the AI doesn't generate these, so we
      // seed reasonable defaults so the section isn't empty.
      settingsPatches.push({
        key: 'home.howItWorks',
        value: {
          title: 'How it works',
          steps: [
            { icon: 'Phone', title: 'Contact us', desc: 'Reach out for a free inspection and quote.' },
            { icon: 'ClipboardList', title: 'Get a plan', desc: 'We assess and design a treatment plan for your space.' },
            { icon: 'Wrench', title: 'Treatment', desc: 'Our licensed technicians treat your home or business.' },
            { icon: 'ShieldCheck', title: 'Follow-up', desc: 'We come back to ensure pests stay gone.' },
          ],
        },
      });
    }

    if (payload.about) {
      // home.about template wants {title, body: TipTap doc, image, stats}
      const a = payload.about;
      settingsPatches.push({
        key: 'home.about',
        value: {
          title: a.heading,
          body: this.paragraphsToDoc(a.paragraphs || []),
          image: a.imagePublicId,
          stats: (a.pillars || []).slice(0, 3).map((p: any) => ({ value: p.title, label: p.body?.slice(0, 30) })),
        },
      });
      // Also store the full about page payload for the standalone /about route.
      settingsPatches.push({ key: 'page.about', value: a });
    }

    if (payload.footer) {
      // /contact + Footer read {phone, email, address, hours, tagline, copyright, socials}.
      // AI fills only the blanks — never overwrites user-set values (phone, email,
      // socials, and any address/hours the user has edited via the admin Settings page).
      const existing = await this.prisma.setting.findUnique({
        where: { key: 'footer.contact' },
      });
      const cur: any = (existing?.value as any) || {};
      const fillIfBlank = (existing: any, generated: any) =>
        existing && String(existing).trim() ? existing : generated;
      settingsPatches.push({
        key: 'footer.contact',
        value: {
          ...cur,
          address: fillIfBlank(cur.address, payload.footer.addressLine),
          hours: fillIfBlank(cur.hours, payload.footer.hoursLine),
          tagline: fillIfBlank(cur.tagline, payload.footer.tagline),
          copyright: fillIfBlank(cur.copyright, payload.footer.copyright),
        },
      });
    }
    if (payload.contact) settingsPatches.push({ key: 'page.contact', value: payload.contact });
    if (payload.policies?.privacy)
      settingsPatches.push({ key: 'legal.privacy', value: payload.policies.privacy });
    if (payload.policies?.refund)
      settingsPatches.push({ key: 'legal.refund', value: payload.policies.refund });
    if (payload.policies?.terms)
      settingsPatches.push({ key: 'legal.terms', value: payload.policies.terms });

    for (const patch of settingsPatches) {
      await this.prisma.setting.upsert({
        where: { key: patch.key },
        update: { value: patch.value },
        create: { key: patch.key, value: patch.value },
      });
    }
    summary.settingsUpdated = settingsPatches.length;

    // FAQs — replace all visible AI-tagged FAQs to avoid duplication
    if (payload.faqs?.items?.length) {
      await this.prisma.faq.deleteMany({ where: { category: 'ai' } });
      let order = 0;
      for (const item of payload.faqs.items) {
        await this.prisma.faq.create({
          data: {
            question: item.question,
            answer: this.paragraphsToDoc(item.answerParagraphs),
            category: 'ai',
            order: order++,
          },
        });
      }
      summary.faqsCreated = payload.faqs.items.length;
    }

    // Testimonials — append (don't wipe existing)
    if (payload.testimonials?.items?.length) {
      let order = 100;
      for (const t of payload.testimonials.items) {
        await this.prisma.testimonial.create({
          data: {
            name: t.name,
            role: t.role || null,
            rating: Math.max(1, Math.min(5, t.rating || 5)),
            body: t.body,
            order: order++,
          },
        });
      }
      summary.testimonialsCreated = payload.testimonials.items.length;
    }

    // Categories — upsert the provided catalog first so services can reference them.
    const catBySlug = new Map<string, string>();
    if (payload.categories?.length) {
      for (const c of payload.categories) {
        const slug = slugify(c.slug || c.name, { lower: true, strict: true });
        const row = await this.prisma.serviceCategory.upsert({
          where: { slug },
          update: { name: c.name, icon: c.icon, order: c.order ?? 0, isVisible: true },
          create: { slug, name: c.name, icon: c.icon, order: c.order ?? 0, isVisible: true },
        });
        catBySlug.set(slug, row.id);
      }
      summary.categoriesUpserted = payload.categories.length;
    }

    // Services
    if (payload.services?.length) {
      // Fallback general category for services without a categorySlug
      let defaultCatId = catBySlug.get('general');
      if (!defaultCatId) {
        const fallback = await this.prisma.serviceCategory.upsert({
          where: { slug: 'general' },
          update: {},
          create: { slug: 'general', name: 'General Services', order: 99, isVisible: true },
        });
        defaultCatId = fallback.id;
        catBySlug.set('general', defaultCatId);
      }
      let order = 0;
      const createdSlugs: string[] = [];
      for (const s of payload.services) {
        const slug = slugify(s.slug || s.name, { lower: true, strict: true });
        // Resolve category — payload.categories[] takes priority; if a service
        // references an unknown slug, upsert a stub so DB stays consistent.
        let categoryId = defaultCatId;
        if (s.categorySlug) {
          const catSlug = slugify(s.categorySlug, { lower: true, strict: true });
          let resolved = catBySlug.get(catSlug);
          if (!resolved) {
            const stub = await this.prisma.serviceCategory.upsert({
              where: { slug: catSlug },
              update: {},
              create: { slug: catSlug, name: catSlug.replace(/-/g, ' '), order: 50, isVisible: true },
            });
            resolved = stub.id;
            catBySlug.set(catSlug, resolved);
          }
          categoryId = resolved;
        }
        const existing = await this.prisma.service.findUnique({ where: { slug } });
        const doc = this.serviceDoc(s);
        const data = {
          name: s.name,
          slug,
          categoryId,
          shortDesc: s.shortDesc,
          longDesc: doc,
          image: s.imageUrl || null,
          gallery: [],
          basePrice: s.basePrice ? new Prisma.Decimal(s.basePrice) : null,
          priceUnit: s.priceUnit || null,
          featured: order < 6,
          status: 'PUBLISHED' as ContentStatus,
          publishedAt: new Date(),
          // Reactivate if a previous wipe (or a manual delete) marked the row.
          deletedAt: null,
          order: order++,
          inclusions: s.inclusions || [],
          exclusions: s.exclusions || [],
          seoTitle: s.seoTitle || null,
          seoDescription: s.seoDescription || null,
          seoImage: s.imageUrl || null,
        };
        if (existing) {
          await this.prisma.service.update({ where: { id: existing.id }, data });
        } else {
          await this.prisma.service.create({ data });
        }
        createdSlugs.push(slug);
      }
      summary.servicesCreated = createdSlugs.length;
      summary.serviceSlugs = createdSlugs;
    }

    // Projects (portfolio)
    if (payload.projects?.length) {
      let order = 0;
      const created: string[] = [];
      for (const p of payload.projects) {
        const slug = slugify(p.slug || p.title, { lower: true, strict: true });
        const existing = await this.prisma.project.findUnique({ where: { slug } });
        const data: any = {
          title: p.title,
          slug,
          client: p.client || null,
          category: p.category || null,
          summary: p.summary,
          body: this.paragraphsToDoc(p.bodyParagraphs),
          cover: p.imageUrl || null,
          gallery: [],
          date: p.dateIso ? new Date(p.dateIso) : null,
          status: 'PUBLISHED' as ContentStatus,
          publishedAt: new Date(),
          // Reactivate if a previous wipe (or a manual delete) marked the row.
          deletedAt: null,
          order: order++,
          seoImage: p.imageUrl || null,
        };
        if (existing) {
          await this.prisma.project.update({ where: { id: existing.id }, data });
        } else {
          await this.prisma.project.create({ data });
        }
        created.push(slug);
      }
      summary.projectsCreated = created.length;
      summary.projectSlugs = created;
    }

    return { success: true, summary };
  }

  // ─── helpers ──────────────────────────────────────────────────────────────
  /** Convert array of plain paragraphs to a TipTap/ProseMirror doc shape. */
  private paragraphsToDoc(paragraphs: string[]): any {
    const content = (paragraphs || [])
      .map((p) => String(p || '').trim())
      .filter(Boolean)
      .map((p) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: p }],
      }));
    return { type: 'doc', content };
  }

  private serviceDoc(s: ServicePayload): any {
    const content: any[] = (s.longDescParagraphs || []).map((p) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: String(p) }],
    }));
    if (s.bullets?.length) {
      content.push({
        type: 'bulletList',
        content: s.bullets.map((b) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: String(b) }] }],
        })),
      });
    }
    return { type: 'doc', content };
  }
}
