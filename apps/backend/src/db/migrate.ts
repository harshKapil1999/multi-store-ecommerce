import dotenv from 'dotenv';
import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDB, disconnectDB } from '../config/database';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
async function main() {
  try { await migrate(getDB(), { migrationsFolder: path.resolve(__dirname, '../../drizzle') }); console.log('PostgreSQL migrations applied'); }
  finally { await disconnectDB(); }
}
if (require.main === module) main().catch(() => { console.error('PostgreSQL migration failed; check connection and migration permissions'); process.exitCode = 1; });
