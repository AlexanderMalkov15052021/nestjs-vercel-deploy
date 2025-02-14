import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import IORedis from 'ioredis'
import * as cookieParser from 'cookie-parser'

import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const redis = new IORedis(process.env.REDIS_URL);

  app.use(cookieParser(process.env.COOKIES_SECRET));

  await app.listen(process.env.APPLICATION_PORT ?? 3000);
}
bootstrap();
