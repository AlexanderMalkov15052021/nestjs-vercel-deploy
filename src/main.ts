import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import IORedis from 'ioredis'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import { ms, StringValue } from './libs/common/utils/ms.util'
import { parseBoolean } from './libs/common/utils/parse-boolean.util'
import { RedisStore } from 'connect-redis'

import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const redis = new IORedis(process.env.REDIS_URL);

  app.use((cookieParser as any)(process.env.COOKIES_SECRET));

  app.use(
    (session as any)({
      // Настройки управления сессиями с использованием Redis
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
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
      },
      store: new RedisStore({
        client: redis,
        prefix: process.env.SESSION_FOLDER
      })
    })
  )

  app.enableCors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true,
    exposedHeaders: ['set-cookie']
  })

  await app.listen(process.env.APPLICATION_PORT ?? 3000);
}
bootstrap();
