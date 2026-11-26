export type PlatformId =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "snapchat"
  | "facebook"
  | "x"
  | "pinterest"
  | "vimeo"
  | "direct"
  | "other";

export type PlatformMeta = {
  id: PlatformId;
  name: string;
  nameAr: string;
  hosts: string[];
  accent: string;
};

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "tiktok",
    name: "TikTok",
    nameAr: "تيك توك",
    hosts: ["tiktok.com", "vt.tiktok.com", "vm.tiktok.com"],
    accent: "#25f4ee",
  },
  {
    id: "instagram",
    name: "Instagram",
    nameAr: "إنستغرام",
    hosts: ["instagram.com", "instagr.am", "ig.me"],
    accent: "#f472b6",
  },
  {
    id: "youtube",
    name: "YouTube",
    nameAr: "يوتيوب",
    hosts: [
      "youtube.com",
      "youtu.be",
      "m.youtube.com",
      "music.youtube.com",
      "youtube-nocookie.com",
    ],
    accent: "#ff5d5d",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    nameAr: "سناب شات",
    hosts: ["snapchat.com", "t.snapchat.com"],
    accent: "#facc15",
  },
  {
    id: "facebook",
    name: "Facebook",
    nameAr: "فيسبوك",
    hosts: ["facebook.com", "fb.watch", "fb.com", "m.facebook.com"],
    accent: "#60a5fa",
  },
  {
    id: "x",
    name: "X",
    nameAr: "منصة X",
    hosts: ["x.com", "twitter.com", "t.co"],
    accent: "#e2e8f0",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    nameAr: "بنترست",
    hosts: ["pinterest.com", "pin.it"],
    accent: "#fb7185",
  },
  {
    id: "vimeo",
    name: "Vimeo",
    nameAr: "فيميو",
    hosts: ["vimeo.com", "player.vimeo.com"],
    accent: "#38bdf8",
  },
  {
    id: "direct",
    name: "Direct file",
    nameAr: "رابط مباشر",
    hosts: [],
    accent: "#34d399",
  },
  {
    id: "other",
    name: "Other site",
    nameAr: "منصة أخرى",
    hosts: [],
    accent: "#a78bfa",
  },
];

/** Platforms rendered as quick chips in the UI (no direct/other). */
export const FEATURED_PLATFORMS = PLATFORMS.filter(
  (platform) => !["direct", "other"].includes(platform.id),
);

export function platformById(id: string): PlatformMeta {
  return PLATFORMS.find((platform) => platform.id === id) ?? PLATFORMS[PLATFORMS.length - 1];
}

export function detectPlatform(rawUrl: string): PlatformId {
  const host = safeHostname(rawUrl);
  if (!host) return "other";
  if (isDirectMediaUrl(rawUrl)) return "direct";
  const found = PLATFORMS.find((platform) =>
    platform.hosts.some((candidate) => host === candidate || host.endsWith(`.${candidate}`)),
  );
  return found?.id ?? "other";
}

export function safeHostname(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

const MEDIA_EXTENSIONS = [
  "mp4",
  "webm",
  "mov",
  "m4v",
  "mkv",
  "mp3",
  "m4a",
  "aac",
  "ogg",
  "wav",
];

const STREAM_EXTENSIONS = ["m3u8", "mpd", "ts"];

export function mediaExtension(rawUrl: string): string | null {
  try {
    const path = new URL(rawUrl).pathname.toLowerCase();
    const match = path.match(/\.([a-z0-9]{2,5})$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function isDirectMediaUrl(rawUrl: string): boolean {
  const ext = mediaExtension(rawUrl);
  return ext !== null && MEDIA_EXTENSIONS.includes(ext);
}

export function isStreamManifest(rawUrl: string): boolean {
  const ext = mediaExtension(rawUrl);
  return ext !== null && STREAM_EXTENSIONS.includes(ext);
}

export type FormatId = "mp4" | "webm" | "audio";

export const FORMATS: {
  id: FormatId;
  label: string;
  hint: string;
  extension: string;
}[] = [
  { id: "mp4", label: "MP4", hint: "فيديو — الأكثر توافقاً", extension: "mp4" },
  { id: "webm", label: "WEBM", hint: "فيديو — حجم أصغر", extension: "webm" },
  { id: "audio", label: "صوت", hint: "M4A — بدون فيديو", extension: "m4a" },
];

/** Rejects private hosts so the resolver can never be used as an SSRF proxy. */
export function isPublicHttpUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, reason: "protocol" };
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return { ok: false, reason: "private" };
  }
  return { ok: true, url };
}
