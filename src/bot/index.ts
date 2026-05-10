import { Telegraf, session, Scenes } from 'telegraf';
import { BotContext, authMiddleware } from './middleware/auth';
import { registerScene } from './scenes/register.scene';
import { reportScene } from './scenes/report.scene';
import { taskScene } from './scenes/task.scene';
import { studentHandler } from './handlers/student.handler';
import { mentorHandler } from './handlers/mentor.handler';
import { adminHandler } from './handlers/admin.handler';
import { sendStudentMenu } from './handlers/student.handler';
import { sendMentorMenu } from './handlers/mentor.handler';
import { sendAdminMenu } from './handlers/admin.handler';

export function createBot() {
  const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN!);

  const stage = new Scenes.Stage<BotContext>([
    registerScene,
    reportScene,
    taskScene,
  ]);

  bot.use(session());
  bot.use(stage.middleware());
  bot.use(authMiddleware);

  bot.start(async (ctx) => {
    if (ctx.dbUser) {
      await ctx.reply(`З поверненням, ${ctx.dbUser.name}! Введіть /menu`);
      return;
    }
    await ctx.scene.enter('register');
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      '📖 Доступні команди:\n/start - Реєстрація\n/menu - Головне меню\n/help - Допомога'
    );
  });

  bot.use(studentHandler);
  bot.use(mentorHandler);
  bot.use(adminHandler);

  // Виклик меню напряму залежно від ролі
  bot.command('menu', async (ctx) => {
    if (!ctx.dbUser) {
      await ctx.reply('Спочатку зареєструйтесь: /start');
      return;
    }

    switch (ctx.dbUser.role) {
      case 'STUDENT': return sendStudentMenu(ctx);
      case 'MENTOR':  return sendMentorMenu(ctx);
      case 'ADMIN':   return sendAdminMenu(ctx);
    }
  });

  bot.on('message', async (ctx) => {
    if (!ctx.dbUser) {
      await ctx.reply('Спочатку зареєструйтесь: /start');
    }
  });

  return bot;
}