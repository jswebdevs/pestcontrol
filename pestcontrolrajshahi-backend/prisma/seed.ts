import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const docFromText = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const categories = [
  { slug: 'general-cleaning', name: 'General Cleaning', icon: 'sparkles', order: 1 },
  { slug: 'deep-cleaning', name: 'Deep Cleaning', icon: 'wand-2', order: 2 },
  { slug: 'furnishings', name: 'Carpet, Sofa & Tile', icon: 'sofa', order: 3 },
  { slug: 'polishing', name: 'Marble & Brass Polishing', icon: 'gem', order: 4 },
  { slug: 'pest-control', name: 'Pest Control', icon: 'bug', order: 5 },
  { slug: 'specialty', name: 'Specialty Cleaning', icon: 'shield-check', order: 6 },
];

const services = [
  { categorySlug: 'general-cleaning', slug: 'home-general', name: 'Home General Cleaning', priceUnit: 'per visit', basePrice: 1500, shortDesc: 'Full home sweep — kitchen, bath, living rooms.', featured: true },
  { categorySlug: 'general-cleaning', slug: 'office-general', name: 'Office General Cleaning', priceUnit: 'per sqft', basePrice: 5, shortDesc: 'Daily/weekly office cleaning packages.' },
  { categorySlug: 'general-cleaning', slug: 'restaurant-general', name: 'Restaurant General Cleaning', priceUnit: 'per visit', basePrice: 2500, shortDesc: 'Kitchen-grade cleaning for restaurants.' },
  { categorySlug: 'general-cleaning', slug: 'clinic-general', name: 'Clinic General Cleaning', priceUnit: 'per visit', basePrice: 2000, shortDesc: 'Hospital-safe sanitization for clinics.' },
  { categorySlug: 'general-cleaning', slug: 'school-general', name: 'School General Cleaning', priceUnit: 'per visit', basePrice: 3500, shortDesc: 'Classroom & corridor cleaning.' },
  { categorySlug: 'general-cleaning', slug: 'college-general', name: 'College General Cleaning', priceUnit: 'per visit', basePrice: 4500, shortDesc: 'Campus-scale cleaning packages.' },
  { categorySlug: 'general-cleaning', slug: 'hospital-general', name: 'Hospital General Cleaning', priceUnit: 'per visit', basePrice: 5500, shortDesc: 'Strict hospital hygiene protocols.' },
  { categorySlug: 'general-cleaning', slug: 'hotel-general', name: 'Hotel General Cleaning', priceUnit: 'per visit', basePrice: 4500, shortDesc: 'Front-of-house & guest area cleaning.' },
  { categorySlug: 'deep-cleaning', slug: 'home-deep', name: 'Home Deep Cleaning', priceUnit: 'per visit', basePrice: 3500, shortDesc: 'Top-to-bottom deep clean including hidden corners.', featured: true },
  { categorySlug: 'deep-cleaning', slug: 'office-deep', name: 'Office Deep Cleaning', priceUnit: 'per sqft', basePrice: 10, shortDesc: 'Carpet shampoo, sanitization, glass.' },
  { categorySlug: 'deep-cleaning', slug: 'hotel-deep', name: 'Hotel Deep Cleaning', priceUnit: 'per room', basePrice: 1200, shortDesc: 'Room-by-room deep cleaning.' },
  { categorySlug: 'furnishings', slug: 'carpet-cleaning', name: 'Carpet Cleaning', priceUnit: 'per sqft', basePrice: 15, shortDesc: 'Stain removal & deep wash for carpets.' },
  { categorySlug: 'furnishings', slug: 'sofa-cleaning', name: 'Sofa Cleaning', priceUnit: 'per seat', basePrice: 350, shortDesc: 'Fabric/leather sofa shampoo.', featured: true },
  { categorySlug: 'furnishings', slug: 'tile-cleaning', name: 'Tile / Floor Cleaning', priceUnit: 'per sqft', basePrice: 8, shortDesc: 'Grout-deep tile restoration.' },
  { categorySlug: 'polishing', slug: 'marble-polishing', name: 'Marble Polishing', priceUnit: 'per sqft', basePrice: 35, shortDesc: 'Restore shine to marble floors.' },
  { categorySlug: 'polishing', slug: 'brass-polishing', name: 'Pitol (Brass) Polishing', priceUnit: 'per piece', basePrice: 250, shortDesc: 'Bring back the gleam to brass fittings.' },
  { categorySlug: 'pest-control', slug: 'mice-control', name: 'Mice / Rodent Control', priceUnit: 'per visit', basePrice: 1800, shortDesc: 'Licensed rodent control with chemical safety.', featured: true },
  { categorySlug: 'pest-control', slug: 'cockroach-control', name: 'Cockroach Control', priceUnit: 'per visit', basePrice: 1500, shortDesc: 'Targeted cockroach elimination & prevention.' },
  { categorySlug: 'pest-control', slug: 'bedbug-control', name: 'Bed Bug Control', priceUnit: 'per room', basePrice: 1200, shortDesc: 'Heat + chemical bed bug treatment.' },
  { categorySlug: 'specialty', slug: 'window-glass-cleaning', name: 'Window Glass Cleaning', priceUnit: 'per sqft', basePrice: 12, shortDesc: 'Streak-free glass cleaning indoors & out.' },
  { categorySlug: 'specialty', slug: 'water-tank-cleaning', name: 'Water Tank Cleaning', priceUnit: 'per tank', basePrice: 2500, shortDesc: 'Drain, scrub, sanitize water tanks.' },
];

const theme = {
  colors: {
    primary: '150 60% 35%',
    primaryForeground: '0 0% 100%',
    secondary: '150 30% 95%',
    secondaryForeground: '150 60% 15%',
    accent: '25 95% 55%',
    accentForeground: '0 0% 100%',
    background: '0 0% 100%',
    foreground: '150 30% 12%',
    muted: '150 20% 96%',
    mutedForeground: '150 10% 45%',
    card: '0 0% 100%',
    cardForeground: '150 30% 12%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',
    border: '150 15% 88%',
    input: '150 15% 88%',
    ring: '150 60% 35%',
  },
  typography: { headingFont: 'Plus Jakarta Sans', bodyFont: 'Inter', radius: 12 },
};

const settings = {
  'home.header': {
    logo: '',
    topBar: { phone: '+880 1700-000001', text: 'Licensed pest control · Eco-safe chemicals' },
    nav: [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/services' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  'home.hero': {
    slides: [
      {
        image: '',
        headline: 'Cleaning & pest control done right',
        sub: 'Licensed technicians. Eco-safe chemicals. Same-day service across Rajshahi.',
        cta: { label: 'Get a quote', href: '/order' },
      },
      {
        image: '',
        headline: 'Deep cleaning for homes, offices, hospitals',
        sub: 'Hospital-grade sanitization with environmentally friendly products.',
        cta: { label: 'Browse services', href: '/services' },
      },
    ],
  },
  'home.about': {
    title: 'Rajshahi’s most trusted cleaning & pest control',
    body: docFromText(
      'For over a decade, Pest Control Rajshahi has kept homes, hotels and offices clean and pest-free. Licensed technicians, eco-safe chemicals, transparent pricing.',
    ),
    image: '',
    stats: [
      { label: 'Properties served', value: '3.8k+' },
      { label: 'Trained technicians', value: '24' },
      { label: 'Years operating', value: '11' },
    ],
  },
  'home.trustBadges': {
    badges: [
      { icon: 'shield-check', label: 'Licensed' },
      { icon: 'leaf', label: 'Eco-safe chemicals' },
      { icon: 'graduation-cap', label: 'Trained technicians' },
      { icon: 'clock', label: 'Same-day service' },
    ],
  },
  'home.serviceCards': { title: 'Our Services', sub: 'From routine cleaning to licensed pest control.', mode: 'featured' },
  'home.howItWorks': {
    title: 'How it works',
    steps: [
      { icon: 'search', title: 'Inspect', desc: 'We assess your site to scope the work.' },
      { icon: 'file-text', title: 'Quote', desc: 'Transparent pricing — no surprises.' },
      { icon: 'sparkles', title: 'Treat', desc: 'Trained technicians, eco-safe chemicals.' },
      { icon: 'check-circle', title: 'Follow-up', desc: 'Free re-treatment within guarantee window.' },
    ],
  },
  'home.whyChooseUs': {
    title: 'Why Pest Control Rajshahi',
    points: [
      { icon: 'shield-check', title: 'Licensed & insured', desc: 'Fully compliant chemical handling.' },
      { icon: 'leaf', title: 'Eco-safe products', desc: 'Pet and child-safe formulations.' },
      { icon: 'badge-check', title: 'Service guarantee', desc: 'Not satisfied? We re-treat for free.' },
      { icon: 'clock', title: 'Same-day available', desc: 'Urgent jobs handled fast.' },
    ],
  },
  'home.testimonials': { title: 'Trusted across Rajshahi', mode: 'featured' },
  'home.projects': { title: 'Recent work', mode: 'latest', limit: 6 },
  'home.finalCta': {
    title: 'Ready for a clean, pest-free space?',
    sub: 'Free inspection. Transparent pricing. Eco-safe service.',
    cta: { label: 'Book inspection', href: '/order' },
    background: '',
  },
  'footer.contact': {
    phone: '+880 1700-000001',
    email: 'hello@pestcontrolrajshahi.com',
    address: 'Shaheb Bazar, Rajshahi, Bangladesh',
    hours: 'Sat–Thu · 8:00 AM – 9:00 PM',
    socials: [
      { icon: 'facebook', href: 'https://facebook.com' },
      { icon: 'instagram', href: 'https://instagram.com' },
    ],
  },
  'footer.columns': {
    columns: [
      { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }] },
      { title: 'Services', links: [{ label: 'All services', href: '/services' }, { label: 'Book', href: '/order' }] },
      { title: 'Legal', links: [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }] },
    ],
  },
  'seo.default': {
    title: 'Pest Control Rajshahi — Licensed cleaning & pest control',
    description: 'Deep cleaning, pest control, polishing, water tank cleaning. Licensed technicians, eco-safe chemicals.',
    ogImage: '',
  },
  'business.info': { name: 'Pest Control Rajshahi', license: 'DG-Health #RAJ-PC-0042', established: '2014' },
  'theme.colors': theme.colors,
  'theme.typography': theme.typography,
  'legal.privacy': docFromText('Privacy policy content — edit me in the admin Settings → Legal tab.'),
  'legal.terms': docFromText('Terms & conditions content — edit me in the admin Settings → Legal tab.'),
};

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL!;
  const adminPhone = process.env.SEED_ADMIN_PHONE!;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD!;
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: 'SUPER_ADMIN', status: 'ACTIVE' },
    create: {
      name: 'Site Admin',
      email: adminEmail,
      phone: adminPhone,
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  for (const c of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, order: c.order },
      create: { slug: c.slug, name: c.name, icon: c.icon, order: c.order },
    });
  }
  const allCats = await prisma.serviceCategory.findMany();
  const catBySlug = Object.fromEntries(allCats.map((c) => [c.slug, c]));

  for (const s of services) {
    const cat = catBySlug[s.categorySlug];
    if (!cat) continue;
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        shortDesc: s.shortDesc,
        priceUnit: s.priceUnit,
        basePrice: s.basePrice as any,
        featured: s.featured ?? false,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      create: {
        slug: s.slug,
        name: s.name,
        categoryId: cat.id,
        shortDesc: s.shortDesc,
        longDesc: docFromText(s.shortDesc),
        priceUnit: s.priceUnit,
        basePrice: s.basePrice as any,
        featured: s.featured ?? false,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  await prisma.testimonial.create({ data: { name: 'Rashed K.', role: 'Hotel manager', rating: 5, body: 'They keep our property pest-free year-round. Trusted partner.' } }).catch(() => null);
  await prisma.testimonial.create({ data: { name: 'Nazia I.', role: 'Homeowner', rating: 5, body: 'Eco-safe and very professional. Highly recommend.' } }).catch(() => null);

  await prisma.faq.create({
    data: {
      question: 'Are your chemicals safe for kids and pets?',
      answer: docFromText('Yes — we use eco-safe, low-toxicity formulations. Reentry time is typically 2 hours.'),
    },
  }).catch(() => null);
  await prisma.faq.create({
    data: {
      question: 'Do you offer a service guarantee?',
      answer: docFromText('Yes — free re-treatment within 14 days for pest control jobs.'),
    },
  }).catch(() => null);

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    });
  }
  console.log('✅ Seed complete');
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
