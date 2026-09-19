import { getCollection, type CollectionEntry } from 'astro:content';

export async function getSiteContent() {
  const [work, allWriting] = await Promise.all([getCollection('work'), getCollection('writing')]);
  const ids = { work: new Set(work.map((item) => item.id)), writing: new Set(allWriting.map((item) => item.id)) };
  for (const item of [...work, ...allWriting]) {
    for (const [collection, references] of [
      ['work', item.data.relatedWork], ['writing', item.data.relatedWriting],
    ] as const) {
      for (const id of references) {
        if (!ids[collection].has(id)) throw new Error(`${item.collection}/${item.id}: unresolved related ${collection} entry "${id}"`);
      }
    }
  }
  work.sort((a, b) => Number(b.data.featured) - Number(a.data.featured) || a.data.title.localeCompare(b.data.title, 'en'));
  const writing = allWriting.filter((item) => !item.data.draft).sort((a, b) =>
    b.data.published!.getTime() - a.data.published!.getTime() || a.id.localeCompare(b.id, 'en'));
  return { work, writing };
}

export function readingTime(body = '') {
  const words = body.replace(/```[\s\S]*?```/g, '').replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export async function relatedContent(entry: CollectionEntry<'work'> | CollectionEntry<'writing'>) {
  const content = await getSiteContent();
  return [
    ...content.work.filter((item) => entry.data.relatedWork.includes(item.id) && !(entry.collection === 'work' && entry.id === item.id))
      .map((item) => ({ title: item.data.title, href: `/work/${item.id}/`, kind: 'Project' })),
    ...content.writing.filter((item) => entry.data.relatedWriting.includes(item.id) && !(entry.collection === 'writing' && entry.id === item.id))
      .map((item) => ({ title: item.data.title, href: `/writing/${item.id}/`, kind: 'Writing' })),
  ];
}
