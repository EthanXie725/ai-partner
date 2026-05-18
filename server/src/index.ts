import express from 'express'
import cors from 'cors'
import { runMigrations } from './db/migrations.js'
import conversationsRouter from './routes/conversations.js'
import messagesRouter from './routes/messages.js'
import factsRouter from './routes/facts.js'
import semanticMemoriesRouter from './routes/semantic-memories.js'
import healthRouter from './routes/health.js'
import proxyRouter from './routes/proxy.js'
import searchRouter from './routes/search.js'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.use('/api', conversationsRouter)
app.use('/api', messagesRouter)
app.use('/api', factsRouter)
app.use('/api', semanticMemoriesRouter)
app.use('/api', healthRouter)
app.use('/api', proxyRouter)
app.use('/api', searchRouter)

async function start() {
  try {
    await runMigrations()
    console.log('Database migrations completed')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()
