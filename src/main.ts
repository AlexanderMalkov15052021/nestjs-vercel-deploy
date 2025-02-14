import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { createClient } from 'redis';

import * as session from 'express-session'
import { ms, StringValue } from './libs/common/utils/ms.util'
import { parseBoolean } from './libs/common/utils/parse-boolean.util'
import { RedisStore } from 'connect-redis'

import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const redis = await createClient({ url: process.env.REDIS_URL }).connect();

  app.use(
    (session as any)({  // ругается vercel без as any
      secret: process.env.SESSION_SECRET,
      name: process.env.SESSION_NAME,
      resave: true,
      saveUninitialized: false,
      cookie: {
        domain: process.env.SESSION_DOMAIN,
        maxAge: ms(process.env.SESSION_MAX_AGE as StringValue),
        httpOnly: parseBoolean(
          process.env.SESSION_HTTP_ONLY
        ),
        secure: parseBoolean(
          process.env.SESSION_SECURE
        ),
        sameSite: 'lax'
      },
      store: new RedisStore({
        client: redis,
        prefix: process.env.SESSION_FOLDER
      })
    })
  )

  await app.listen(process.env.APPLICATION_PORT ?? 3000);
}
bootstrap();
