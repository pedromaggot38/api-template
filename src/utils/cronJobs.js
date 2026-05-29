import cron from 'node-cron';
import db from '../config/db.js';

export const initCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[CRON] Iniciando limpeza de refresh tokens obsoletos...');

      const agora = new Date();

      const resultado = await db.refreshToken.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: agora } }, { revoked: true }],
        },
      });

      console.log(
        `[CRON] Limpeza concluída. ${resultado.count} tokens removidos.`,
      );
    } catch (error) {
      console.error('[CRON] Erro ao limpar tokens do banco de dados:', error);
    }
  });
};
