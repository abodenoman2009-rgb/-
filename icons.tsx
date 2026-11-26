import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

/* ---------------------------------- brand --------------------------------- */

function Svg({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
    </Svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </Svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true" {...props}>
      <rect x="2.9" y="2.9" width="18.2" height="18.2" rx="5.4" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.2" cy="6.9" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M24 12.07C24 5.44 18.63.07 12 .07S0 5.44 0 12.07c0 5.99 4.39 10.95 10.13 11.86v-8.39H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88v2.25h3.33l-.53 3.47h-2.8v8.39C19.61 23.02 24 18.06 24 12.07Z" />
    </Svg>
  );
}

export function SnapchatIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.6c2.6 0 4.3 1.9 4.3 4.5 0 .8-.05 1.5-.05 2.2.7.3 1.5-.5 2.1-.2.5.3.5 1 .1 1.4-.4.4-1.5.7-1.7 1.3-.2.6.9 2.2 2.6 2.9.6.3.4.9-.1 1.1-.6.2-1.3.3-1.5.7-.1.2-.1.5-.2.8-.1.4-.4.5-.9.4-.4-.1-.9-.2-1.5-.2-.5 0-1 .1-1.5.3-.9.4-1.4 1.3-2.9 1.3s-2-.9-2.9-1.3c-.5-.2-1-.3-1.5-.3-.6 0-1.1.1-1.5.2-.5.1-.8 0-.9-.4-.1-.3-.1-.6-.2-.8-.2-.4-.9-.5-1.5-.7-.5-.2-.7-.8-.1-1.1 1.7-.7 2.8-2.3 2.6-2.9-.2-.6-1.3-.9-1.7-1.3-.4-.4-.4-1.1.1-1.4.6-.3 1.4.5 2.1.2 0-.7-.05-1.4-.05-2.2C7.7 4.5 9.4 2.6 12 2.6Z" />
    </Svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.59l5.25 6.93 6.06-6.93Zm-1.29 19.49h2.04L6.49 3.24H4.3l13.31 17.4Z" />
    </Svg>
  );
}

export function PinterestIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.43 7.63 11.17-.1-.95-.2-2.4.04-3.44.22-.94 1.4-5.96 1.4-5.96s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.51.77 1.51 1.69 0 1.03-.65 2.57-.99 4-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.06-4.86-5-4.86-3.4 0-5.4 2.55-5.4 5.18 0 1.03.4 2.13.89 2.73.1.12.11.22.08.34-.09.38-.29 1.18-.33 1.34-.05.22-.18.27-.41.16-1.53-.71-2.48-2.94-2.48-4.73 0-3.85 2.8-7.39 8.08-7.39 4.24 0 7.54 3.02 7.54 7.06 0 4.21-2.66 7.6-6.35 7.6-1.24 0-2.4-.64-2.8-1.41l-.76 2.9c-.28 1.06-1.02 2.4-1.52 3.21 1.13.35 2.32.54 3.56.54 6.63 0 12-5.37 12-12S18.63 0 12 0Z" />
    </Svg>
  );
}

export function VimeoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M23.98 6.42c-.1 2.22-1.66 5.26-4.66 9.12-3.11 4.03-5.74 6.05-7.89 6.05-1.33 0-2.46-1.23-3.38-3.68L6.2 11.21c-.69-2.46-1.43-3.69-2.21-3.69-.17 0-.77.36-1.8 1.08L1.1 7.19c1.13-.99 2.25-1.99 3.35-2.98 1.5-1.3 2.63-1.99 3.39-2.06 1.79-.17 2.89 1.05 3.31 3.66.45 2.82.76 4.57.94 5.25.52 2.36 1.09 3.54 1.72 3.54.49 0 1.22-.77 2.2-2.31.97-1.54 1.49-2.71 1.56-3.51.14-1.39-.4-2.09-1.62-2.09-.58 0-1.17.13-1.79.39 1.19-3.89 3.46-5.78 6.81-5.67 2.48.08 3.65 1.68 3.51 4.8Z" />
    </Svg>
  );
}

export function DirectIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true" {...props}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h3.2l1.8 2.2h6A2.5 2.5 0 0 1 20 9.7v6.8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M12 11.5v4.2m0 0 1.8-1.8M12 15.7l-1.8-1.8" />
    </svg>
  );
}

export function GenericPlatformIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17M12 3c2.4 2.4 3.6 5.4 3.6 9s-1.2 6.6-3.6 9c-2.4-2.4-3.6-5.4-3.6-9S9.6 5.4 12 3Z" />
    </svg>
  );
}

const BRAND_MAP = {
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  snapchat: SnapchatIcon,
  x: XIcon,
  pinterest: PinterestIcon,
  vimeo: VimeoIcon,
  direct: DirectIcon,
  other: GenericPlatformIcon,
} as const;

export function BrandIcon({ platform, className, ...props }: { platform: string } & IconProps) {
  const Component = BRAND_MAP[platform as keyof typeof BRAND_MAP] ?? GenericPlatformIcon;
  return <Component className={className} {...props} />;
}

/* ----------------------------------- UI ----------------------------------- */

type UiName =
  | "download"
  | "link"
  | "clipboard"
  | "close"
  | "check"
  | "alert"
  | "refresh"
  | "sparkle"
  | "bolt"
  | "shield"
  | "clock"
  | "globe"
  | "server"
  | "arrow"
  | "play"
  | "film"
  | "music"
  | "file"
  | "chevron"
  | "lock"
  | "mobile"
  | "trash"
  | "copy"
  | "external";

const UI_PATHS: Record<UiName, ReactNode> = {
  download: (
    <>
      <path d="M12 3.5v11.2" />
      <path d="m7.6 10.6 4.4 4.4 4.4-4.4" />
      <path d="M4.5 18.5h15" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7L11.7 6.6" />
      <path d="M13.5 10.5a4 4 0 0 0-5.7 0L5.2 13a4 4 0 0 0 5.7 5.7l1.4-1.4" />
    </>
  ),
  clipboard: (
    <>
      <rect x="8" y="3.5" width="8" height="3.4" rx="1.4" />
      <path d="M16 5.2h1.6A2.4 2.4 0 0 1 20 7.6v11.2a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 18.8V7.6a2.4 2.4 0 0 1 2.4-2.4H8" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  alert: (
    <>
      <path d="M12 3.8 2.8 19.4h18.4L12 3.8Z" />
      <path d="M12 9.6v4.2M12 17.1h.01" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.6-4.6L3.5 9.2" />
      <path d="M4 13a8 8 0 0 0 13.6 4.6l2.9-2.8" />
      <path d="M3.5 5.2v4h4M20.5 18.8v-4h-4" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 13.7 9l5.3 1.7-5.3 1.9L12 18l-1.7-5.4L5 10.7 10.3 9 12 3.5Z" />
      <path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </>
  ),
  bolt: <path d="M13.5 2.8 5.4 13.4h5l-.9 7.8 8.2-11h-5.1l.9-7.4Z" />,
  shield: (
    <>
      <path d="M12 3.3 5 6v5.4c0 4.3 2.9 7.6 7 9.3 4.1-1.7 7-5 7-9.3V6l-7-2.7Z" />
      <path d="m9 12 2.1 2.1L15.3 10" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.6V12l3.1 1.9" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.6 9.4h16.8M3.6 14.6h16.8M12 3.4c2.2 2.3 3.3 5.2 3.3 8.6s-1.1 6.3-3.3 8.6c-2.2-2.3-3.3-5.2-3.3-8.6S9.8 5.7 12 3.4Z" />
    </>
  ),
  server: (
    <>
      <rect x="3.6" y="4" width="16.8" height="6.4" rx="2" />
      <rect x="3.6" y="13.6" width="16.8" height="6.4" rx="2" />
      <path d="M7.2 7.2h.01M7.2 16.8h.01" />
    </>
  ),
  arrow: <path d="M19 12H5m6-6-6 6 6 6" />,
  play: <path d="M9 5.6 19 12 9 18.4V5.6Z" />,
  film: (
    <>
      <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2.4" />
      <path d="M3.4 9.4h17.2M3.4 14.6h17.2M8.2 4.6v14.8M15.8 4.6v14.8" />
    </>
  ),
  music: (
    <>
      <path d="M9.4 18.2V6.4l9-2v11.4" />
      <circle cx="6.8" cy="18.3" r="2.6" />
      <circle cx="15.8" cy="15.8" r="2.6" />
    </>
  ),
  file: (
    <>
      <path d="M13.6 3.6H7.4A2.4 2.4 0 0 0 5 6v12a2.4 2.4 0 0 0 2.4 2.4h9.2a2.4 2.4 0 0 0 2.4-2.4V9l-5.4-5.4Z" />
      <path d="M13.4 3.8V9H19" />
    </>
  ),
  chevron: <path d="m6.5 9.5 5.5 5 5.5-5" />,
  lock: (
    <>
      <rect x="5" y="10.4" width="14" height="9.6" rx="2.4" />
      <path d="M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4" />
    </>
  ),
  mobile: (
    <>
      <rect x="7" y="2.8" width="10" height="18.4" rx="3" />
      <path d="M11 18.4h2" />
    </>
  ),
  trash: (
    <>
      <path d="M4.6 7.2h14.8M9.4 7.2V5.4A1.4 1.4 0 0 1 10.8 4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.8" />
      <path d="M6.6 7.2 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.8-11.8" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.4" />
      <path d="M15 9V6.4A2.4 2.4 0 0 0 12.6 4H6.4A2.4 2.4 0 0 0 4 6.4v6.2A2.4 2.4 0 0 0 6.4 15H9" />
    </>
  ),
  external: (
    <>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5 11 13" />
      <path d="M18 14.5v3.1a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 17.6V8.4A2.4 2.4 0 0 1 6.4 6h3.1" />
    </>
  ),
};

export function UiIcon({ name, className, ...props }: IconProps & { name: UiName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {UI_PATHS[name]}
    </svg>
  );
}

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size * 0.56, height: size * 0.56 }}
        aria-hidden="true"
      >
        <path d="M12 3.6v9.6" />
        <path d="m8.2 9.6 3.8 3.8 3.8-3.8" />
        <path d="M4.8 15.4v2.6a2.4 2.4 0 0 0 2.4 2.4h9.6a2.4 2.4 0 0 0 2.4-2.4v-2.6" />
      </svg>
    </span>
  );
}
