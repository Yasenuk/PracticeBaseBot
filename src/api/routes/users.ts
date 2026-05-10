import { Router } from 'express';
import { prisma } from '../../db/prisma';

export const usersRouter = Router();

usersRouter.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, createdAt: true },
  });
  res.json(users);
});

usersRouter.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { reports: true, tasks: true },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});