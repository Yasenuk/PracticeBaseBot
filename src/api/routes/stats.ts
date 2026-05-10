import { Router } from 'express';
import { prisma } from '../../db/prisma';

export const statsRouter = Router();

statsRouter.get('/', async (_req, res) => {
  const [totalUsers, totalReports, totalTasks, gradeStats] = await Promise.all([
    prisma.user.count(),
    prisma.report.count(),
    prisma.task.count(),
    prisma.grade.aggregate({ _avg: { score: true }, _count: true }),
  ]);

  const byRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
  });

  res.json({
    totalUsers,
    totalReports,
    totalTasks,
    averageGrade: gradeStats._avg.score,
    totalGrades: gradeStats._count,
    usersByRole: Object.fromEntries(byRole.map((r : any) => [r.role, r._count.id])),
  });
});