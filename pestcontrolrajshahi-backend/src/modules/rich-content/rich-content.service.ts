import { BadRequestException, Injectable } from '@nestjs/common';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import DOMPurify from 'isomorphic-dompurify';

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
      const html = generateHTML(doc, [StarterKit, Image, Link, Underline]);
      return DOMPurify.sanitize(html, {
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
    return DOMPurify.sanitize(html);
  }
}
