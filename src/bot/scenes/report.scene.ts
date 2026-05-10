import { Scenes, Markup } from 'telegraf';
import { BotContext } from '../middleware/auth';
import { prisma } from '../../db/prisma';

export const reportScene = new Scenes.WizardScene<BotContext>(
  'report',
  // Step 1: Content
  async (ctx) => {
    await ctx.reply('📝 Опишіть що ви зробили сьогодні:', Markup.removeKeyboard());
    return ctx.wizard.next();
  },
  // Step 2: Hours
  async (ctx) => {
    const content = ctx.message && 'text' in ctx.message ? ctx.message.text : null;
    if (!content) return;

    (ctx.wizard.state as Record<string, string>).content = content;
    await ctx.reply('⏱ Скільки годин ви відпрацювали? (1-12)');
    return ctx.wizard.next();
  },
  // Step 3: Save
  async (ctx) => {
    const hoursText = ctx.message && 'text' in ctx.message ? ctx.message.text : '0';
    const hours = parseInt(hoursText, 10);
    const state = ctx.wizard.state as Record<string, string>;

    if (isNaN(hours) || hours < 1 || hours > 12) {
      await ctx.reply('Введіть число від 1 до 12.');
      return;
    }

    await prisma.report.create({
      data: {
        content: state.content,
        hoursWorked: hours,
        studentId: ctx.dbUser!.id,
      },
    });

    await ctx.reply('✅ Звіт збережено! Керівник перевірить його найближчим часом.');
    return ctx.scene.leave();
  }
);