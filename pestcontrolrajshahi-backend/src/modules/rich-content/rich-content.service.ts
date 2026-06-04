import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';

// NOTE: @tiptap/* v3 packages are ESM-only and isomorphic-dompurify dual-publishes
// ESM/CJS in a way Vercel's bundler can't always require() cleanly. We resolve
// both via dynamic import() inside onModuleInit so the rest of the service
// stays synchronous after bootstrap.

const ALLOWED_NODES = new Set([
  'doc',
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'horizontalRule',
  'image',
  'video',
  'codeBlock',
  'callout',
  'twoColumn',
  'text',
  'hardBreak',
]);
const ALLOWED_MARKS = new Set(['bold', 'italic', 'underline', 'strike', 'code', 'link']);
const MAX_DEPTH = 8;

@Injectable()
export class RichContentService implements OnModuleInit {
  private generateHTML!: (doc: any, extensions: any[]) => string;
  private extensions!: any[];
  private purify!: { sanitize: (html: string, cfg?: any) => string };

  async onModuleInit(): Promise<void> {
    const [tiptapHtml, sk, img, lnk, und, dompurify] = await Promise.all([
      import('@tiptap/html'),
      import('@tiptap/starter-kit'),
      import('@tiptap/extension-image'),
      import('@tiptap/extension-link'),
      import('@tiptap/extension-underline'),
      import('isomorphic-dompurify'),
    ]);
    this.generateHTML = (tiptapHtml as any).generateHTML;
    this.extensions = [
      (sk as any).default ?? sk,
      (img as any).default ?? img,
      (lnk as any).default ?? lnk,
      (und as any).default ?? und,
    ];
    this.purify = (dompurify as any).default ?? dompurify;
  }

  validateDoc(doc: unknown, depth = 0): void {
    if (depth > MAX_DEPTH) throw new BadRequestException('Content too deeply nested');
    if (!doc || typeof doc !== 'object') {
      throw new BadRequestException('Invalid content');
    }
    const node: any = doc;
    if (depth === 0 && node.type !== 'doc') {
      throw new BadRequestException('Root must be a doc node');
    }
    if (typeof node.type !== 'string' || !ALLOWED_NODES.has(node.type)) {
      throw new BadRequestException(`Disallowed node: ${node.type}`);
    }
    if (Array.isArray(node.marks)) {
      for (const mark of node.marks) {
        if (!ALLOWED_MARKS.has(mark?.type)) {
          throw new BadRequestException(`Disallowed mark: ${mark?.type}`);
        }
        if (mark.type === 'link') {
          const href = mark?.attrs?.href ?? '';
          if (/^javascript:/i.test(href)) {
            throw new BadRequestException('Unsafe link href');
          }
        }
      }
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        this.validateDoc(child, depth + 1);
      }
    }
  }

  toHtml(doc: any): string {
    if (!doc) return '';
    try {
      const html = this.generateHTML(doc, this.extensions);
      return this.purify.sanitize(html, {
        ALLOWED_TAGS: [
          'p',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'br',
          'strong',
          'em',
          'u',
          's',
          'code',
          'pre',
          'blockquote',
          'ul',
          'ol',
          'li',
          'a',
          'img',
          'hr',
          'div',
          'span',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'rel', 'target', 'data-public-id'],
      });
    } catch {
      return '';
    }
  }

  /** Sanitize a fragment of HTML coming from anywhere user-influenced. */
  sanitizeHtml(html: string): string {
    return this.purify.sanitize(html);
  }
}
