import Link from "next/link";
import { AuroraBackground } from "@/components/aurora-background";
import { DownloaderClient } from "@/components/downloader-client";
import { BrandIcon, Logo, UiIcon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { MotionToggle, Reveal } from "@/components/motion";
import { ensureSampleRows, getRecentJobs, getStats } from "@/lib/jobs";
import { FEATURED_PLATFORMS } from "@/lib/platforms";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "bolt" as const,
    title: "أسرع من ثانيتين",
    body: "صفحة خفيفة بلا مكتبات ثقيلة، تفتح وتنزّل بسرعة حتى على اتصال ضعيف.",
  },
  {
    icon: "download" as const,
    title: "ملف مباشر بلا صفحات",
    body: "نرسل الملف برأس Content-Disposition attachment ليصل إلى جهازك مباشرة كـ MP4 أو WEBM.",
  },
  {
    icon: "shield" as const,
    title: "خصوصية بالتصميم",
    body: "بدون حساب وبدون تسجيل، ولا تخزين للفيديوهات على الخادم. نمرّر البث ونحتفظ بالبيانات وصفاً فقط.",
  },
  {
    icon: "globe" as const,
    title: "منصات متعددة",
    body: "تيك توك، إنستغرام، يوتيوب، سناب شات، فيسبوك، X وأكثر من 1000 موقع يدعمه المحرك.",
  },
];

const STEPS = [
  {
    title: "الصق الرابط",
    body: "انسخ رابط الفيديو من تطبيق المنصة أو المتصفح، والصقه في الحقل.",
    icon: "link" as const,
  },
  {
    title: "أعلى جودة تلقائياً",
    body: "نختار أفضل دقة وأفضل صوت ونرسلهما في ملف MP4 واحد.",
    icon: "film" as const,
  },
  {
    title: "اضغط تنزيل",
    body: "نستخرج الملف من المصدر ونعيده لك خلال ثوانٍ، بدون صفحات وسيطة.",
    icon: "download" as const,
  },
];

const FAQ = [
  {
    q: "هل الأداة مجانية؟",
    a: "نعم. الاستخدام الشخصي مجاني بالكامل، بدون حساب أو تسجيل أو اشتراك أو إعلانات مزعجة. لا نحتاج بريدك ولا أي بيانات شخصية — الموقع لا يملك نظام حسابات أصلاً.",
  },
  {
    q: "هل تحتفظون بالفيديوهات على الخادم؟",
    a: "لا. نحن نستخرج رابط الملف من المصدر ثم نمرّره كبث مباشر (stream) إلى متصفحك عند الضغط على تنزيل. لا نكتب الفيديو على القرص، ويُحتفظ فقط ببيانات وصفية للعملية في قاعدة البيانات.",
  },
  {
    q: "لماذا يفشل بعض روابط يوتيوب أو إنستغرام؟",
    a: "منصات مثل يوتيوب تحظر أحياناً طلبات الاستخراج القادمة من خوادم الاستضافة وتطلب تسجيل دخول أو كوكيز. عندها يعيد الخادم رسالة واضحة بالسبب. الروابط المباشرة (mp4/webm) لا تتأثر بهذا القيد.",
  },
  {
    q: "ما الصيغ والجودات المتاحة؟",
    a: "MP4 و WEBM للفيديو، وصوت M4A. الجودة تعتمد على ما تنشره المنصة: نختار أفضل ملف متاح ضمن حد 300 ميجابايت لكل عملية.",
  },
  {
    q: "هل يعمل على الجوال؟",
    a: "نعم، الواجهة مبنية للجوال أولاً. على iOS قد يفتح الملف في نافذة جديدة؛ اختر «حفظ إلى الملفات» ليُحفظ باسمه الصحيح.",
  },
  {
    q: "هل التحميل قانوني؟",
    a: "الأداة تقنية للاستخدام الشخصي على محتوى تملكه أو لديك إذن به. التحميل من المنصات يخضع لشروط الخدمة وحقوق النشر، والمسؤولية على المستخدم.",
  },
];

export default async function DownloaderPage() {
  await ensureSampleRows();
  const [jobs, stats] = await Promise.all([getRecentJobs(6), getStats()]);

  return (
    <div className="relative min-h-screen">
      <AuroraBackground density={48} />

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05070f]/75 backdrop-blur-xl">
        <div className="page-shell flex h-[68px] items-center justify-between gap-3">
          <Link href="/#download" className="flex items-center gap-2.5" aria-label="حمل معاء عبود — الرئيسية">
            <Logo size={40} />
            <span className="leading-tight">
              <span className="block text-[0.95rem] font-extrabold text-white">حمل معاء عبود</span>
              <span className="block font-mono text-[0.55rem] uppercase tracking-[0.22em] text-mint/60">
                abd downloader
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-[0.78rem] font-semibold text-mist/60 lg:flex">
            <a href="#download" className="transition hover:text-white">
              التحميل
            </a>
            <a href="#how" className="transition hover:text-white">
              كيف يعمل
            </a>
            <a href="#platforms" className="transition hover:text-white">
              المنصات
            </a>
            <a href="#activity" className="transition hover:text-white">
              السجل
            </a>
            <a href="#faq" className="transition hover:text-white">
              الأسئلة
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <span className="chip !hidden sm:!inline-flex" title="حالة محرك الاستخراج">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  stats.engine.ytdlp ? "bg-mint shadow-[0_0_8px_rgba(53,230,194,0.9)]" : "bg-amber-300"
                }`}
              />
              <span className="font-mono text-[0.62rem]">
                {stats.engine.ytdlp ? "ENGINE READY" : "DIRECT MODE"}
              </span>
            </span>
            <span className="chip !hidden md:!inline-flex">
              <UiIcon name="shield" className="h-3.5 w-3.5 text-mint" />
              بدون حساب
            </span>
            <MotionToggle className="!hidden sm:!grid" />
            <a href="#download" className="btn-primary press-3d !rounded-xl !px-4 !py-2 !text-xs">
              <UiIcon name="bolt" className="h-3.5 w-3.5" />
              ابدأ التحميل
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* --------------------------------- hero --------------------------------- */}
        <section className="page-shell pb-10 pt-10 sm:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              <span className="chip !border-mint/25 !bg-mint/[0.08] !text-mint">
                <UiIcon name="sparkle" className="h-3.5 w-3.5" />
                نسخة ٢٠٢٦ · أسرع من ثانيتين
              </span>
              <span className="chip">
                <UiIcon name="shield" className="h-3.5 w-3.5" />
                بدون حساب أو إعلانات
              </span>
            </div>

            <h1 className="text-[clamp(2rem,5.4vw,3.4rem)] font-extrabold leading-[1.2] tracking-tight text-white">
              حمّل أي فيديو…
              <br className="hidden sm:block" />
              <span className="text-gradient"> بجودة تختارها أنت</span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-[0.92rem] leading-8 text-mist/65 sm:text-base">
              عبود يستقبل رابطك في الحقل أدناه. الصق الرابط من تيك توك، إنستغرام، يوتيوب، سناب شات أو
              فيسبوك، ونرسل الملف مباشرة بأعلى جودة كـ MP4 — بدون صفحات وسيطة.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2.5">
              {FEATURED_PLATFORMS.slice(0, 6).map((platform, index) => (
                <span
                  key={platform.id}
                  className="floating-icon grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[0.05]"
                  style={{
                    color: platform.accent,
                    animationDelay: `${index * 0.45}s`,
                    transform: `translateZ(${12 + index * 6}px)`,
                  }}
                  title={platform.nameAr}
                >
                  <BrandIcon platform={platform.id} className="h-[18px] w-[18px]" />
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.72rem] font-semibold text-mist/45">
              <span className="inline-flex items-center gap-1.5">
                <UiIcon name="check" className="h-3.5 w-3.5 text-mint" /> بدون حساب أو تسجيل
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UiIcon name="check" className="h-3.5 w-3.5 text-mint" /> ملف واحد مباشر
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UiIcon name="check" className="h-3.5 w-3.5 text-mint" /> لا نخزّن فيديوهاتك
              </span>
            </div>
          </div>
        </section>

        {/* ----------------------------- form + aside ----------------------------- */}
        <section className="page-shell pb-16">
          <div className="mb-4 hidden items-end justify-between gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.02] px-5 py-2 lg:flex">
            <div className="flex items-end gap-3">
              <div className="w-[104px] shrink-0">
                <Mascot variant="present" interactive={false} className="floaty-slow" />
              </div>
              <div className="pb-3">
                <p className="text-[0.84rem] font-extrabold text-white">عبود يجهّز لك الحقل</p>
                <p className="mt-1 text-[0.72rem] leading-6 text-mist/45">
                  الصق الرابط في البطاقة — التحميل يبدأ فوراً.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 pb-3 text-mist/40">
              {FEATURED_PLATFORMS.slice(0, 5).map((platform, index) => (
                <span
                  key={platform.id}
                  className="floating-icon grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04]"
                  style={{ color: platform.accent, animationDelay: `${index * 0.4}s` }}
                >
                  <BrandIcon platform={platform.id} className="h-3.5 w-3.5" />
                </span>
              ))}
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_344px]">
            <div className="animate-rise">
              <DownloaderClient initialJobs={jobs} initialStats={stats} />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              {/* mock result card */}
              <div className="glass rounded-3xl p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-2 w-2 rounded-full bg-rose-400/70" />
                    <span className="h-2 w-2 rounded-full bg-amber-300/70" />
                    <span className="h-2 w-2 rounded-full bg-mint/70" />
                  </div>
                  <span className="rounded-md border border-white/10 bg-black/30 px-2 py-0.5 font-mono text-[0.55rem] tracking-wider text-mist/45">
                    abd.download / result
                  </span>
                </div>

                <div className="bob">
                  <div
                    className="relative aspect-video overflow-hidden rounded-2xl border border-white/10"
                    style={{
                      background:
                        "radial-gradient(120% 120% at 20% 0%, rgba(53,230,194,0.32), transparent 55%), radial-gradient(100% 100% at 90% 100%, rgba(139,124,255,0.35), transparent 60%), linear-gradient(150deg,#0c1220,#070b16)",
                    }}
                  >
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid h-14 w-14 place-items-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur">
                        <UiIcon name="play" className="h-5 w-5 translate-x-[1px]" strokeWidth={2} />
                      </span>
                    </span>
                    <span className="absolute inset-x-2.5 top-2.5 flex items-center justify-between">
                      <span className="chip !border-white/20 !bg-black/45 !text-[0.6rem] !text-white/85 backdrop-blur">
                        <UiIcon name="check" className="h-3 w-3 text-mint" /> جاهز
                      </span>
                      <span className="chip !border-white/20 !bg-black/45 !text-[0.6rem] !text-white/85 backdrop-blur">
                        MP4 · 1080p
                      </span>
                    </span>
                    <span className="absolute inset-x-2.5 bottom-2.5 rounded-lg bg-black/45 px-2 py-1.5 text-[0.65rem] font-bold leading-4 text-white/90 backdrop-blur">
                      جولة سريعة داخل استوديو التصميم
                      <span className="mt-0.5 block font-mono text-[0.55rem] font-normal text-white/50">
                        Abd Studio · 00:42
                      </span>
                    </span>
                  </div>
                </div>

                <dl className="mt-3 space-y-1.5 text-[0.7rem]">
                  {[
                    ["المنصة", "YouTube"],
                    ["الصيغة", "MP4 — H.264"],
                    ["الحجم", "24.8 MB"],
                    ["الحالة", "تم الاستخراج"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between border-b border-white/[0.05] pb-1.5 last:border-0 last:pb-0">
                      <dt className="text-mist/40">{label}</dt>
                      <dd className="font-semibold text-mist/80">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="btn-primary pointer-events-none mt-3 w-full !py-2 !text-xs">
                  <UiIcon name="download" className="h-4 w-4" />
                  تنزيل الآن
                </div>
              </div>

              {/* engine card */}
              <div className="glass rounded-3xl p-4">
                <h2 className="flex items-center gap-2 text-[0.82rem] font-extrabold text-white">
                  <UiIcon name="server" className="h-4 w-4 text-iris" />
                  محرك الاستخراج
                </h2>
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      stats.engine.ytdlp ? "bg-mint shadow-[0_0_8px_rgba(53,230,194,0.8)]" : "bg-amber-300"
                    }`}
                  />
                  <span className="text-[0.78rem] font-bold text-white/85">
                    {stats.engine.ytdlp ? "yt-dlp متصل وجاهز" : "وضع الروابط المباشرة"}
                  </span>
                </div>
                <p className="mt-2 text-[0.7rem] leading-6 text-mist/50">
                  {stats.engine.ytdlp
                    ? "المحرك يدعم أكثر من 1000 موقع، ويختار أفضل ملف متاح ضمن حد 300 ميجابايت."
                    : "يمكنك تنزيل الروابط المباشرة والملف التجريبي الآن. ثبّت yt-dlp على الخادم لتشغيل روابط المنصات."}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {["MP4", "WEBM", "M4A"].map((format) => (
                    <span
                      key={format}
                      className="rounded-lg border border-white/10 bg-white/[0.03] py-1 text-center font-mono text-[0.62rem] font-bold text-mist/70"
                    >
                      {format}
                    </span>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[0.66rem] text-mist/35">
                  <UiIcon name="lock" className="h-3 w-3" />
                  {formatNumber(stats.total)} عملية معالجة على الخادم
                </p>
              </div>

              {/* tips */}
              <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-4">
                <h2 className="flex items-center gap-2 text-[0.82rem] font-extrabold text-white/90">
                  <UiIcon name="sparkle" className="h-4 w-4 text-coral" />
                  نصائح سريعة
                </h2>
                <ul className="mt-2.5 space-y-2 text-[0.7rem] leading-6 text-mist/50">
                  <li>• استخدم رابط الفيديو نفسه، لا رابط الصفحة الرئيسية للمنصة.</li>
                  <li>• إن كان الفيديو خاصاً فلن يعمل — العامة فقط مدعومة.</li>
                  <li>• عند فشل المنصة جرّب صيغة أخرى أو رابطاً مباشراً.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        {/* -------------------------------- features ------------------------------ */}
        <section id="features" className="page-shell pb-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="chip mb-3">
                <UiIcon name="shield" className="h-3.5 w-3.5 text-mint" /> لماذا نحن
              </span>
              <h2 className="text-[clamp(1.5rem,3.4vw,2.1rem)] font-extrabold leading-snug text-white">
                أداة خفيفة… <span className="text-gradient">ومصممة للسرعة</span>
              </h2>
            </div>
            <p className="max-w-sm text-[0.78rem] leading-7 text-mist/45">
              لا سكربتات تتبّع، لا نوافذ منبثقة، ولا خطوات زائدة بين الرابط والملف.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <Reveal
                as="article"
                key={feature.title}
                delay={index * 70}
                className="glass glass-hover rounded-3xl p-5"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-mint">
                  <UiIcon name={feature.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-3.5 text-[0.9rem] font-extrabold text-white">{feature.title}</h3>
                <p className="mt-1.5 text-[0.74rem] leading-7 text-mist/50">{feature.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* --------------------------------- steps -------------------------------- */}
        <section id="how" className="page-shell pb-16">
          <div className="glass relative overflow-hidden rounded-[32px] p-6 sm:p-9">
            <div
              className="pointer-events-none absolute -top-24 h-56 w-56 rounded-full opacity-70 blur-3xl"
              style={{
                insetInlineStart: "33%",
                background: "radial-gradient(circle, rgba(53,230,194,0.28), transparent 70%)",
              }}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-[clamp(1.4rem,3.2vw,2rem)] font-extrabold text-white">
                ثلاث خطوات… <span className="text-mint">وثلاث ثوانٍ</span>
              </h2>
              <span className="chip">
                <UiIcon name="mobile" className="h-3.5 w-3.5" /> يعمل على الجوال والكمبيوتر
              </span>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <Reveal
                  key={step.title}
                  delay={index * 90}
                  className="relative rounded-2xl border border-white/[0.07] bg-black/20 p-5"
                >
                  <span className="absolute -top-3 inset-inline-start-5 rounded-full border border-mint/30 bg-[#081410] px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-mint">
                    0{index + 1}
                  </span>
                  <UiIcon name={step.icon} className="h-5 w-5 text-mint/80" />
                  <h3 className="mt-3 text-[0.9rem] font-extrabold text-white">{step.title}</h3>
                  <p className="mt-1.5 text-[0.74rem] leading-7 text-mist/50">{step.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------- platforms ------------------------------ */}
        <section id="platforms" className="page-shell pb-16">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[clamp(1.4rem,3.2vw,2rem)] font-extrabold text-white">
                منصات <span className="text-gradient">مدعومة</span>
              </h2>
              <p className="mt-1 text-[0.78rem] text-mist/45">اختر منصتك، وابحث عن رابط الفيديو مباشرةً.</p>
            </div>
            <span className="chip">
              <UiIcon name="globe" className="h-3.5 w-3.5 text-iris" /> +1000 موقع عبر yt-dlp
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {FEATURED_PLATFORMS.map((platform, index) => (
              <Reveal key={platform.id} delay={index * 45}>
              <a
                href="#download"
                className="glass glass-hover flex items-center gap-3 rounded-2xl p-3.5"
              >
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10"
                  style={{
                    background: `linear-gradient(150deg, ${platform.accent}26, rgba(255,255,255,0.03))`,
                    color: platform.accent,
                  }}
                >
                  <BrandIcon platform={platform.id} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.82rem] font-bold text-white/90">{platform.name}</span>
                  <span className="block text-[0.65rem] text-mist/45">{platform.nameAr}</span>
                </span>
              </a>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------------------------- faq --------------------------------- */}
        <section id="faq" className="page-shell pb-16">
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div>
              <span className="chip mb-3">
                <UiIcon name="sparkle" className="h-3.5 w-3.5 text-coral" /> أسئلة متكررة
              </span>
              <h2 className="text-[clamp(1.4rem,3.2vw,2rem)] font-extrabold leading-snug text-white">
                كل ما تريد معرفته
                <span className="block text-gradient">قبل التنزيل</span>
              </h2>
              <p className="mt-3 text-[0.78rem] leading-7 text-mist/45">
                لم تجد إجابتك؟ جرّب رابطاً مباشراً أو راجع سجل العمليات لمعرفة سبب فشل الطلب.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-mint/20 bg-mint/[0.05] p-3 text-[0.72rem] leading-6 text-mint/80">
                <UiIcon name="shield" className="h-4 w-4 shrink-0" />
                لا نطلب أي بيانات شخصية، ولا يوجد نظام حسابات في الموقع.
              </div>
            </div>

            <div className="space-y-2.5">
              {FAQ.map((item, index) => (
                <details
                  key={item.q}
                  className="faq-item glass rounded-2xl px-4 py-3.5 transition open:border-mint/25"
                  open={index === 0}
                >
                  <summary className="flex items-center justify-between gap-3 text-[0.84rem] font-bold text-mist/85">
                    <span>{item.q}</span>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-mist/60">
                      <UiIcon name="chevron" className="faq-chevron h-4 w-4 transition-transform" />
                    </span>
                  </summary>
                  <p className="mt-2.5 border-t border-white/[0.06] pt-2.5 text-[0.76rem] leading-7 text-mist/55">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------- legal -------------------------------- */}
        <section className="page-shell pb-16">
          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.05] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-300/30 bg-amber-300/10 text-amber-200">
                <UiIcon name="alert" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[0.9rem] font-extrabold text-amber-100">إخلاء مسؤولية واستخدام عادل</h2>
                <p className="mt-2 max-w-4xl text-[0.74rem] leading-7 text-amber-100/65">
                  هذه الأداة مخصصة للاستخدام الشخصي على محتوى تملكه أو لديك إذن صريح بتنزيله. تحميل المحتوى
                  من منصات التواصل يخضع لشروط الخدمة وسياسات حقوق النشر الخاصة بكل منصة (DMCA وغيرها).
                  لا يتحمّل صاحب الموقع أي مسؤولية عن إساءة الاستخدام. لا نخزّن ملفات الفيديو على الخادم،
                  ولا نتجاوز أي إجراءات حماية تقنية للمحتوى المدفوع أو الخاص.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] bg-black/25">
        <div className="page-shell py-9">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <Logo size={36} />
                <span className="text-[0.92rem] font-extrabold text-white">حمل معاء عبود</span>
              </div>
              <p className="mt-2.5 text-[0.74rem] leading-7 text-mist/45">
                أداة عربية خفيفة لاستخراج الفيديو من روابط المنصات وتنزيله مباشرةً كملف. بدون حساب،
                وبدون تخزين على الخادم.
              </p>
              <div className="mt-3 flex items-center gap-2 text-mist/35">
                {FEATURED_PLATFORMS.slice(0, 6).map((platform) => (
                  <span key={platform.id} title={platform.nameAr}>
                    <BrandIcon platform={platform.id} className="h-3.5 w-3.5" />
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-[0.74rem] text-mist/50 sm:grid-cols-3">
              <a href="#download" className="transition hover:text-white">
                التحميل
              </a>
              <a href="#how" className="transition hover:text-white">
                كيف يعمل
              </a>
              <a href="#features" className="transition hover:text-white">
                المزايا
              </a>
              <a href="#platforms" className="transition hover:text-white">
                المنصات
              </a>
              <a href="#activity" className="transition hover:text-white">
                سجل العمليات
              </a>
              <a href="#faq" className="transition hover:text-white">
                الأسئلة
              </a>
            </div>
          </div>

          <div className="divider my-6" />

          <div className="flex flex-wrap items-center justify-between gap-2 text-[0.68rem] text-mist/35">
            <span>© ٢٠٢٦ حمل معاء عبود — جميع الحقوق محفوظة.</span>
            <span className="flex items-center gap-2">
              <UiIcon name="lock" className="h-3 w-3" />
              اتصال مشفّر · للاستخدام الشخصي فقط
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
