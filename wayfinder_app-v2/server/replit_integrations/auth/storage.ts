import { users, type User, type UpsertUser } from "../../../shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Helper function to generate unique BOX code
async function generateUniqueBoxCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let attempts = 0;
  while (attempts < 10) {
    let code = "BOX-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const [existing] = await db.select().from(users).where(eq(users.boxCode, code));
    if (!existing) {
      return code;
    }
    attempts++;
  }
  return "BOX-" + crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
}

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const userId = parseInt(id);
    if (isNaN(userId)) return undefined;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (user && !user.boxCode) {
      const boxCode = await generateUniqueBoxCode();
      await db.update(users).set({ boxCode }).where(eq(users.id, userId));
      user.boxCode = boxCode;
    }
    
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const boxCode = await generateUniqueBoxCode();
    const [user] = await db
      .insert(users)
      .values({ ...userData, boxCode })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
