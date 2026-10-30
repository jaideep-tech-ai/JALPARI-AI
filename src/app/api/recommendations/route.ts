import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ApiError, jsonError, requireUser, isOperationalUser, audit } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/recommendations?status=&priority=
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const sp = req.nextUrl.searchParams;
    const status = sp.get('status') ?? undefined;
    const recs = await db.recommendation.findMany({
      where: status ? { status } : {},
      include: {
        asset: { select: { name: true, code: true, city: true, lat: true, lon: true } },
        assessment: { select: { score: true, severity: true, factors: true, confidence: true, source: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
    return Response.json({ recommendations: recs });
  } catch (err) {
    return jsonError(err);
  }
}

// PATCH /api/recommendations — accept (→ task) or reject (authorized officers)
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!isOperationalUser(user)) throw new ApiError(403, 'Insufficient permissions for this action');
    const b = await req.json();
    const id = b.id as string;
    const decision = b.decision as 'accept' | 'reject';
    if (!id || !['accept', 'reject'].includes(decision)) throw new ApiError(400, 'Missing id or decision');
    const rec = await db.recommendation.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!rec) throw new ApiError(404, 'Recommendation not found');
    if (rec.status !== 'PENDING') throw new ApiError(400, 'Recommendation was already decided');

    if (decision === 'reject') {
      await db.recommendation.update({
        where: { id },
        data: { status: 'REJECTED', decidedBy: user.email, decidedAt: new Date() },
      });
      await audit({ id: user.id, email: user.email }, 'RECOMMENDATION_REJECTED', id);
      return Response.json({ ok: true, status: 'REJECTED' });
    }

    // Accept → create the intervention task automatically
    const candidates = await db.user.findMany({
      where: { role: { in: ['field', 'infra'] }, roleStatus: 'APPROVED' },
      include: { assignedTasks: { where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } } },
    });
    candidates.sort((a, c) => a.assignedTasks.length - c.assignedTasks.length);
    const assigneeId = candidates[0]?.id ?? null;

    const task = await db.assignedTask.create({
      data: {
        title: rec.title,
        description: `${rec.rationale}\n\nVerification: ${rec.verificationMethod ?? 'Field evidence with photos.'}`,
        type: rec.actionType,
        priority: rec.priority,
        assetId: rec.assetId,
        recommendationId: rec.id,
        assignedToId: assigneeId,
        createdById: user.id,
        city: rec.asset?.city ?? null,
        dueAt: new Date(Date.now() + (rec.priority === 'URGENT' ? 1 : 3) * 24 * 3600 * 1000),
      },
    });
    await db.recommendation.update({
      where: { id },
      data: { status: 'CONVERTED', decidedBy: user.email, decidedAt: new Date() },
    });
    if (assigneeId) {
      await db.notification.create({
        data: { userId: assigneeId, title: `New task: ${task.title}`, body: `Priority ${task.priority}.`, type: 'TASK' },
      });
    }
    await audit({ id: user.id, email: user.email }, 'RECOMMENDATION_ACCEPTED', `${id} → task ${task.id}`);
    return Response.json({ ok: true, status: 'CONVERTED', taskId: task.id });
  } catch (err) {
    return jsonError(err);
  }
}
