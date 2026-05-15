import { Router } from 'express'
import { query, run } from '../db/connection.js'

interface MemoryRow {
  id: string
  conversation_id: string
  memory_type: string
  summary: string
  embedding: string | null
  created_at: number
}

const router = Router()

router.get('/semantic-memories', async (_req, res) => {
  const rows = await query<MemoryRow[]>(
    'SELECT id, conversation_id, memory_type, summary, embedding, created_at FROM semantic_memories ORDER BY created_at ASC'
  )
  res.json(rows.map(r => ({
    id: r.id,
    conversationId: r.conversation_id,
    memoryType: r.memory_type,
    summary: r.summary,
    embedding: r.embedding ? JSON.parse(r.embedding) : [],
    createdAt: r.created_at,
  })))
})

router.post('/semantic-memories', async (req, res) => {
  const { id, conversationId, memoryType, summary, embedding, createdAt } = req.body
  if (!id || !summary) {
    res.status(400).json({ error: 'id, summary required' })
    return
  }
  await run(
    'INSERT INTO semantic_memories (id, conversation_id, memory_type, summary, embedding, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, conversationId || '', memoryType || 'user', summary, embedding ? JSON.stringify(embedding) : null, createdAt || Date.now()]
  )
  res.json(req.body)
})

router.delete('/semantic-memories/:id', async (req, res) => {
  await run('DELETE FROM semantic_memories WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
