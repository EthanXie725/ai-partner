import { Router } from 'express'

const router = Router()

router.post('/proxy/embeddings', async (req, res) => {
  const { apiKey, baseUrl, model, input } = req.body
  if (!apiKey || !input) {
    res.status(400).json({ error: 'apiKey and input required' })
    return
  }

  try {
    const response = await fetch(`${baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'text-embedding-v4',
        input,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      res.status(response.status).json({ error: err })
      return
    }

    const data = await response.json()
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
