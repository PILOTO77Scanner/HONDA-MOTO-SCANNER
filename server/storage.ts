import { db } from "./db";
import { scanSessions, type ScanSession, type InsertScanSession } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getSessions(): Promise<ScanSession[]>;
  getSession(id: number): Promise<ScanSession | undefined>;
  createSession(session: InsertScanSession): Promise<ScanSession>;
}

export class DatabaseStorage implements IStorage {
  async getSessions(): Promise<ScanSession[]> {
    return await db.select().from(scanSessions).orderBy(scanSessions.startedAt);
  }

  async getSession(id: number): Promise<ScanSession | undefined> {
    const [session] = await db.select().from(scanSessions).where(eq(scanSessions.id, id));
    return session;
  }

  async createSession(insertSession: InsertScanSession): Promise<ScanSession> {
    const [session] = await db.insert(scanSessions).values(insertSession).returning();
    return session;
  }
}

export const storage = new DatabaseStorage();
