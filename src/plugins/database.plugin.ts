import fp from 'fastify-plugin';

import { db } from '../prisma/db.js';

export default fp(async (fastify) => {
  await db.connect();

  fastify.addHook('onClose', async () => {
    await db.close();
  });
});