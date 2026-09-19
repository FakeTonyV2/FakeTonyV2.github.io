export const site = {
  origin: 'https://faketonyv2.github.io',
  name: 'Mofiyinfoluwa Orekoya',
  shortName: 'Fiyin',
  description: 'Fiyin’s corner of the internet. Notes on systems, ML infrastructure, heterogeneous compute, and the things I build along the way.',
  email: 'fiyinorekoya001@gmail.com',
  github: 'https://github.com/FakeTonyV2',
  linkedin: 'https://www.linkedin.com/in/forekoyacs',
  resume: '/resume.pdf',
  updated: '2026-09-19',
  writingEmpty: "Nothing here yet. I'm working on the first few pieces.",
} as const;

export const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Work', href: '/work/' },
  { label: 'Writing', href: '/writing/' },
  { label: 'Now', href: '/now/' },
  { label: 'About', href: '/about/' },
];

export const contacts = [
  { label: 'GitHub', href: site.github },
  { label: 'LinkedIn', href: site.linkedin },
  { label: 'Résumé', href: site.resume },
  { label: 'Email', href: `mailto:${site.email}` },
];

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(value));
}
