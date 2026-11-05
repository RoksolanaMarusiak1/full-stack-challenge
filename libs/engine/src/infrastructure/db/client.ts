import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  // Without a listener, a dropped connection (e.g. Postgres restarting) emits an
  // unhandled "error" event and crashes the whole Node process. The pool reconnects
  // on its own; we only need to log it.
  pool.on("error", (error) => console.error("Postgres pool error", error));
  return drizzle({ client: pool, schema });
}

export type Database = ReturnType<typeof createDb>;
