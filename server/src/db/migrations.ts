import { run, query } from './connection.js'

const migrations = [
  `CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT '',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    pinned BIGINT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`,

  `CREATE TABLE IF NOT EXISTS facts (
    id VARCHAR(36) PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    predicate VARCHAR(255) NOT NULL,
    object VARCHAR(255) NOT NULL,
    confidence FLOAT NOT NULL DEFAULT 0.8,
    source_msg_id VARCHAR(36) NOT NULL,
    created_at BIGINT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS semantic_memories (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    memory_type VARCHAR(20) NOT NULL DEFAULT 'user',
    summary TEXT NOT NULL,
    embedding TEXT,
    created_at BIGINT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
]

// MySQL doesn't support CREATE INDEX IF NOT EXISTS, so we check first
async function ensureIndex(indexName: string, tableName: string, createSql: string) {
  try {
    const rows = await query<any>(
      `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
      [tableName, indexName]
    )
    if (rows.length === 0) {
      await run(createSql)
    }
  } catch {
    // Best effort
  }
}

export async function runMigrations() {
  // Create database if not exists
  const dbName = process.env.DB_NAME || 'friend'
  // We need a separate connection without database for this
  const mysql = await import('mysql2/promise')
  const tmpPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    connectionLimit: 1,
  })
  await tmpPool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4`)
  await tmpPool.end()

  // Run table migrations
  for (const sql of migrations) {
    if (sql.includes('CREATE INDEX')) continue // handled separately
    try {
      await run(sql)
    } catch (err) {
      console.error('Migration error:', sql, err)
    }
  }

  await ensureIndex('idx_messages_conversation', 'messages',
    'CREATE INDEX idx_messages_conversation ON messages(conversation_id)')

  // Add memory_type column to existing semantic_memories table
  try {
    await run(`ALTER TABLE semantic_memories ADD COLUMN memory_type VARCHAR(20) NOT NULL DEFAULT 'user'`)
  } catch {
    // Column already exists, ignore
  }
}
