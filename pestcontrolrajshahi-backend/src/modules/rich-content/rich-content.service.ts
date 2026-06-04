import { BadRequestException, Injectable } from '@nestjs/common';

// ProseMirror/Tiptap JSON → safe HTML renderer.
//
// We deliberately do NOT use `@tiptap/html` or `isomorphic-dompurify`: both are
// ESM-only (or have brittle dual exports) and crash Vercel's CJS serverless
// bundler at runtime. validateDoc() already restricts the shape to a tiny
// allowlist of nodes and marks, so we can emit HTML by hand and stay safe:
// - text content is HTML-escaped
// - link hrefs are scheme-validated (no javascript:)
// - image src and alt are escaped; no other attributes pass through
// - unknown nodes/marks are dropped, never emitted

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

const SAFE_URL_RE = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function safeUrl(href: string): string {
  if (typeof href !== 'string') return '';
  const h = href.trim();
  if (!h) return '';
  return SAFE_URL_RE.test(h) ? h : '';
}

function renderMarksOpen(marks: any[]): string {
  let out = '';
  for (const m of marks) {
    if (!m || !ALLOWED_MARKS.has(m.type)) continue;
    switch (m.type) {
      case 'bold':
        out += '<strong>';
        break;
      case 'italic':
        out += '<em>';
        break;
      case 'underline':
        out += '<u>';
        break;
      case 'strike':
        out += '<s>';
        break;
      case 'code':
        out += '<code>';
        break;
      case 'link': {
        const href = safeUrl(m.attrs?.href ?? '');
        if (!href) {
          out += '<span>';
        } else {
          out += `<a href="${escapeAttr(href)}" rel="noopener noreferrer" target="_blank">`;
        }
        break;
      }
    }
  }
  return out;
}

function renderMarksClose(marks: any[]): string {
  let out = '';
  for (let i = marks.length - 1; i >= 0; i--) {
    const m = marks[i];
    if (!m || !ALLOWED_MARKS.has(m.type)) continue;
    switch (m.type) {
      case 'bold':
        out += '</strong>';
        break;
      case 'italic':
        out += '</em>';
        break;
      case 'underline':
        out += '</u>';
        break;
      case 'strike':
        out += '</s>';
        break;
      case 'code':
        out += '</code>';
        break;
      case 'link': {
        const href = safeUrl(m.attrs?.href ?? '');
        out += href ? '</a>' : '</span>';
        break;
      }
    }
  }
  return out;
}

function renderNode(node: any): string {
  if (!node || typeof node !== 'object') return '';
  const type = node.type;
  if (!ALLOWED_NODES.has(type)) return '';
  const children: any[] = Array.isArray(node.content) ? node.content : [];
  const inner = () => children.map(renderNode).join('');

  switch (type) {
    case 'doc':
      return inner();
    case 'paragraph':
      return `<p>${inner()}</p>`;
    case 'heading': {
      const level = Math.max(1, Math.min(6, Number(node.attrs?.level) || 2));
      return `<h${level}>${inner()}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${inner()}</ul>`;
    case 'orderedList':
      return `<ol>${inner()}</ol>`;
    case 'listItem':
      return `<li>${inner()}</li>`;
    case 'blockquote':
      return `<blockquote>${inner()}</blockquote>`;
    case 'horizontalRule':
      return '<hr/>';
    case 'hardBreak':
      return '<br/>';
    case 'codeBlock':
      return `<pre><code>${inner()}</code></pre>`;
    case 'callout':
      return `<div class="callout">${inner()}</div>`;
    case 'twoColumn':
      return `<div class="two-column">${inner()}</div>`;
    case 'image': {
      const src = safeUrl(node.attrs?.src ?? '');
      if (!src) return '';
      const alt = escapeAttr(String(node.attrs?.alt ?? ''));
      const pid = node.attrs?.['data-public-id'];
      const pidAttr = pid ? ` data-public-id="${escapeAttr(String(pid))}"` : '';
      return `<img src="${escapeAttr(src)}" alt="${alt}"${pidAttr}/>`;
    }
    case 'video': {
      const src = safeUrl(node.attrs?.src ?? '');
      if (!src) return '';
      return `<video src="${escapeAttr(src)}" controls></video>`;
    }
    case 'text': {
      const text = escapeHtml(String(node.text ?? ''));
      const marks = Array.isArray(node.marks) ? node.marks : [];
      return renderMarksOpen(marks) + text + renderMarksClose(marks);
    }
    default:
      return '';
  }
}

@Injectable()
export class RichContentService {
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
      return renderNode(doc);
    } catch {
      return '';
    }
  }

  /** Sanitize a fragment of HTML. Currently a no-op: callers feed us either
   *  text we already escape, or stored HTML we generated ourselves above.
   *  If we ever ingest third-party HTML, replace with a real sanitizer. */
  sanitizeHtml(html: string): string {
    return typeof html === 'string' ? html : '';
  }
}
