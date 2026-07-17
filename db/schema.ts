import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export type ProjectFile = {
  path: string;
  content: string;
  language?: string;
};

export const projects = pgTable("projects", {
  id: uuid().defaultRandom().primaryKey(),
  clientId: text("client_id").notNull(),
  name: text().notNull(),
  prompt: text().notNull(),
  summary: text().notNull(),
  files: jsonb().$type<ProjectFile[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
