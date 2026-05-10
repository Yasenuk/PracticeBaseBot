import { Composer, Markup } from 'telegraf';
import { BotContext } from '../middleware/auth';
import { prisma } from '../../db/prisma';

export const mentorHandler = new Composer<BotContext>();

export async function sendMentorMenu(ctx: BotContext) {
  await ctx.reply(
    `Привіт, ${ctx.dbUser!.name}! 👋`,
    Markup.keyboard([
      ['📋 Призначити завдання', '📝 Перевірити звіти'],
      ['👥 Мої студенти'],
    ]).resize()
  );
}

mentorHandler.hears('📋 Призначити завдання', async (ctx) => {
  await ctx.scene.enter('createTask');
});

mentorHandler.hears('📝 Перевірити звіти', async (ctx) => {
  // Get ungrades reports of students assigned to this mentor
  const reports = await prisma.report.findMany({
    where: {
      grade: null,
      student: {
        tasks: { some: { mentorId: ctx.dbUser!.id } },
      },
    },
    include: { student: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (reports.length === 0) {
    await ctx.reply('✅ Всі звіти перевірено!');
    return;
  }

  for (const report of reports) {
    const date = report.createdAt.toLocaleDateString('uk-UA');
    await ctx.reply(
      `📅 ${date} | 👨‍🎓 ${report.student.name} | ⏱ ${report.hoursWorked}год\n\n${report.content}\n\nДля оцінки: /grade_${report.id}_<SCORE>_<COMMENT>`
    );
  }
});

// /grade_<reportId>_<score>_<comment>
mentorHandler.hears(/^\/grade_(\d+)_(\d+)_?(.*)$/, async (ctx) => {
  const match = ctx.match;
  const reportId = parseInt(match[1], 10);
  const score = parseInt(match[2], 10);
  const comment = match[3] || undefined;

  if (score < 1 || score > 100) {
    await ctx.reply('Оцінка має бути від 1 до 100.');
    return;
  }

  try {
    await prisma.grade.create({
      data: {
        score,
        comment,
        reportId,
        mentorId: ctx.dbUser!.id,
      },
    });
    await ctx.reply(`✅ Оцінку ${score}/100 виставлено!`);
  } catch {
    await ctx.reply('❌ Помилка. Звіт вже оцінено або не знайдено.');
  }
});

mentorHandler.hears('👥 Мої студенти', async (ctx) => {
  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      tasks: { some: { mentorId: ctx.dbUser!.id } },
    },
    include: {
      reports: true,
      tasks: { where: { mentorId: ctx.dbUser!.id } },
    },
  });

  if (students.length === 0) {
    await ctx.reply('У вас немає студентів.');
    return;
  }

  const text = students
    .map((s) => `👨‍🎓 ${s.name}\n📋 Завдань: ${s.tasks.length} | 📝 Звітів: ${s.reports.length}`)
    .join('\n\n');

  await ctx.reply(text);
});