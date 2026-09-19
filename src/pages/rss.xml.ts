import rss from '@astrojs/rss';
import { getSiteContent } from '../lib/content';
import { site } from '../config/site';
export async function GET() {
  const { writing } = await getSiteContent();
  return rss({
    title: `${site.shortName}’s writing`, description: site.description, site: site.origin,
    items: writing.map((entry) => ({
      title: entry.data.title, description: entry.data.description,
      pubDate: entry.data.published!, link: `/writing/${entry.id}/`, categories: entry.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
}
