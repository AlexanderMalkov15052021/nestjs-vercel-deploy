import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'
import session from 'express-session'
import pgConnect from 'connect-pg-simple';
import * as dotenv from 'dotenv';
import express from 'express';
import { ms, StringValue } from './libs/common/utils/ms.util';
import { parseBoolean } from './libs/common/utils/parse-boolean.util';
import { pool } from './db/pool.module';

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
      cookie: {
        secure: true,
        sameSite: 'none',
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


  // proxy сервер для передачи куков
  const PORT = process.env.PORT || 5000

  const proxyApp = express();

  proxyApp.use(express.json());

  proxyApp.post('api/auth/login', async (req: any, res) => {

    const body = req.body;

    const serverReq = await fetch(`${process.env.APPLICATION_URL}/auth/login` as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(body)
    });

    const cookie = serverReq.headers.get('set-cookie');

    res.send({ cookie });
  })

  proxyApp.use(express.json())

  proxyApp.listen(PORT, () => console.log(`Server started on podt ${PORT}`))


}

bootstrap();
