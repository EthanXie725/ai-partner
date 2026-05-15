import { Router } from 'express'
import { query, run } from '../db/connection.js'

interface FactRow {
  id: string
  subject: string
  predicate: string
  object: string
  confidence: number
  source_msg_id: string
  created_at: number
}

const router = Router()

router.get('/facts', async (req, res) => {
  let rows: FactRow[]
  if (req.query.subject) {
    rows = await query<FactRow[]>(
      'SELECT id, subject, predicate, object, confidence, source_msg_id, created_at FROM facts WHERE subject = ? ORDER BY created_at DESC',
      [req.query.subject]
    )
  } else {
    rows = await query<FactRow[]>(
      'SELECT id, subject, predicate, object, confidence, source_msg_id, created_at FROM facts ORDER BY created_at DESC'
    )
  }
  res.json(rows.map(r => ({
    id: r.id,
    subject: r.subject,
    predicate: r.predicate,
    object: r.object,
    confidence: r.confidence,
    sourceMsgId: r.source_msg_id,
    createdAt: r.created_at,
  })))
})

router.post('/facts', async (req, res) => {
  const { id, subject, predicate, object, confidence, sourceMsgId, createdAt } = req.body
  if (!id || !subject || !predicate || !object) {
    res.status(400).json({ error: 'id, subject, predicate, object required' })
    return
  }
  await run(
    'INSERT INTO facts (id, subject, predicate, object, confidence, source_msg_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, subject, predicate, object, confidence ?? 0.8, sourceMsgId || '', createdAt || Date.now()]
  )
  res.json(req.body)
})

router.delete('/facts/:id', async (req, res) => {
  await run('DELETE FROM facts WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
