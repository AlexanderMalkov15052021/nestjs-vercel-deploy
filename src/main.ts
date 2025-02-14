import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { createClient } from 'redis';

import * as session from 'express-session'
import { ConfigService } from '@nestjs/config'
import { ms, StringValue } from './libs/common/utils/ms.util'
import { parseBoolean } from './libs/common/utils/parse-boolean.util'
import { RedisStore } from 'connect-redis'

import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // const config = app.get(ConfigService)
  const redis = await createClient({ url: process.env.REDIS_URL }).connect();

  // app.use(
  //   (session as any)({  // ругается vercel без as any
  //     secret: config.getOrThrow<string>('SESSION_SECRET'),
  //     name: config.getOrThrow<string>('SESSION_NAME'),
  //     resave: true,
  //     saveUninitialized: false,
  //     cookie: {
  //       domain: config.getOrThrow<string>('SESSION_DOMAIN'),
  //       maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
  //       httpOnly: parseBoolean(
  //         config.getOrThrow<string>('SESSION_HTTP_ONLY')
  //       ),
  //       secure: parseBoolean(
  //         config.getOrThrow<string>('SESSION_SECURE')
  //       ),
  //       sameSite: 'lax'
  //     },
  //     store: new RedisStore({
  //       client: redis,
  //       prefix: config.getOrThrow<string>('SESSION_FOLDER')
  //     })
  //   })
  // )

  await app.listen(process.env.APPLICATION_PORT ?? 3000);
}
bootstrap();
