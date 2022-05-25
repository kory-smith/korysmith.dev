import { initSeo } from 'remix-seo'

export const { getSeo, getSeoLinks, getSeoMeta } = initSeo({
  title: 'KorySmith.dev',
  description: "Kory Smith's development playground and portfolio site",
  twitter: {
    card: 'summary',
    creator: '@Kor54e',
    site: 'https://korysmith.dev/',
    title: 'KorySmith.dev',
    description: "Kory Smith's development playground and portfolio site",
  },
})
