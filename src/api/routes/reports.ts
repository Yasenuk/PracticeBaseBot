import { Router } from 'express';
import { prisma } from '../../db/prisma';

export const reportsRouter = Router();

reportsRouter.get('/', async (req, res) => {
  const reports = await prisma.report.findMany({
    include: { student: { select: { name: true } }, grade: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(reports);
});