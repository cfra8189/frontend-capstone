import { pgTable, serial, varchar, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("single"),
  status: varchar("status", { length: 50 }).notNull().default("concept"),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const creativeNotes = pgTable("creative_notes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: varchar("category", { length: 50 }).notNull().default("ideas"),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  mediaUrls: jsonb("media_urls").default([]),
  tags: jsonb("tags").default([]),
  isPinned: varchar("is_pinned").default("false"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type CreativeNote = typeof creativeNotes.$inferSelect;
export type InsertCreativeNote = typeof creativeNotes.$inferInsert;
