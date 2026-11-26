import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Every attempt to turn a public URL into a downloadable file is stored here.
 * Only metadata + a short-lived remote media URL are persisted; video bytes are
 * streamed through the API and never written to disk.
 */
export const downloads = pgTable(
  "downloads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceUrl: text("source_url").notNull(),
    platform: varchar("platform", { length: 32 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("processing"),
    format: varchar("format", { length: 8 }).notNull().default("mp4"),
    quality: varchar("quality", { length: 180 }),
    note: text("note"),
    title: text("title"),
    author: text("author"),
    thumbnailUrl: text("thumbnail_url"),
    durationSeconds: integer("duration_seconds"),
    remoteUrl: text("remote_url"),
    remoteHeaders: jsonb("remote_headers").$type<Record<string, string>>(),
    fileName: text("file_name"),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
    mimeType: varchar("mime_type", { length: 80 }),
    engine: varchar("engine", { length: 24 }),
    isSample: boolean("is_sample").notNull().default(false),
    downloadCount: integer("download_count").notNull().default(0),
    errorCode: varchar("error_code", { length: 40 }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [index("downloads_created_at_idx").on(table.createdAt)],
);

export type DownloadRow = typeof downloads.$inferSelect;
export type NewDownloadRow = typeof downloads.$inferInsert;
