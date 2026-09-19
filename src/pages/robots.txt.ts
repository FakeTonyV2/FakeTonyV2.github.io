import { site } from '../config/site';
export function GET() {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
