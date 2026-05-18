import { Router, Request, Response } from 'express'

const router = Router()

interface SearchResult {
  title: string
  url: string
  content: string
}

async function searchTavily(query: string, apiKey: string): Promise<SearchResult[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: false,
    }),
  })

  if (!response.ok) {
    console.error(`Tavily API error: ${response.status}`)
    return []
  }

  const data = await response.json() as { results: Array<{ title: string; url: string; content: string }> }
  return (data.results || []).map(r => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }))
}

async function searchBing(query: string): Promise<SearchResult[]> {
  const url = 'https://cn.bing.com/search?q=' + encodeURIComponent(query) + '&count=5'
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  })

  if (!response.ok) {
    console.error(`Bing error: ${response.status}`)
    return []
  }

  const html = await response.text()
  const results: SearchResult[] = []

  // Parse Bing HTML results
  const algoRegex = /<li class="b_algo"[^>]*>([\s\S]*?)<\/li>/g
  let algoMatch: RegExpExecArray | null

  while ((algoMatch = algoRegex.exec(html)) !== null && results.length < 5) {
    const block = algoMatch[1]

    // Match the result link inside <h2><a href="URL">Title</a></h2>
    const linkMatch = /<h2[^>]*>[\s\S]*?<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>/i.exec(block)
    if (!linkMatch) continue

    const url = linkMatch[1].replace(/&amp;/g, '&')
    const title = linkMatch[2].replace(/<[^>]+>/g, '').trim()
    if (!title || !url) continue

    // Match snippet inside <p> or <span class="st">
    const snippetMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block)
    const content = snippetMatch
      ? snippetMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      : ''

    if (content) {
      results.push({ title, url, content })
    }
  }

  return results
}

router.post('/search', async (req: Request, res: Response) => {
  const { query } = req.body
  if (!query) {
    res.status(400).json({ error: 'query is required' })
    return
  }

  const apiKey = process.env.SEARCH_API_KEY

  // Try Tavily first if API key is configured
  if (apiKey) {
    try {
      const results = await searchTavily(query, apiKey)
      if (results.length > 0) {
        res.json({ results })
        return
      }
    } catch (err) {
      console.error('Tavily search error:', err)
    }
  }

  // Fallback to Bing (no API key required, accessible in China)
  try {
    const results = await searchBing(query)
    res.json({ results })
  } catch (err) {
    console.error('Bing search error:', err)
    res.json({ results: [] })
  }
})

export default router
