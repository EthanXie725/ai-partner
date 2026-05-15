import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'friend',
  waitForConnections: true,
  connectionLimit: 10,
})

export async function query<T extends mysql.RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<T> {
  const [rows] = await pool.execute<T>(sql, params)
  return rows
}

export async function run(
  sql: string,
  params?: any[]
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute<mysql.ResultSetHeader>(sql, params)
  return result
}

export default pool
