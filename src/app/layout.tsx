import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Aref_Ruqaa, Space_Grotesk, Tajawal } from "next/font/google";
import { MotionRoot, PageTransition, SplashGate } from "@/components/motion";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

const aref = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["700"],
  variable: "--font-aref",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "حمل الفيديو ياعبود — تنزيل فيديوهات المنصات بتجربة ثلاثية الأبعاد",
  description:
    "تجربة تحميل ثلاثية الأبعاد: الصق رابط الفيديو من تيك توك، إنستغرام، يوتيوب، سناب شات أو فيسبوك، واختر الصيغة، ونرسل لك الملف مباشرة كـ MP4 أو WEBM أو صوت — بدون تسجيل وبدون صفحات وسيطة.",
  keywords: [
    "حمل الفيديو ياعبود",
    "تحميل فيديو",
    "تنزيل تيك توك",
    "تحميل ريلز",
    "تنزيل يوتيوب",
    "video downloader",
    "MP4",
  ],
  openGraph: {
    title: "حمل الفيديو ياعبود — الفيديو في جهازك بضغطة",
    description: "أداة عربية ثلاثية الأبعاد لاستخراج الفيديو من روابط المنصات وتنزيله مباشرة.",
    type: "website",
    locale: "ar_AR",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#030617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${tajawal.variable} ${grotesk.variable} ${aref.variable}`}>
      <head>
        <link rel="preload" as="image" href="/splash.png" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(sessionStorage.getItem("abd-splash-seen-v2")==="1")document.documentElement.classList.add("splash-seen")}catch(e){}',
          }}
        />
      </head>
      <body className="antialiased">
        <MotionRoot>
          <SplashGate />
          <PageTransition>{children}</PageTransition>
        </MotionRoot>
      </body>
    </html>
  );
}
