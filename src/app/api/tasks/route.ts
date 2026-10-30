import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ApiError, jsonError, requireUser, isOperationalUser, isFieldUser, audit } from '@/lib/auth';
import { TASK_TYPES } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const ALL_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DONE', 'CANCELLED'];

// GET /api/tasks?mine=1&status=
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const sp = req.nextUrl.searchParams;
    const mine = sp.get('mine') === '1';
    const status = sp.get('status') ?? undefined;
    const isOp = isOperationalUser(user);
    const tasks = await db.assignedTask.findMany({
      where: {
        ...(mine || !isOp ? { assignedToId: user.id } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        asset: { select: { name: true, code: true, city: true } },
        assignedTo: { select: { name: true, email: true } },
        incident: { select: { title: true, id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return Response.json({ tasks });
  } catch (err) {
    return jsonError(err);
  }
}

// POST /api/tasks — create work order (operational roles)
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!isOperationalUser(user)) throw new ApiError(403, 'Insufficient permissions for this action');
    const b = await req.json();
    const title = (b.title ?? '').trim();
    if (title.length < 4) throw new ApiError(400, 'Title must be at least 4 characters');
    const type = TASK_TYPES.includes(b.type) ? b.type : 'FIELD_INSPECTION';
    let assignedToId: string | null = null;
    if (b.assignedToId) {
      const target = await db.user.findUnique({ where: { id: b.assignedToId } });
      if (!target || !['field', 'infra'].includes(target.role ?? '') || target.roleStatus !== 'APPROVED') {
        throw new ApiError(400, 'Selected assignee is not an approved field operator');
      }
      assignedToId = target.id;
    } else {
      // auto-assign to the approved field operator with the fewest open tasks
      const candidates = await db.user.findMany({
        where: { role: { in: ['field', 'infra'] }, roleStatus: 'APPROVED' },
        include: { assignedTasks: { where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } } },
      });
      candidates.sort((a, c) => a.assignedTasks.length - c.assignedTasks.length);
      assignedToId = candidates[0]?.id ?? null;
    }
    const task = await db.assignedTask.create({
      data: {
        title,
        description: (b.description ?? '').toString(),
        type,
        priority: PRIORITY.includes(b.priority) ? b.priority : 'MEDIUM',
        assetId: b.assetId ?? null,
        incidentId: b.incidentId ?? null,
        recommendationId: b.recommendationId ?? null,
        assignedToId,
        createdById: user.id,
        city: b.city ?? null,
        dueAt: b.dueAt ? new Date(b.dueAt) : null,
      },
      include: { assignedTo: { select: { name: true } } },
    });
    if (b.recommendationId) {
      await db.recommendation.update({
        where: { id: b.recommendationId },
        data: { status: 'CONVERTED', decidedBy: user.email, decidedAt: new Date() },
      });
    }
    if (assignedToId) {
      await db.notification.create({
        data: {
          userId: assignedToId,
          title: `New task: ${task.title}`,
          body: `Priority ${task.priority}. Check My Tasks for details.`,
          type: 'TASK',
        },
      });
    }
    await audit({ id: user.id, email: user.email }, 'TASK_CREATED', `${task.id} → ${assignedToId ?? 'unassigned'}`);
    return Response.json({ ok: true, task });
  } catch (err) {
    return jsonError(err);
  }
}

// PATCH /api/tasks — field updates, submission, verification
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const b = await req.json();
    const id = b.id as string;
    const action = b.action as string;
    if (!id || !action) throw new ApiError(400, 'Missing task id or action');
    const task = await db.assignedTask.findUnique({ where: { id } });
    if (!task) throw new ApiError(404, 'Task not found');
    const isAssignee = task.assignedToId === user.id;
    const op = isOperationalUser(user);

    const evidence = JSON.parse(task.evidence || '[]') as { note: string; hasPhoto: boolean; at: string; author: string }[];

    switch (action) {
      case 'note': {
        if (!isAssignee && !op) throw new ApiError(403, 'Insufficient permissions for this action');
        const note = (b.note ?? '').toString().trim();
        if (note.length < 3) throw new ApiError(400, 'Note is too short');
        evidence.push({ note, hasPhoto: false, at: new Date().toISOString(), author: user.name });
        await db.assignedTask.update({ where: { id }, data: { evidence: JSON.stringify(evidence) } });
        break;
      }
      case 'evidence': {
        if (!isAssignee) throw new ApiError(403, 'Only the assigned field user can add evidence');
        const note = (b.note ?? '').toString().trim();
        if (note.length < 3) throw new ApiError(400, 'Evidence note is too short');
        evidence.push({ note, hasPhoto: Boolean(b.hasPhoto), at: new Date().toISOString(), author: user.name });
        await db.assignedTask.update({
          where: { id },
          data: { evidence: JSON.stringify(evidence), status: task.status === 'ASSIGNED' ? 'IN_PROGRESS' : task.status },
        });
        break;
      }
      case 'start': {
        if (!isAssignee) throw new ApiError(403, 'Only the assigned field user can start the task');
        if (task.status !== 'ASSIGNED') throw new ApiError(400, 'Task is not in ASSIGNED state');
        await db.assignedTask.update({ where: { id }, data: { status: 'IN_PROGRESS' } });
        break;
      }
      case 'submit': {
        if (!isAssignee) throw new ApiError(403, 'Only the assigned field user can submit for verification');
        if (!['ASSIGNED', 'IN_PROGRESS'].includes(task.status)) throw new ApiError(400, 'Task already submitted');
        const completionNote = (b.note ?? '').toString().trim();
        if (completionNote.length < 5) throw new ApiError(400, 'Add a completion summary (min 5 characters)');
        await db.assignedTask.update({
          where: { id },
          data: { status: 'SUBMITTED', completionNote },
        });
        if (task.createdById) {
          await db.notification.create({
            data: { userId: task.createdById, title: `Task submitted: ${task.title}`, body: 'Awaiting verification.', type: 'TASK' },
          });
        }
        break;
      }
      case 'verify': {
        if (!op) throw new ApiError(403, 'Insufficient permissions for this action');
        if (task.status !== 'SUBMITTED') throw new ApiError(400, 'Task is not awaiting verification');
        await db.assignedTask.update({
          where: { id },
          data: { status: 'APPROVED', verifiedById: user.id, verifiedAt: new Date(), verificationNote: b.note ?? null },
        });
        if (task.assignedToId) {
          await db.notification.create({
            data: { userId: task.assignedToId, title: `Task verified: ${task.title}`, body: 'Closure approved. Well done.', type: 'TASK' },
          });
        }
        await audit({ id: user.id, email: user.email }, 'TASK_VERIFIED', id);
        break;
      }
      case 'reject': {
        if (!op) throw new ApiError(403, 'Insufficient permissions for this action');
        if (task.status !== 'SUBMITTED') throw new ApiError(400, 'Task is not awaiting verification');
        await db.assignedTask.update({
          where: { id },
          data: { status: 'IN_PROGRESS', verifiedById: user.id, verificationNote: b.note ?? 'Reopened for rework.' },
        });
        if (task.assignedToId) {
          await db.notification.create({
            data: { userId: task.assignedToId, title: `Task reopened: ${task.title}`, body: b.note ?? 'Please address the supervisor feedback.', type: 'TASK' },
          });
        }
        await audit({ id: user.id, email: user.email }, 'TASK_REOPENED', id);
        break;
      }
      case 'cancel': {
        if (!op) throw new ApiError(403, 'Insufficient permissions for this action');
        await db.assignedTask.update({ where: { id }, data: { status: 'CANCELLED' } });
        await audit({ id: user.id, email: user.email }, 'TASK_CANCELLED', id);
        break;
      }
      default:
        throw new ApiError(400, 'Unknown task action');
    }
    const fresh = await db.assignedTask.findUnique({
      where: { id },
      include: { assignedTo: { select: { name: true } } },
    });
    return Response.json({ ok: true, task: fresh });
  } catch (err) {
    return jsonError(err);
  }
}
