import { Composer, Markup } from 'telegraf';
import { BotContext } from '../middleware/auth';
import { prisma } from '../../db/prisma';

export const studentHandler = new Composer<BotContext>();

export async function sendStudentMenu(ctx: BotContext) {
  await ctx.reply(
    `Привіт, ${ctx.dbUser!.name}! 👋\nОберіть дію:`,
    Markup.keyboard([
      ['📝 Подати звіт', '📋 Мої завдання'],
      ['📊 Мої звіти', '🏆 Мої оцінки'],
    ]).resize()
  );
}

studentHandler.hears('📝 Подати звіт', async (ctx) => {
  await ctx.scene.enter('report');
});

studentHandler.hears('📋 Мої завдання', async (ctx) => {
  const tasks = await prisma.task.findMany({
    where: { studentId: ctx.dbUser!.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  if (tasks.length === 0) {
    await ctx.reply('У вас немає активних завдань.');
    return;
  }

  const statusEmoji = { PENDING: '⏳', IN_PROGRESS: '🔄', DONE: '✅' };
  const text = tasks
    .map((t) => `${statusEmoji[t.status]} *${t.title}*\n${t.description}`)
    .join('\n\n');

  await ctx.reply(text, { parse_mode: 'Markdown' });
});

studentHandler.hears('📊 Мої звіти', async (ctx) => {
  const reports = await prisma.report.findMany({
    where: { studentId: ctx.dbUser!.id },
    orderBy: { createdAt: 'desc' },
    take: 7,
  });

  if (reports.length === 0) {
    await ctx.reply('Звітів ще немає.');
    return;
  }

  const text = reports
    .map((r) => {
      const date = r.createdAt.toLocaleDateString('uk-UA');
      return `📅 ${date} | ⏱ ${r.hoursWorked}год\n${r.content}`;
    })
    .join('\n\n---\n\n');

  await ctx.reply(text);
});

studentHandler.hears('🏆 Мої оцінки', async (ctx) => {
  const grades = await prisma.grade.findMany({
    where: { report: { studentId: ctx.dbUser!.id } },
    include: { report: true, mentor: true },
    orderBy: { createdAt: 'desc' },
  });

  if (grades.length === 0) {
    await ctx.reply('Оцінок ще немає.');
    return;
  }

  const text = grades
    .map((g) => {
      const date = g.createdAt.toLocaleDateString('uk-UA');
      return `📅 ${date}\n⭐ Оцінка: ${g.score}/100\n👨‍🏫 Керівник: ${g.mentor.name}${g.comment ? `\n💬 ${g.comment}` : ''}`;
    })
    .join('\n\n---\n\n');

  await ctx.reply(text);
});