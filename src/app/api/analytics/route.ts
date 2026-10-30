import { db } from '@/lib/db';
import { jsonError, requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/analytics — aggregated counts + demo-labelled trend series
export async function GET() {
  try {
    await requireUser();
    const [incidents, assessments, recommendations, tasks] = await Promise.all([
      db.incident.findMany({ select: { category: true, status: true, severity: true, createdAt: true, city: true } }),
      db.riskAssessment.findMany({ select: { severity: true, score: true, city: true, createdAt: true } }),
      db.recommendation.findMany({ select: { status: true, priority: true } }),
      db.assignedTask.findMany({ select: { status: true, city: true } }),
    ]);

    // Demo-labelled 14-day risk trend (deterministic shape, clearly not real telemetry)
    const trend = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000);
      const base = 42 + 18 * Math.sin(i / 3.1) + (i % 5);
      return {
        date: d.toISOString().slice(5, 10),
        score: Math.round(base),
        demo: true,
      };
    });

    const byCategory: Record<string, number> = {};
    incidents.forEach((i) => (byCategory[i.category] = (byCategory[i.category] ?? 0) + 1));
    const severityMix: Record<string, number> = {};
    assessments.forEach((a) => (severityMix[a.severity] = (severityMix[a.severity] ?? 0) + 1));
    const interventionFunnel: Record<string, number> = {};
    recommendations.forEach((r) => (interventionFunnel[r.status] = (interventionFunnel[r.status] ?? 0) + 1));
    const taskStatus: Record<string, number> = {};
    tasks.forEach((t) => (taskStatus[t.status] = (taskStatus[t.status] ?? 0) + 1));

    return Response.json({
      totals: {
        incidents: incidents.length,
        openIncidents: incidents.filter((i) => ['OPEN', 'ACKNOWLEDGED'].includes(i.status)).length,
        assessments: assessments.length,
        pendingRecs: recommendations.filter((r) => r.status === 'PENDING').length,
        activeTasks: tasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length,
        critical: assessments.filter((a) => a.severity === 'CRITICAL').length,
      },
      trend,
      byCategory,
      severityMix,
      interventionFunnel,
      taskStatus,
      note: 'Trend series is demonstration data; category/severity/funnel charts aggregate live platform records.',
    });
  } catch (err) {
    return jsonError(err);
  }
}
