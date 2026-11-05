import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const links = pgTable(
  "links",
  {
    // The short code is the primary key: the database itself guarantees uniqueness,
    // so concurrent requests can never create the same code twice.
    code: varchar("code", { length: 16 }).primaryKey(),
    url: text("url").notNull(),
    clicks: integer("clicks").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("links_created_at_idx").on(table.createdAt)],
);

export type LinkRow = typeof links.$inferSelect;
