import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'
import * as session from 'express-session'
import * as pgConnect from 'connect-pg-simple';
import * as dotenv from 'dotenv';
import { ms, StringValue } from './libs/common/utils/ms.util';
import { parseBoolean } from './libs/common/utils/parse-boolean.util';
import { pool } from './db/pool.module';

dotenv.config();

const pgSession = pgConnect(session);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser(process.env.COOKIES_SECRET));

  app.use(
    session({
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
    exposedHeaders: ['set-cookie']
  })

  await app.listen(process.env.APPLICATION_PORT ?? 3000);
}
bootstrap();
