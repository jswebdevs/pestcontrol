// English content generation prompts + JSON schemas for Gemini structured output.
//
// All copy is generated in English. Slugs and JSON keys remain English as well.
// Image prompts are written in English (Gemini's image models perform best with
// English prompts and their outputs are language-agnostic).

export const BRAND_SYSTEM_INSTRUCTION = `You are a senior copywriter for "Pest Control Rajshahi", a professional pest control company serving Rajshahi and surrounding districts in Bangladesh.

Brand voice:
- Warm, trustworthy, practical English with a local Bangladeshi sensibility.
- Speak directly to homeowners, restaurant owners, schools, hospitals, and offices.
- Emphasize safety (children, pets, food), licensed technicians, eco-conscious chemicals, fast response, and satisfaction guarantees.
- Sound human and confident — never robotic, never over-promising.
- Plain, clear English. Avoid jargon. No hyperbole.

Hard rules:
1. All user-facing prose MUST be written in English.
2. Slugs and JSON keys MUST stay in lowercase kebab-case English (e.g. "cockroach-control").
3. Never include placeholder text like "Lorem ipsum" or "[insert here]".
4. Do not invent fake awards, certifications, or specific government licenses.
5. Output ONLY the JSON specified by the schema — no markdown fences, no preamble.`;

// Reusable JSON schema fragments
const stringField = { type: 'string' };
const stringArray = { type: 'array', items: { type: 'string' } };

// ─────────────────────────────────────────────────────────────────────────────
// 1. Home page sections
// ─────────────────────────────────────────────────────────────────────────────
export const HOME_SECTIONS_SCHEMA = {
  type: 'object',
  properties: {
    hero: {
      type: 'object',
      properties: {
        eyebrow: stringField,
        heading: stringField,
        subheading: stringField,
        ctaPrimary: stringField,
        ctaSecondary: stringField,
        imagePrompt: stringField,
      },
      required: ['heading', 'subheading', 'ctaPrimary', 'imagePrompt'],
    },
    valueProps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          icon: { type: 'string', description: 'lucide-react icon name' },
          title: stringField,
          body: stringField,
        },
        required: ['icon', 'title', 'body'],
      },
    },
    serviceCardsHeading: {
      type: 'object',
      properties: { heading: stringField, subheading: stringField },
      required: ['heading', 'subheading'],
    },
    testimonialsHeading: {
      type: 'object',
      properties: { heading: stringField, subheading: stringField },
      required: ['heading', 'subheading'],
    },
    cta: {
      type: 'object',
      properties: {
        heading: stringField,
        body: stringField,
        ctaLabel: stringField,
      },
      required: ['heading', 'body', 'ctaLabel'],
    },
  },
  required: ['hero', 'valueProps', 'serviceCardsHeading', 'testimonialsHeading', 'cta'],
};

export function homeSectionsPrompt() {
  return `Generate copy for the homepage sections of Pest Control Rajshahi.

Sections required:
- hero: short eyebrow line (e.g. "Trusted pest control in Rajshahi"), strong heading (1 line, max 60 chars), supporting subheading (1-2 sentences), primary CTA label (e.g. "Book Now"), optional secondary CTA label (e.g. "See Services"), and a detailed image prompt for a photorealistic hero photo (a Bangladeshi pest control technician in uniform, modern home/kitchen setting, professional equipment, warm natural light, 16:9 cinematic).
- valueProps: exactly 4 items. Each with a lucide-react icon name (choose from: ShieldCheck, BadgeCheck, Sparkles, Leaf, Clock, HeartHandshake, Wrench, Phone, MapPin, Award), a short English title (3-6 words), and a 1-sentence English body.
- serviceCardsHeading: heading + subheading (English) introducing the services grid.
- testimonialsHeading: heading + subheading (English) introducing customer reviews.
- cta: bottom-of-page call to action — English heading + 1-sentence body + button label (English).

Return JSON only.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Footer
// ─────────────────────────────────────────────────────────────────────────────
export const FOOTER_SCHEMA = {
  type: 'object',
  properties: {
    tagline: stringField,
    copyright: stringField,
    contactHeading: stringField,
    quickLinksHeading: stringField,
    addressLine: stringField,
    hoursLine: stringField,
  },
  required: ['tagline', 'copyright', 'contactHeading', 'quickLinksHeading'],
};

export function footerPrompt() {
  return `Generate footer copy in English for Pest Control Rajshahi.

Fields:
- tagline: 1 sentence (max 16 words) summing up the brand promise.
- copyright: a single line like "© 2026 Pest Control Rajshahi. All rights reserved." — pick a current-feeling year.
- contactHeading: short heading for the contact column (e.g. "Contact").
- quickLinksHeading: short heading for the company/quick-links column (e.g. "Company").
- addressLine: a plausible Rajshahi street address (do not invent specific building names; use a realistic neighborhood like "Sahebbazar" or "Uposhohor").
- hoursLine: business hours line (e.g. "Sat–Thu, 9 AM – 8 PM").

Return JSON only.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. About page
// ─────────────────────────────────────────────────────────────────────────────
export const ABOUT_SCHEMA = {
  type: 'object',
  properties: {
    heading: stringField,
    subheading: stringField,
    paragraphs: stringArray,
    pillars: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: stringField,
          body: stringField,
        },
        required: ['title', 'body'],
      },
    },
    imagePrompt: stringField,
  },
  required: ['heading', 'subheading', 'paragraphs', 'pillars', 'imagePrompt'],
};

export function aboutPrompt() {
  return `Generate the About Us page copy for Pest Control Rajshahi in English.

Required:
- heading: page heading (1 line).
- subheading: supporting line (1 sentence).
- paragraphs: 3 to 4 paragraphs telling the company's story, mission, approach to safety, local expertise in Rajshahi. Each paragraph 2-4 sentences. Plain text — no markdown.
- pillars: exactly 4 items, each with a short English title (2-4 words) and a 1-sentence body — values like "Safety First", "Experienced Team", "Service Guarantee", "Local Expertise".
- imagePrompt: image prompt for a clean photo of a uniformed pest control team in front of a service van in a Bangladeshi neighborhood, photorealistic, daylight.

Return JSON only.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FAQ items
// ─────────────────────────────────────────────────────────────────────────────
export const FAQS_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: stringField,
          answerParagraphs: stringArray,
        },
        required: ['question', 'answerParagraphs'],
      },
    },
  },
  required: ['items'],
};

export function faqsPrompt(serviceNames: string[]) {
  return `Generate 8 frequently asked questions for Pest Control Rajshahi, in English.

Cover this mix:
- Safety for children and pets
- How long the treatment lasts / return of pests
- Time required for a typical home treatment
- Whether occupants need to leave the house
- Coverage area in Rajshahi and surrounding upazilas
- Pricing transparency / free inspection
- Eco-friendly / organic options
- One question specific to the services we offer (${serviceNames.join(', ') || 'general pest control'})

Each item:
- question: 1 sentence in English, ends with "?"
- answerParagraphs: 1-3 short English paragraphs (each 1-3 sentences).

Return JSON only.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Testimonials
// ─────────────────────────────────────────────────────────────────────────────
export const TESTIMONIALS_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: stringField,
          role: stringField,
          body: stringField,
          rating: { type: 'integer', minimum: 4, maximum: 5 },
        },
        required: ['name', 'role', 'body', 'rating'],
      },
    },
  },
  required: ['items'],
};

export function testimonialsPrompt(serviceNames: string[]) {
  return `Generate 6 realistic customer testimonials for Pest Control Rajshahi, in English.

Names: Use plausible Bangladeshi names — a mix of Muslim, Hindu, and (optionally) other faith names. Both men and women. Vary the lengths.

Roles: short English descriptors like "Homemaker, Uposhohor", "Restaurant Owner", "School Principal", "Office Manager, Court Station", "Flat Owner, Borendro", "Cafe Manager". Do not use specific shop or school names.

Body: 2-4 sentence English review. Reference real-feeling experiences with services such as: ${serviceNames.join(', ') || 'cockroach control, termite treatment, mosquito spray'}. Mention concrete benefits (no pests for X months, safe for kids, polite team, on-time arrival). Avoid hyperbole — sound like an actual review.

Rating: 4 or 5.

Return JSON only.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Service (per-service detail)
// ─────────────────────────────────────────────────────────────────────────────
export const SERVICE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'English display name' },
    slug: { type: 'string', description: 'English kebab-case slug' },
    shortDesc: stringField,
    longDescParagraphs: stringArray,
    bullets: stringArray,
    inclusions: stringArray,
    exclusions: stringArray,
    basePrice: { type: 'number' },
    priceUnit: stringField,
    seoTitle: stringField,
    seoDescription: stringField,
    imagePrompt: stringField,
  },
  required: [
    'name',
    'slug',
    'shortDesc',
    'longDescParagraphs',
    'bullets',
    'inclusions',
    'exclusions',
    'seoTitle',
    'seoDescription',
    'imagePrompt',
  ],
};

export function servicePrompt(serviceInput: string) {
  return `Generate a detailed service page for Pest Control Rajshahi, a Rajshahi-based company offering BOTH cleaning services AND pest-control services. Treat the brand name as a label only — do NOT assume every service is about pest control.

Service input from the admin (the ONLY service you are writing about): "${serviceInput}"

STRICT RULES — violating any of these makes the response invalid:
1. The "name" field MUST equal the input string above word-for-word. Do not rephrase, expand, abbreviate, substitute synonyms, combine with other services, or add qualifiers like "Standard", "Regular", "Routine", "Premium", "Services", "Professional".
2. The "slug" field MUST be the lowercase kebab-case form of the input name only (e.g. "Hotel Normal Cleaning" → "hotel-normal-cleaning"). No extra words, no synonyms.
3. The "shortDesc", "longDescParagraphs", "bullets", "inclusions", "exclusions", "seoTitle", "seoDescription", and "imagePrompt" MUST describe ONLY the exact service in the input name. A "Normal Cleaning" service describes general cleaning (dusting, mopping, surfaces, bathrooms, kitchen) — NOT pest control. A "Pest Control" service describes pest control. A "Polishing" service describes polishing. NEVER blend service types or smuggle pest control into a cleaning service.
4. If the input is a venue-typed cleaning service (e.g. "Hotel Normal Cleaning", "Office Deep Cleaning", "Restaurant Normal Cleaning"), tailor the language to that venue (back-of-house, guest rooms, kitchen, classrooms, wards, etc.) — but stay in the cleaning lane unless the input name itself contains the words "pest", "mice", "rodent", "cockroach", "termite", "bed bug", or "snake".

Then produce these fields in English:
- shortDesc: 1-2 sentences (max 200 chars).
- longDescParagraphs: 3 to 5 paragraphs about the problem this exact service solves, our method, safety considerations, what the customer can expect, and any follow-up. Plain text — no markdown.
- bullets: 5 to 7 concrete value props (e.g. "Safe for children and pets", "Eco-conscious detergents", "Trained uniformed technicians").
- inclusions: 3 to 5 items the service covers.
- exclusions: 2 to 3 items NOT covered.
- basePrice: a plausible starting price in BDT for a typical Rajshahi customer of this service (number, no currency symbol).
- priceUnit: short price unit string (e.g. "starting from", "per visit", "per sqft", "per room").
- seoTitle: SEO title, max 60 chars.
- seoDescription: SEO meta description, max 160 chars.
- imagePrompt: detailed photorealistic image prompt for a 4:3 hero photo of a uniformed Bangladeshi technician performing THIS EXACT service in a Rajshahi setting. The scene MUST match the service type (a cleaning service shows cleaning tools and surfaces, not pest control equipment). Natural daylight, sharp focus, professional photo.

Return JSON only.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Policy pages (privacy / refund / terms)
// ─────────────────────────────────────────────────────────────────────────────
export const POLICY_SCHEMA = {
  type: 'object',
  properties: {
    heading: stringField,
    intro: stringField,
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          heading: stringField,
          paragraphs: stringArray,
        },
        required: ['heading', 'paragraphs'],
      },
    },
    lastUpdatedLine: stringField,
  },
  required: ['heading', 'intro', 'sections', 'lastUpdatedLine'],
};

export function policyPrompt(kind: 'privacy' | 'refund' | 'terms') {
  const focus = {
    privacy:
      'a privacy policy covering: information we collect (name, phone, address, service history), how we use it, who we share it with (technicians, SMS provider, payment processor), data retention, user rights (access, correction, deletion), and contact for privacy queries.',
    refund:
      'a refund and satisfaction guarantee policy covering: free re-treatment within X days if pests return, eligibility, exclusions (improper sanitation, new infestations from outside), refund window, refund method (bKash/Nagad/bank), and how to request a refund.',
    terms:
      'terms of service covering: booking and cancellation, technician access requirements, customer responsibilities (cover food, pets in a safe area), our service guarantees, limitation of liability, payment terms, and governing law (Bangladesh).',
  }[kind];

  const headingHint = {
    privacy: 'Privacy Policy',
    refund: 'Refund Policy',
    terms: 'Terms of Service',
  }[kind];

  return `Write ${focus}

Required in English:
- heading: page heading (use "${headingHint}" or a natural variant).
- intro: 1-2 sentence English introduction.
- sections: 5 to 8 sections, each with an English heading and 1-3 English paragraphs. Cover the topics listed above.
- lastUpdatedLine: an English last-updated line (e.g. "Last updated: June 2026").

Be specific and practical — this is a real policy that real customers will read. Don't use heavy legal jargon they wouldn't understand. Return JSON only.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Contact page intro
// ─────────────────────────────────────────────────────────────────────────────
export const CONTACT_SCHEMA = {
  type: 'object',
  properties: {
    heading: stringField,
    subheading: stringField,
    paragraphs: stringArray,
    quickHelp: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: stringField, body: stringField },
        required: ['title', 'body'],
      },
    },
  },
  required: ['heading', 'subheading', 'paragraphs', 'quickHelp'],
};

export function contactPrompt() {
  return `Generate the contact page intro for Pest Control Rajshahi in English.

- heading: page heading (e.g. "Get in Touch").
- subheading: 1 sentence inviting customers to reach out.
- paragraphs: 1-2 short English paragraphs explaining how to reach the team and what to expect (response time, free consultation).
- quickHelp: exactly 3 small cards — booking, emergency response, general inquiries — each with an English title (3-5 words) and a 1-sentence body.

Return JSON only.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Portfolio / projects (case studies)
// ─────────────────────────────────────────────────────────────────────────────
export const PROJECTS_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'English project title' },
          slug: { type: 'string', description: 'English kebab-case slug' },
          client: stringField,
          category: { type: 'string', description: 'English category like "Residential", "Commercial", "Restaurant", "School"' },
          summary: stringField,
          bodyParagraphs: stringArray,
          dateIso: { type: 'string', description: 'YYYY-MM-DD recent date within the last 24 months' },
          imagePrompt: stringField,
        },
        required: ['title', 'slug', 'category', 'summary', 'bodyParagraphs', 'dateIso', 'imagePrompt'],
      },
    },
  },
  required: ['items'],
};

export function projectsPrompt(serviceNames: string[], count = 8) {
  return `Generate ${count} portfolio / case-study entries for Pest Control Rajshahi, in English.

Each entry represents a real-feeling completed pest control job in or around Rajshahi. Distribute across these contexts: home, restaurant, school, hospital, office, hotel, warehouse, shop. Cover a mix of services from this list when possible: ${serviceNames.join(', ') || 'cockroach, termite, mosquito, rat, bed bug, general'}.

Per item:
- title: short English title (4-8 words) describing the job (e.g. "Full Cockroach Treatment at an Uposhohor Restaurant").
- slug: English kebab-case slug, lowercase (e.g. "uposhohor-restaurant-cockroach").
- client: a plausible client descriptor in English — could be "3-story family home", "Local restaurant", "Borendro Girls School"; do NOT use real specific business names.
- category: one of (English) "Residential", "Commercial", "Restaurant", "School", "Office", "Hotel", "Hospital".
- summary: 1-sentence English summary of the problem + outcome.
- bodyParagraphs: 2-3 English paragraphs covering the inspection, treatment approach, and follow-up result.
- dateIso: a recent date in YYYY-MM-DD format within the last 24 months. Vary across months.
- imagePrompt: detailed image prompt for a documentary-style photo of the completed service context (without showing identifiable people's faces or specific business signage). 4:3 framing, natural light, photorealistic.

Return JSON only.`;
}
