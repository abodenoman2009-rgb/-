import { ensureSampleRows, getStats } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSampleRows();
    const stats = await getStats();
    return Response.json({ ok: true, stats });
  } catch (error) {
    console.error("stats failed", error);
    return Response.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
