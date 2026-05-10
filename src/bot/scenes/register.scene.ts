import { Scenes, Markup } from 'telegraf';
import { BotContext } from '../middleware/auth';
import { prisma } from '../../db/prisma';

export const registerScene = new Scenes.WizardScene<BotContext>(
  'register',
  // Step 1: Ask name
  async (ctx) => {
    await ctx.reply('👋 Введіть ваше повне ім\'я:');
    return ctx.wizard.next();
  },
  // Step 2: Ask role
  async (ctx) => {
    const name = ctx.message && 'text' in ctx.message ? ctx.message.text : null;
    if (!name) {
      await ctx.reply('Будь ласка, введіть текстове ім\'я.');
      return;
    }

    (ctx.wizard.state as Record<string, string>).name = name;

    await ctx.reply(
      'Оберіть вашу роль:',
      Markup.keyboard([['👨‍🎓 Студент', '👨‍🏫 Керівник', '🔑 Адмін']])
        .oneTime()
        .resize()
    );
    return ctx.wizard.next();
  },
  // Step 3: Handle role (+ optional admin secret)
  async (ctx) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const state = ctx.wizard.state as Record<string, string>;

    const roleMap: Record<string, 'STUDENT' | 'MENTOR' | 'ADMIN'> = {
      '👨‍🎓 Студент': 'STUDENT',
      '👨‍🏫 Керівник': 'MENTOR',
      '🔑 Адмін': 'ADMIN',
    };

    const role = roleMap[text];
    if (!role) {
      await ctx.reply('Оберіть роль з клавіатури.');
      return;
    }

    if (role === 'ADMIN') {
      state.role = role;
      await ctx.reply('Введіть секретний код адміна:', Markup.removeKeyboard());
      return ctx.wizard.next();
    }

    await createUser(ctx, state.name, role);
    return ctx.scene.leave();
  },
  // Step 4: Admin secret verification
  async (ctx) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const state = ctx.wizard.state as Record<string, string>;

    if (text !== process.env.ADMIN_SECRET) {
      await ctx.reply('❌ Невірний секретний код. Реєстрацію скасовано.');
      return ctx.scene.leave();
    }

    await createUser(ctx, state.name, 'ADMIN');
    return ctx.scene.leave();
  }
);

async function createUser(ctx: BotContext, name: string, role: 'STUDENT' | 'MENTOR' | 'ADMIN') {
  const telegramId = ctx.from!.id.toString();

  try {
    const user = await prisma.user.create({
      data: { telegramId, name, role },
    });

    const roleEmoji = { STUDENT: '👨‍🎓', MENTOR: '👨‍🏫', ADMIN: '🔑' }[role];
    await ctx.reply(
      `✅ Реєстрацію завершено!\n${roleEmoji} ${user.name}\nРоль: ${role}\n\nВведіть /menu для початку роботи.`,
      Markup.removeKeyboard()
    );
  } catch {
    await ctx.reply('❌ Помилка реєстрації. Можливо, ви вже зареєстровані.');
  }
}