import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'
import session from 'express-session'
import pgConnect from 'connect-pg-simple';
import * as dotenv from 'dotenv';
import { pool } from './db/pool.module';
import { ms, StringValue } from './libs/common/utils/ms.util';
import { ConfigService } from '@nestjs/config';

dotenv.config();

const pgSession = (pgConnect as any)(session);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService)
  app.use((cookieParser as any)(process.env.COOKIES_SECRET));

  app.use(
    (session as any)({
      store: new pgSession({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true
      }),
      resave: true,
      secret: process.env.SESSION_SECRET,
      name: process.env.SESSION_NAME,
      saveUninitialized: true,
      cookie: {
        domain: process.env.SESSION_DOMAIN,
        maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
        httpOnly: true,
        secure: config.getOrThrow<String>('SESSION_SECURE'),
        sameSite: 'lax'
      }
    })
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true,
    exposedHeaders: ['set-cookie'],
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "OPTIONS",
      "DELETE",
      "HEAD",
      "CONNECT",
      "TRACE"
    ]
  })

  await app.listen(process.env.APPLICATION_PORT ?? 3000);

}

bootstrap();
