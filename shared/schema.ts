import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scanSessions = pgTable("scan_sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  adapterVersion: text("adapter_version"),
  protocol: text("protocol"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  summary: jsonb("summary"),
});

export const insertScanSessionSchema = createInsertSchema(scanSessions).omit({ 
  id: true, 
  startedAt: true,
  endedAt: true 
});

export type ScanSession = typeof scanSessions.$inferSelect;
export type InsertScanSession = z.infer<typeof insertScanSessionSchema>;
