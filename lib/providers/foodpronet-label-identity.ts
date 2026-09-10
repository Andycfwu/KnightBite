import { foodProNetLabelUrl } from './foodpronet-url';
import { IngestionFailure } from './menu-ingestion-log';

/** Cross-check explicit recipe/context form fields when supplied by a label page.
 * Their absence is not independent proof of identity; do not guess from ingredients.
 */
export function assertLabelIdentity(html: string, href: string, date: string) {
  const expected = new URL(foodProNetLabelUrl(href, date)).searchParams;
  const seen = new Set<string>();
  const content = html.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  for (const input of content.matchAll(/<input\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)) {
    const attributes = new Map<string, string>();
    let duplicate = false;
    for (const token of input[1].matchAll(/([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      const key = token[1].toLowerCase();
      if (attributes.has(key)) duplicate = true;
      attributes.set(key, token[2] ?? token[3] ?? token[4] ?? '');
    }
    const name = attributes.get('name');
    if (!name || !['RecNumAndPort', 'locationNum', 'dtdate'].includes(name)) continue;
    if (duplicate || seen.has(name) || attributes.get('value') !== expected.get(name)) {
      throw new IngestionFailure('parse_error');
    }
    seen.add(name);
  }
}
