import { createClient } from '@sanity/client'
import { toPlainText } from '@portabletext/react'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

export default async function handler(req, res) {
  const { slug, lang = 'en' } = req.query

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' })
  }

  try {
    const query = `*[_type == "post" && slug.current == $slug][0] {
      _id,
      "title": title.${lang},
      "excerpt": excerpt.${lang},
      "slug": slug.current,
      mainImage {
        asset->{
          _id,
          url
        },
        alt
      },
      "body": body.${lang},
      "tags": tags[]->{ 
        "name": name.${lang},
        "slug": slug.current,
        color
      },
      publishedAt,
      "seo": {
        "metaDescription": seo.metaDescription.${lang},
        "ogImage": seo.ogImage.asset->url
      }
    }`

    const post = await client.fetch(query, { slug })
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    res.status(200).json({ post })
  } catch (error) {
    console.error('Error fetching post:', error)
    res.status(500).json({ error: 'Failed to fetch post' })
  }
}