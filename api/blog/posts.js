import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

export default async function handler(req, res) {
  const { lang = 'en', tag, limit = 10 } = req.query

  try {
    let query = `*[_type == "post" && publishedAt <= now()] | order(publishedAt desc)`
    
    if (tag) {
      query = `*[_type == "post" && publishedAt <= now() && references(*[_type=="tag" && slug.current == "${tag}"]._id)] | order(publishedAt desc)`
    }
    
    query += ` [0...${parseInt(limit)}] {
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
      "tags": tags[]->{ 
        "name": name.${lang},
        "slug": slug.current,
        color
      },
      publishedAt,
      featured
    }`

    const posts = await client.fetch(query)
    
    res.status(200).json({ posts })
  } catch (error) {
    console.error('Error fetching posts:', error)
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
}