import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';

let pool: Pool | undefined;
let database: NodePgDatabase | undefined;
export function getDB() {
  if (!database) {
    const connectionString = process.env.DATABASE_URL || process.env.DATABASE_CONNECTION_STRING;
    if (!connectionString) throw new Error('DATABASE_URL or DATABASE_CONNECTION_STRING is required');
    pool = new Pool({ connectionString, max: Number(process.env.DATABASE_POOL_MAX || 5), min: 0,
      idleTimeoutMillis: 10_000, connectionTimeoutMillis: 15_000, allowExitOnIdle: true });
    pool.on('error', () => console.error('Idle PostgreSQL connection closed'));
    database = drizzle(pool);
  }
  return database;
}
// Validate configuration without issuing keepalive queries or waking Neon at startup.
export async function connectDB() { getDB(); }
export async function disconnectDB() { await pool?.end(); pool = undefined; database = undefined; }
export class DatabaseSession {
  db: any;
  afterCommit: Array<() => Promise<void>> = [];
  async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      this.afterCommit = [];
      try {
        const result = await getDB().transaction(async tx => {
          this.db = tx;
          return callback();
        }, { isolationLevel: 'serializable' });
        this.db = undefined;
        for (const action of this.afterCommit) await action();
        return result;
      } catch (error: any) {
        this.db = undefined;
        const code = error.code || error.cause?.code;
        if (!['40001', '40P01'].includes(code) || attempt >= 4) throw error;
      }
    }
  }
  async endSession() { this.db = undefined; }
}
export async function startSession() { return new DatabaseSession(); }
