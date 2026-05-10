import 'dotenv/config';
import { createBot } from './bot';
import { createApi } from './api';

async function main() {
  const port = parseInt(process.env.PORT ?? '3000', 10);

  // Start Express API
  const api = createApi();
  api.listen(port, () => {
    console.log(`🌐 API запущено на порту ${port}`);
  });

  // Start Telegram bot
  const bot = createBot();
  await bot.launch();
  console.log('🤖 Бот запущено');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch(console.error);