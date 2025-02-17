import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'
import session from 'express-session'
import pgConnect from 'connect-pg-simple';
import * as dotenv from 'dotenv';
import { ms, StringValue } from './libs/common/utils/ms.util';
import { parseBoolean } from './libs/common/utils/parse-boolean.util';
import { pool } from './db/pool.module';
import cors from 'cors';

dotenv.config();

const pgSession = (pgConnect as any)(session);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use((cookieParser as any)(process.env.COOKIES_SECRET));

  app.use(
    (session as any)({
      store: new pgSession({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true
      }),
      secret: process.env.SESSION_SECRET,
      name: process.env.SESSION_NAME,
      resave: true,
      saveUninitialized: false,
      cookie: {
        maxAge: ms(process.env.SESSION_MAX_AGE as StringValue),
        domain: process.env.SESSION_DOMAIN,
        httpOnly: parseBoolean(
          process.env.SESSION_HTTP_ONLY
        ),
        secure: parseBoolean(
          process.env.SESSION_SECURE
        ),
        sameSite: 'lax',
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

  app.use(cors({credentials: true, origin: process.env.ALLOWED_ORIGIN}));

  await app.listen(process.env.APPLICATION_PORT ?? 3000);
}
bootstrap();
