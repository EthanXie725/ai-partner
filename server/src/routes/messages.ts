import { Router } from 'express'
import { query, run } from '../db/connection.js'

interface MessageRow {
  id: string
  conversation_id: string
  role: string
  content: string
  created_at: number
}

const router = Router()

router.get('/conversations/:id/messages', async (req, res) => {
  const rows = await query<MessageRow[]>(
    'SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [req.params.id]
  )
  res.json(rows.map(r => ({
    id: r.id,
    conversationId: r.conversation_id,
    role: r.role,
    content: r.content,
    createdAt: r.created_at,
  })))
})

router.post('/conversations/:id/messages', async (req, res) => {
  const { id, role, content, createdAt } = req.body
  if (!id || !role || content === undefined) {
    res.status(400).json({ error: 'id, role, content required' })
    return
  }
  await run(
    'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, req.params.id, role, content, createdAt || Date.now()]
  )
  res.json(req.body)
})

router.get('/conversations/:id/messages/last/:limit', async (req, res) => {
  const limit = parseInt(req.params.limit, 10) || 10
  const rows = await query<MessageRow[]>(
    'SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?',
    [req.params.id, limit]
  )
  res.json(rows.reverse().map(r => ({
    id: r.id,
    conversationId: r.conversation_id,
    role: r.role,
    content: r.content,
    createdAt: r.created_at,
  })))
})

export default router
