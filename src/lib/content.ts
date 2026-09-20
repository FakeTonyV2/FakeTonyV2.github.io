import { getCollection, type CollectionEntry } from 'astro:content';

export async function getSiteContent() {
  const allWriting = await getCollection('writing');
  const writingIds = new Set(allWriting.map((item) => item.id));
  for (const item of allWriting) {
    for (const id of item.data.relatedWriting) {
      if (!writingIds.has(id)) {
        throw new Error(`${item.collection}/${item.id}: unresolved related writing entry "${id}"`);
      }
    }
  }
  const writing = allWriting.filter((item) => !item.data.draft).sort((a, b) =>
    b.data.published!.getTime() - a.data.published!.getTime() || a.id.localeCompare(b.id, 'en'));
  return { writing };
}

export function readingTime(body = '') {
  const words = body.replace(/```[\s\S]*?```/g, '').replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export async function relatedContent(entry: CollectionEntry<'writing'>) {
  const content = await getSiteContent();
  return content.writing
    .filter((item) => entry.data.relatedWriting.includes(item.id) && entry.id !== item.id)
    .map((item) => ({ title: item.data.title, href: `/writing/${item.id}/`, kind: 'Writing' }));
}
