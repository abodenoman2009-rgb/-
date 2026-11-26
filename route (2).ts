import { ensureSampleRows, getRecentJobs } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? "8");
  try {
    await ensureSampleRows();
    const jobs = await getRecentJobs(Number.isFinite(limit) ? limit : 8);
    return Response.json({ ok: true, jobs });
  } catch (error) {
    console.error("jobs list failed", error);
    return Response.json({ ok: false, jobs: [], error: "db_error" }, { status: 500 });
  }
}
