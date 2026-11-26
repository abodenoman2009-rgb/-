export type PublicJob = {
  id: string;
  sourceUrl: string;
  platform: string;
  platformName: string;
  status: string;
  format: string;
  quality: string | null;
  note: string | null;
  title: string | null;
  author: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  engine: string | null;
  isSample: boolean;
  downloadCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type SiteStats = {
  total: number;
  success: number;
  failed: number;
  bytes: number;
  downloads: number;
  lastDay: number;
  successRate: number;
  platforms: { id: string; name: string; count: number }[];
  engine: { ytdlp: boolean };
};

export type ResolveErrorInfo = {
  code: string;
  message: string;
  hint?: string;
};
