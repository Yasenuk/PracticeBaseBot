import { Context, MiddlewareFn } from 'telegraf';
import { Scenes } from 'telegraf';
import { prisma } from '../../db/prisma';
import { User } from '@prisma/client';

interface BotSession extends Scenes.WizardSession {
  // кастомні поля сесії якщо потрібні
}

export interface BotContext extends Context, Scenes.WizardContext {
  session: BotSession;
  dbUser?: User;
}

export const authMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.from) return next();

  const telegramId = ctx.from.id.toString();
  const user = await prisma.user.findUnique({ where: { telegramId } });

  if (user) ctx.dbUser = user;

  return next();
};