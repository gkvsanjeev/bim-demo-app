import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  host:     process.env.PGHOST     ?? 'localhost',
  port:     Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? 'skysafe',
  user:     process.env.PGUSER     ?? 'skysafe',
  password: process.env.PGPASSWORD ?? 'skysafe_dev',
})
