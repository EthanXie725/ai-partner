import { Router } from 'express'
import { query, run } from '../db/connection.js'

interface ConversationRow {
  id: string
  title: string
  created_at: number
  updated_at: number
  pinned: number
}

const router = Router()

router.get('/conversations', async (_req, res) => {
  const rows = await query<ConversationRow[]>(
    'SELECT id, title, created_at, updated_at, pinned FROM conversations ORDER BY pinned DESC, updated_at DESC'
  )
  res.json(rows.map(r => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    pinned: r.pinned,
  })))
})

router.post('/conversations', async (req, res) => {
  const { id, title = '' } = req.body
  if (!id) { res.status(400).json({ error: 'id required' }); return }
  const now = Date.now()
  await run(
    'INSERT IGNORE INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [id, title, now, now]
  )
  res.json({ id, title, createdAt: now, updatedAt: now, pinned: 0 })
})

router.get('/conversations/:id', async (req, res) => {
  const rows = await query<ConversationRow[]>(
    'SELECT id, title, created_at, updated_at, pinned FROM conversations WHERE id = ?',
    [req.params.id]
  )
  if (rows.length === 0) { res.status(404).json({ error: 'not found' }); return }
  const r = rows[0]
  res.json({ id: r.id, title: r.title, createdAt: r.created_at, updatedAt: r.updated_at, pinned: r.pinned })
})

router.patch('/conversations/:id/title', async (req, res) => {
  const { title } = req.body
  if (typeof title !== 'string') { res.status(400).json({ error: 'title required' }); return }
  await run('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?', [title, Date.now(), req.params.id])
  res.json({ ok: true })
})

router.patch('/conversations/:id/pinned', async (req, res) => {
  const { pinned } = req.body
  if (typeof pinned !== 'number') { res.status(400).json({ error: 'pinned required' }); return }
  await run('UPDATE conversations SET pinned = ? WHERE id = ?', [pinned, req.params.id])
  res.json({ ok: true })
})

router.patch('/conversations/:id/time', async (_req, res) => {
  await run('UPDATE conversations SET updated_at = ? WHERE id = ?', [Date.now(), _req.params.id])
  res.json({ ok: true })
})

router.delete('/conversations/:id', async (req, res) => {
  await run('DELETE FROM messages WHERE conversation_id = ?', [req.params.id])
  await run('DELETE FROM conversations WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
