import 'dotenv/config';
import app from './app.js';
import { initCronJobs } from './utils/cronJobs.js';

const PORT = process.env.PORT || 3000;

initCronJobs();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor pronto na porta ${PORT}`);
});
