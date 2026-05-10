import { Composer, Markup } from 'telegraf';
import { BotContext } from '../middleware/auth';
import { prisma } from '../../db/prisma';

export const adminHandler = new Composer<BotContext>();

export async function sendAdminMenu(ctx: BotContext) {
  await ctx.reply(
    `👑 Адмін-панель`,
    Markup.keyboard([
      ['📊 Статистика', '👥 Всі користувачі'],
      ['📝 Всі звіти', '🗑 Видалити користувача'],
    ]).resize()
  );
}

adminHandler.hears('📊 Статистика', async (ctx) => {
  if (ctx.dbUser?.role !== 'ADMIN') return;

  const [users, reports, tasks, grades] = await Promise.all([
    prisma.user.count(),
    prisma.report.count(),
    prisma.task.count(),
    prisma.grade.aggregate({ _avg: { score: true }, _count: true }),
  ]);

  const students = await prisma.user.count({ where: { role: 'STUDENT' } });
  const mentors = await prisma.user.count({ where: { role: 'MENTOR' } });

  await ctx.reply(
    `📊 *Статистика системи*\n\n` +
    `👥 Користувачів: ${users}\n` +
    `👨‍🎓 Студентів: ${students}\n` +
    `👨‍🏫 Керівників: ${mentors}\n\n` +
    `📝 Звітів: ${reports}\n` +
    `📋 Завдань: ${tasks}\n` +
    `🏆 Оцінок: ${grades._count}\n` +
    `⭐ Середня оцінка: ${grades._avg.score?.toFixed(1) ?? 'N/A'}/100`,
    { parse_mode: 'Markdown' }
  );
});

adminHandler.hears('👥 Всі користувачі', async (ctx) => {
  if (ctx.dbUser?.role !== 'ADMIN') return;

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  const roleEmoji = { STUDENT: '👨‍🎓', MENTOR: '👨‍🏫', ADMIN: '🔑' };

  const text = users
    .map((u) => `${roleEmoji[u.role]} ${u.name} (ID: ${u.id})`)
    .join('\n');

  await ctx.reply(text || 'Користувачів немає.');
});

adminHandler.hears('📝 Всі звіти', async (ctx) => {
  if (ctx.dbUser?.role !== 'ADMIN') return;

  const reports = await prisma.report.findMany({
    include: { student: true, grade: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const text = reports
    .map((r) => {
      const date = r.createdAt.toLocaleDateString('uk-UA');
      const grade = r.grade ? `⭐${r.grade.score}` : '⏳';
      return `${grade} | ${date} | ${r.student.name} | ${r.hoursWorked}год`;
    })
    .join('\n');

  await ctx.reply(text || 'Звітів немає.');
});

// /deleteuser_<id>
adminHandler.hears(/^\/deleteuser_(\d+)$/, async (ctx) => {
  if (ctx.dbUser?.role !== 'ADMIN') return;

  const userId = parseInt(ctx.match[1], 10);

  try {
    await prisma.user.delete({ where: { id: userId } });
    await ctx.reply(`✅ Користувача #${userId} видалено.`);
  } catch {
    await ctx.reply('❌ Помилка видалення.');
  }
});

adminHandler.hears('🗑 Видалити користувача', async (ctx) => {
  await ctx.reply('Використайте команду: /deleteuser_<ID>\nID можна знайти у списку користувачів.');
});