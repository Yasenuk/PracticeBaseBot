import { Scenes, Markup } from 'telegraf';
import { BotContext } from '../middleware/auth';
import { prisma } from '../../db/prisma';

export const taskScene = new Scenes.WizardScene<BotContext>(
  'createTask',
  // Step 1: Choose student
  async (ctx) => {
    const students = await prisma.user.findMany({ where: { role: 'STUDENT' } });

    if (students.length === 0) {
      await ctx.reply('❌ Студентів не знайдено.');
      return ctx.scene.leave();
    }

    const buttons = students.map((s) => [`${s.id}: ${s.name}`]);
    await ctx.reply(
      'Оберіть студента:',
      Markup.keyboard(buttons).oneTime().resize()
    );
    return ctx.wizard.next();
  },
  // Step 2: Task title
  async (ctx) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const [idStr] = text.split(':');
    const studentId = parseInt(idStr.trim(), 10);

    if (isNaN(studentId)) {
      await ctx.reply('Оберіть студента зі списку.');
      return;
    }

    (ctx.wizard.state as Record<string, string | number>).studentId = studentId;
    await ctx.reply('📌 Введіть назву завдання:', Markup.removeKeyboard());
    return ctx.wizard.next();
  },
  // Step 3: Description
  async (ctx) => {
    const title = ctx.message && 'text' in ctx.message ? ctx.message.text : null;
    if (!title) return;

    (ctx.wizard.state as Record<string, string | number>).title = title;
    await ctx.reply('📋 Введіть опис завдання:');
    return ctx.wizard.next();
  },
  // Step 4: Save
  async (ctx) => {
    const description = ctx.message && 'text' in ctx.message ? ctx.message.text : null;
    if (!description) return;

    const state = ctx.wizard.state as Record<string, string | number>;

    const task = await prisma.task.create({
      data: {
        title: state.title as string,
        description,
        studentId: state.studentId as number,
        mentorId: ctx.dbUser!.id,
      },
      include: { student: true },
    });

    await ctx.reply(`✅ Завдання "${task.title}" призначено студенту ${task.student.name}.`);
    return ctx.scene.leave();
  }
);